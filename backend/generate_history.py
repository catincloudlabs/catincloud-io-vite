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
from sklearn.preprocessing import RobustScaler  # <--- FIX C

# 1. SETUP
load_dotenv()

timeout_config = httpx.Timeout(120.0, connect=10.0, read=120.0)
opts = ClientOptions(postgrest_client_timeout=120)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_KEY"),
    options=opts
)

# CONFIG
HISTORY_DAYS = 73
UMAP_NEIGHBORS = 30       
UMAP_MIN_DIST = 0.05      
TARGET_CANVAS_SIZE = 150 

# --- MATH UTILS ---

def normalize_to_bounds(matrix, target_radius=150):
    """ Forces the cluster to fill the screen (-150 to 150). """
    centroid = np.mean(matrix, axis=0)
    centered = matrix - centroid
    distances = np.linalg.norm(centered, axis=1)
    current_radius = np.percentile(distances, 95)
    if current_radius == 0: return matrix 
    scale_factor = target_radius / current_radius
    return centered * scale_factor

def align_to_reference(source_matrix, target_matrix, source_tickers, target_tickers):
    """ Rotates target_matrix (Today) to best fit source_matrix (Yesterday). """
    common_tickers = list(set(source_tickers) & set(target_tickers))
    if len(common_tickers) < 3: return target_matrix

    src_indices = [source_tickers.index(t) for t in common_tickers]
    tgt_indices = [target_tickers.index(t) for t in common_tickers]
    
    A = source_matrix[src_indices]
    B = target_matrix[tgt_indices]

    centroid_A = np.mean(A, axis=0)
    centroid_B = np.mean(B, axis=0)
    AA = A - centroid_A
    BB = B - centroid_B

    H = np.dot(BB.T, AA)
    U, S, Vt = np.linalg.svd(H)
    R = np.dot(Vt.T, U.T)

    if np.linalg.det(R) < 0:
        Vt[1, :] *= -1
        R = np.dot(Vt.T, U.T)

    return np.dot(target_matrix - centroid_B, R) + centroid_A

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
                if np.allclose(vec_np, 0): continue 

                headline = item.get('headline', '')
                sentiment = 0.0
                if headline:
                    try: sentiment = TextBlob(headline).sentiment.polarity
                    except: sentiment = 0.0
                
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

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print(f"🚀 Starting UMAP Walk-Forward Generation (Last {HISTORY_DAYS} Days)...")
    
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(HISTORY_DAYS)]
    dates.reverse() 
    
    full_history = []
    prev_matrix = None
    prev_tickers = []
    prev_positions_map = {} 
    
    for date_str in dates:
        print(f"📅 Processing {date_str}...", end=" ", flush=True)
        
        try:
            df = fetch_daily_vectors_rpc(date_str)
        except Exception as e:
            print(f"\n    ❌ Failed to fetch {date_str}: {e}")
            continue
        
        if df is None or df.empty or len(df) < 5:
            print("Skipped (Insufficient data)")
            continue
            
        current_matrix = np.stack(df['vector'].values)
        current_tickers = df['ticker'].tolist()
        
        # --- FIX C: ROBUST SCALER ---
        # We scale the High-Dimensional vectors BEFORE reducing them.
        # This prevents a single outlier day from squashing the entire map.
        scaler = RobustScaler()
        current_matrix_scaled = scaler.fit_transform(current_matrix)
        # ----------------------------
        
        # 1. INITIALIZATION (Fix A - Partial)
        # We seed UMAP with yesterday's layout to enforce temporal continuity.
        init_matrix = None
        if prev_matrix is not None:
            init_build = []
            for t in current_tickers:
                if t in prev_positions_map:
                    init_build.append(prev_positions_map[t])
                else:
                    init_build.append(np.random.normal(0, 10, 2)) 
            init_matrix = np.array(init_build)
            
        # 2. RUN UMAP (Fix A - Engine Upgrade)
        reducer = umap.UMAP(
            n_neighbors=min(UMAP_NEIGHBORS, len(df)-1),
            min_dist=UMAP_MIN_DIST,
            n_components=2,
            metric='cosine', 
            init=init_matrix if init_matrix is not None else 'spectral', 
            random_state=42,
            n_jobs=1
        )
        
        # Pass the SCALED matrix
        embeddings_raw = reducer.fit_transform(current_matrix_scaled)
        
        # 3. NORMALIZE & ALIGN
        embeddings_scaled = normalize_to_bounds(embeddings_raw, TARGET_CANVAS_SIZE)
        
        if prev_matrix is not None:
            embeddings_stabilized = align_to_reference(
                source_matrix=prev_matrix, 
                target_matrix=embeddings_scaled,
                source_tickers=prev_tickers, 
                target_tickers=current_tickers
            )
        else:
            embeddings_stabilized = embeddings_scaled
            
        # 4. CALCULATE PHYSICS & SAVE
        frame_nodes = []
        current_positions_map = {}
        
        for i, row in df.iterrows():
            ticker = row['ticker']
            x, y = embeddings_stabilized[i]
            
            vx, vy, energy = 0.0, 0.0, 0.0
            
            if ticker in prev_positions_map:
                prev_x, prev_y = prev_positions_map[ticker]
                vx = x - prev_x
                vy = y - prev_y
                energy = np.sqrt(vx**2 + vy**2) + 5.0 
            else:
                energy = 10.0 
            
            if np.isnan(x): x = 0
            if np.isnan(y): y = 0
            
            frame_nodes.append({
                "ticker": ticker,
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "vx": round(float(vx), 3),
                "vy": round(float(vy), 3),
                "energy": round(float(energy), 1),
                "headline": row['headline'],
                "sentiment": round(row['sentiment'], 2)
            })
            
            current_positions_map[ticker] = [x, y]
            
        full_history.append({
            "date": date_str,
            "nodes": frame_nodes
        })
            
        prev_matrix = embeddings_stabilized
        prev_tickers = current_tickers
        prev_positions_map = current_positions_map
        
        print(f"✅ Aligned & Saved ({len(df)} tickers)")

    # 5. EXPORT
    output_path = "../public/data/market_physics_history.json"
    with open(output_path, "w") as f:
        json.dump({"data": full_history}, f)
        
    print(f"\n✨ DONE. Stabilized History saved to {output_path}")
