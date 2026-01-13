import os
import json
import pandas as pd
import numpy as np
import umap  # CHANGED: Import UMAP
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
from textblob import TextBlob

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
HISTORY_DAYS = 90
# UMAP Params
N_NEIGHBORS = 30     # Controls how much local vs global structure is preserved
MIN_DIST = 0.1       # Controls how tightly points are packed together
METRIC = 'cosine'    # Cosine distance is usually better for embeddings
TARGET_CANVAS_SIZE = 150 

# --- MATH UTILS ---

def normalize_to_bounds(matrix, target_radius=150):
    """
    Forces the cluster to fill the screen (-150 to 150).
    """
    # 1. Center the data at 0,0
    centroid = np.mean(matrix, axis=0)
    centered = matrix - centroid
    
    # 2. Find the current max distance from center (95th percentile to ignore outliers)
    distances = np.linalg.norm(centered, axis=1)
    current_radius = np.percentile(distances, 95)
    
    if current_radius == 0: return matrix # Safety check

    # 3. Scale it up/down to match target_radius
    scale_factor = target_radius / current_radius
    return centered * scale_factor

def align_to_reference(source_matrix, target_matrix, source_tickers, target_tickers):
    """
    Rotates target_matrix (Today) to best fit source_matrix (Yesterday).
    Even with UMAP init, this rigid alignment helps prevent slow rotational drift.
    """
    common_tickers = list(set(source_tickers) & set(target_tickers))
    
    if len(common_tickers) < 3:
        return target_matrix

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

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    print(f"🚀 Starting Stabilized Walk-Forward Generation (UMAP)...")
    
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

        # 1. Initialization (Temporal Anchoring)
        # If we have yesterday's map, we use those coordinates as the starting point 
        # for today's reduction. This is the key to smoothness.
        init_matrix = None
        
        if prev_matrix is not None:
            prev_map = {t: pos for t, pos in zip(prev_tickers, prev_matrix)}
            init_build = []
            
            # Calculate the mean position to use as a fallback for new tickers
            # (Instead of random, which can pull the map apart)
            default_pos = np.mean(prev_matrix, axis=0) 
            
            for t in current_tickers:
                if t in prev_map:
                    init_build.append(prev_map[t])
                else:
                    # Add a tiny bit of noise to the center so they don't stack perfectly
                    jitter = np.random.normal(0, 1, 2)
                    init_build.append(default_pos + jitter)
                    
            init_matrix = np.array(init_build, dtype=np.float32)
            
        # 2. Run UMAP
        # init='spectral' is default, but we pass our custom matrix if available
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
        
        # 3. Normalize Scale
        embeddings_scaled = normalize_to_bounds(embeddings_raw, TARGET_CANVAS_SIZE)

        # 4. Procrustes Alignment (Fine-tuning)
        # Even with UMAP init, the whole map might rotate slightly. This locks it down.
        if prev_matrix is not None:
            embeddings_stabilized = align_to_reference(
                source_matrix=prev_matrix, 
                target_matrix=embeddings_scaled,
                source_tickers=prev_tickers, 
                target_tickers=current_tickers
            )
        else:
            embeddings_stabilized = embeddings_scaled
            
        # 5. Save
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

    # 6. Export
    output_path = "../public/data/market_physics_history.json"
    with open(output_path, "w") as f:
        json.dump({"data": full_history}, f)
        
    print(f"\n✨ DONE. Stabilized History saved to {output_path}")
