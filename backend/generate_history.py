import os
import json
import pandas as pd
import numpy as np
import umap
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
from textblob import TextBlob

# --- HISTORY GENERATION ENGINE ---
# Calculates daily market physics vectors using anchored UMAP projection 
# and Procrustes alignment for temporal stability.

load_dotenv()

timeout_config = httpx.Timeout(120.0, connect=10.0, read=120.0)
opts = ClientOptions(postgrest_client_timeout=120)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_KEY"),
    options=opts
)

# Configuration
HISTORY_DAYS = 90
N_NEIGHBORS = 30     
MIN_DIST = 0.1       
METRIC = 'cosine'    
TARGET_CANVAS_SIZE = 150 

ANCHOR_TICKERS = [
    "SPY", "QQQ", "IWM", "DIA",       
    "AAPL", "MSFT", "NVDA", "GOOGL",  
    "AMZN", "META", "TSLA",           
    "JPM", "V", "UNH", "XOM"          
]

# --- MATH UTILS ---

def normalize_to_bounds(matrix, target_radius=150):
    # Center the data at (0,0)
    centroid = np.mean(matrix, axis=0)
    centered = matrix - centroid
    
    # Find the current max distance from center (95th percentile to ignore outliers)
    distances = np.linalg.norm(centered, axis=1)
    current_radius = np.percentile(distances, 95)
    
    if current_radius == 0: return matrix # Safety check

    # Scale it up/down to match target_radius
    scale_factor = target_radius / current_radius
    return centered * scale_factor

def align_to_reference(source_matrix, target_matrix, source_tickers, target_tickers):
    # Identify Common anchors
    common_anchors = list(
        set(source_tickers) & set(target_tickers) & set(ANCHOR_TICKERS)
    )
    
    if len(common_anchors) < 3:
        common_anchors = list(set(source_tickers) & set(target_tickers))
    
    if len(common_anchors) < 3:
        return target_matrix
        
    # Extract Coordinates for anchors
    src_indices = [source_tickers.index(t) for t in common_anchors]
    tgt_indices = [target_tickers.index(t) for t in common_anchors]
    
    A_anchors = source_matrix[src_indices]
    B_anchors = target_matrix[tgt_indices]

    # 3. Calculate centroids based on anchors
    centroid_A = np.mean(A_anchors, axis=0)
    centroid_B = np.mean(B_anchors, axis=0)

    # 4. Center anchors
    AA = A_anchors - centroid_A
    BB = B_anchors - centroid_B

    # 5. Compute Rotation (SVD) anchors
    H = np.dot(BB.T, AA)
    U, S, Vt = np.linalg.svd(H)
    R = np.dot(U, Vt)

    # Handle reflection (ensure strictly rotation, not mirror image)
    if np.linalg.det(R) < 0:
        Vt[1, :] *= -1
        R = np.dot(U, Vt)

    # Shift the full matrix by the anchor centroid, rotate, then shift back
    aligned_matrix = np.dot(target_matrix - centroid_B, R) + centroid_A
    
    return aligned_matrix

@retry(stop=stop_after_attempt(5), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_daily_vectors_rpc(target_date):
    all_records = []
    page = 0
    page_size = 100
    while True:
        try:
            resp = supabase.rpc("get_daily_market_vectors", {
                "target_date": target_date,
                "page_size": page_size,
                "page_num": page
            }).execute()
            if not resp.data: break
            for item in resp.data:
                vec = item['vector']
                if isinstance(vec, str): vec = json.loads(vec)
                vec_np = np.array(vec, dtype=np.float32)
                headline = item.get('headline', '')
                sentiment = 0
                if headline:
                    try: sentiment = TextBlob(headline).sentiment.polarity
                    except: sentiment = 0
                all_records.append({
                    "ticker": item['ticker'],
                    "vector": vec_np,
                    "headline": headline,    
                    "sentiment": sentiment   
                })
            if len(resp.data) < page_size: break
            page += 1
        except Exception as e:
            print(f"    ⚠️ Error on page {page}: {e}")
            raise e
    return pd.DataFrame(all_records)

# --- EXECUTION ---

if __name__ == "__main__":
    print(f"🚀 Starting Stabilized Walk-Forward Generation...")
    
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(HISTORY_DAYS)]
    dates.reverse() 
    
    full_history = []
    prev_matrix = None
    prev_tickers = None
    
    for date_str in dates:
        print(f"📅 Processing {date_str}...", end=" ", flush=True)
        
        try:
            df = fetch_daily_vectors_rpc(date_str)
        except Exception as e:
            print(f"\n   ❌ Failed to fetch {date_str}: {e}")
            continue
        
        if df is None or df.empty:
            print("Skipped (No data)")
            continue
            
        current_matrix = np.stack(df['vector'].values)
        current_tickers = df['ticker'].tolist()
        
        if len(df) < 5: 
            print("Skipped (Not enough data)")
            continue

        # Initialization
        init_matrix = None
        
        if prev_matrix is not None:
            prev_map = {t: pos for t, pos in zip(prev_tickers, prev_matrix)}
            init_build = []
            
            # Calculate the mean position to use as a fallback for new tickers
            default_pos = np.mean(prev_matrix, axis=0) 
            
            for t in current_tickers:
                if t in prev_map:
                    init_build.append(prev_map[t])
                else:
                    # Add a tiny bit of noise to the center so they don't stack perfectly
                    jitter = np.random.normal(0, 1, 2)
                    init_build.append(default_pos + jitter)
                    
            init_matrix = np.array(init_build, dtype=np.float32)
            
        # Dimensionality Reduction
        reducer = umap.UMAP(
            n_neighbors=N_NEIGHBORS,
            min_dist=MIN_DIST,
            n_components=2,
            metric=METRIC,
            init=init_matrix if init_matrix is not None else 'spectral',
            random_state=42,
            n_jobs=1 
        )
        
        embeddings_raw = reducer.fit_transform(current_matrix)
        embeddings_scaled = normalize_to_bounds(embeddings_raw, TARGET_CANVAS_SIZE)

        # Procrustes alignment
        if prev_matrix is not None:
            embeddings_stabilized = align_to_reference(
                source_matrix=prev_matrix, 
                target_matrix=embeddings_scaled,
                source_tickers=prev_tickers, 
                target_tickers=current_tickers
            )
        else:
            embeddings_stabilized = embeddings_scaled
            
        # Save
        for i, row in df.iterrows():
            ticker = row['ticker']
            x, y = embeddings_stabilized[i]
            
            full_history.append({
                "date": date_str,
                "ticker": ticker,
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "headline": row['headline'],
                "sentiment": round(row['sentiment'], 2)
            })
            
        prev_matrix = embeddings_stabilized
        prev_tickers = current_tickers
        
        print(f"✅ Aligned & Saved ({len(df)} tickers)")

    output_path = "../public/data/market_physics_history.json"
    with open(output_path, "w") as f:
        json.dump({"data": full_history}, f)
        
    print(f"\n✨ DONE. Stabilized History saved to {output_path}")
