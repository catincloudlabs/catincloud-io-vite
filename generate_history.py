import os
import json
import pandas as pd
import numpy as np
import umap
import warnings
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
from textblob import TextBlob

# --- HISTORY GENERATION ENGINE ---
# "Sector Supernova" Edition
# Adaptive UMAP + Physics Enrichment (Databento)

load_dotenv()
warnings.filterwarnings('ignore') # Silence UMAP warnings for small datasets

timeout_config = httpx.Timeout(120.0, connect=10.0, read=120.0)
opts = ClientOptions(postgrest_client_timeout=120)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_KEY"),
    options=opts
)

# Configuration
HISTORY_DAYS = 20
TARGET_CANVAS_SIZE = 150 
# Note: UMAP params are now dynamic based on data size

# The "Fixed Points" of the universe. 
# Even if we only have 4 tickers, we list the majors so the logic holds when we scale up.
ANCHOR_TICKERS = [
    "SPY", "QQQ", "IWM", "DIA",       
    "AAPL", "MSFT", "NVDA", "GOOGL",  
    "AMZN", "META", "TSLA",           
    "JPM", "V", "UNH", "XOM",
    "AMD", "GME"
]

# --- MATH UTILS ---

def normalize_to_bounds(matrix, target_radius=150):
    if len(matrix) == 0: return matrix
    centroid = np.mean(matrix, axis=0)
    centered = matrix - centroid
    distances = np.linalg.norm(centered, axis=1)
    # If we have very few points, use max instead of percentile to avoid squashing
    current_radius = np.max(distances) if len(distances) < 10 else np.percentile(distances, 95)
    
    if current_radius == 0: return matrix 
    scale_factor = target_radius / current_radius
    return centered * scale_factor

def align_to_reference(source_matrix, target_matrix, source_tickers, target_tickers):
    # Find overlapping tickers
    common = list(set(source_tickers) & set(target_tickers))
    
    # If we have too few common points, we can't rotate safely.
    # For a Micro-Universe (4 tickers), we just center them. Procrustes needs more geometry.
    if len(common) < 3:
        return target_matrix
        
    src_indices = [source_tickers.index(t) for t in common]
    tgt_indices = [target_tickers.index(t) for t in common]
    
    A = source_matrix[src_indices]
    B = target_matrix[tgt_indices]

    centroid_A = np.mean(A, axis=0)
    centroid_B = np.mean(B, axis=0)
    
    AA = A - centroid_A
    BB = B - centroid_B

    H = np.dot(BB.T, AA)
    U, S, Vt = np.linalg.svd(H)
    R = np.dot(U, Vt)

    if np.linalg.det(R) < 0:
        Vt[1, :] *= -1
        R = np.dot(U, Vt)

    return np.dot(target_matrix - centroid_B, R) + centroid_A

# --- DATA FETCHERS ---

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=5))
def fetch_vectors_and_physics(target_date):
    """
    Combined Fetcher: Gets Geometry (Vectors) AND Physics (Mass/Viscosity)
    This prevents the 'N+1 Query' problem and missing data.
    """
    try:
        # 1. Fetch UMAP Vectors (The "Mind")
        vec_resp = supabase.rpc("get_daily_market_vectors", {
            "target_date": target_date,
            "page_size": 1000,
            "page_num": 0
        }).execute()
        
        if not vec_resp.data: return None

        # Process Vectors
        vector_data = []
        for item in vec_resp.data:
            vec = item['vector']
            if isinstance(vec, str): vec = json.loads(vec)
            
            headline = item.get('headline', '')
            sentiment = TextBlob(headline).sentiment.polarity if headline else 0
            
            vector_data.append({
                "ticker": item['ticker'],
                "vector": np.array(vec, dtype=np.float32),
                "headline": headline,
                "sentiment": sentiment
            })
        
        df_vec = pd.DataFrame(vector_data)

        # 2. Fetch Physics (The "Body")
        phys_resp = supabase.table("stocks_ohlc")\
            .select("ticker, close, market_cap, chandrasekhar_mass, viscosity, volume")\
            .eq("date", target_date)\
            .execute()
            
        df_phys = pd.DataFrame(phys_resp.data) if phys_resp.data else pd.DataFrame()

        # 3. Merge
        if not df_phys.empty:
            df_final = pd.merge(df_vec, df_phys, on="ticker", how="left")
        else:
            df_final = df_vec
            # Fill defaults if physics missing
            for col in ['market_cap', 'chandrasekhar_mass', 'viscosity', 'volume', 'close']:
                df_final[col] = 0

        df_final.fillna(0, inplace=True)
        return df_final

    except Exception as e:
        print(f"    ⚠️ Fetch Error: {e}")
        return None

# --- EXECUTION ---

if __name__ == "__main__":
    print(f"🚀 Starting Sector Supernova Generation...")
    
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(HISTORY_DAYS)]
    dates.reverse() 
    
    full_history = []
    prev_matrix = None
    prev_tickers = None
    
    for date_str in dates:
        print(f"📅 {date_str}...", end=" ", flush=True)
        
        df = fetch_vectors_and_physics(date_str)
        
        if df is None or df.empty or len(df) < 2:
            print("Skipped (Low Data)")
            continue
            
        current_matrix = np.stack(df['vector'].values)
        current_tickers = df['ticker'].tolist()
        
        # --- ADAPTIVE PHYSICS ---
        # If we have < 15 points, UMAP breaks. We switch to PCA or simple layout.
        # But for consistency, we just tune UMAP neighbors to be (N - 1).
        
        n_points = len(df)
        adaptive_neighbors = min(30, n_points - 1) 
        
        if adaptive_neighbors < 2:
             # Fallback for single/dual points: Just put them in the middle
            embeddings_scaled = np.zeros((n_points, 2))
        else:
            reducer = umap.UMAP(
                n_neighbors=adaptive_neighbors, # <--- THE FIX
                min_dist=0.1,
                n_components=2,
                metric='cosine',
                random_state=42,
                n_jobs=1 
            )
            embeddings_raw = reducer.fit_transform(current_matrix)
            embeddings_scaled = normalize_to_bounds(embeddings_raw, TARGET_CANVAS_SIZE)

        # Stabilize
        if prev_matrix is not None:
            embeddings_stabilized = align_to_reference(
                prev_matrix, embeddings_scaled, prev_tickers, current_tickers
            )
        else:
            embeddings_stabilized = embeddings_scaled
            
        # Assemble Frame
        for i, row in df.iterrows():
            ticker = row['ticker']
            x, y = embeddings_stabilized[i]
            
            full_history.append({
                "date": date_str,
                "ticker": ticker,
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "headline": row['headline'],
                "sentiment": round(row['sentiment'], 2),
                
                # PHYSICS PAYLOAD
                "market_cap": float(row.get('market_cap', 0)),
                "chandrasekhar_mass": float(row.get('chandrasekhar_mass', 0)),
                "viscosity": float(row.get('viscosity', 0)),
                "volume": int(row.get('volume', 0)),
                "price": float(row.get('close', 0))
            })
            
        prev_matrix = embeddings_stabilized
        prev_tickers = current_tickers
        print(f"✅ ({len(df)} tickers)")

    # Output
    output_path = "../public/data/market_physics_history.json"
    with open(output_path, "w") as f:
        json.dump({"data": full_history}, f)
        
    print(f"\n✨ GENERATION COMPLETE: {output_path}")
