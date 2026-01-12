import os
import json
import pandas as pd
import numpy as np
import umap
from sklearn.preprocessing import RobustScaler
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from tenacity import retry, stop_after_attempt, wait_exponential
import httpx
from textblob import TextBlob

# 1. SETUP
load_dotenv()

opts = ClientOptions(postgrest_client_timeout=120)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_KEY"),
    options=opts
)

# CONFIG
HISTORY_DAYS = 73
TARGET_CANVAS_SIZE = 150  # Radius from -150 to +150

# --- DATA FETCHING ---

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_daily_data(date_str):
    """
    Fetches both Vectors (News) and Volume (Mass) for a given date.
    Returns a merged DataFrame.
    """
    # A. Fetch Vectors via RPC
    vectors_rpc = supabase.rpc("get_daily_market_vectors", {
        "target_date": date_str,
        "page_size": 1000, # Fetch all in one go if possible, or paginated below
        "page_num": 0
    }).execute()
    
    if not vectors_rpc.data: return None

    df_vectors = pd.DataFrame(vectors_rpc.data)
    
    # Clean Vectors
    # Handle cases where vector is stringified JSON
    df_vectors['vector'] = df_vectors['vector'].apply(
        lambda x: np.array(json.loads(x) if isinstance(x, str) else x, dtype=np.float32)
    )

    # B. Fetch Volume (Mass) via Table Select
    # We need volume to calculate "Physics Mass"
    vol_resp = supabase.table("stocks_ohlc")\
        .select("ticker, volume")\
        .eq("date", date_str)\
        .execute()
        
    vol_map = {}
    if vol_resp.data:
        for row in vol_resp.data:
            vol_map[row['ticker']] = row['volume']

    # C. Merge & Sentiment
    results = []
    for _, row in df_vectors.iterrows():
        ticker = row['ticker']
        headline = row.get('headline', '')
        
        # Calculate Sentiment
        sentiment = 0
        if headline:
            try: sentiment = TextBlob(headline).sentiment.polarity
            except: sentiment = 0
            
        # Get Mass (Volume)
        # Default to median volume (1M) if missing, to prevent crash
        volume = vol_map.get(ticker, 1_000_000) 
        if volume is None: volume = 1_000_000
        
        results.append({
            "ticker": ticker,
            "vector": row['vector'],
            "volume": volume,
            "headline": headline,
            "sentiment": sentiment,
            "date": date_str
        })
        
    return pd.DataFrame(results)

# --- MATH ENGINE ---

def prepare_spacetime_cube(daily_frames):
    """
    Preprocesses the data for Aligned UMAP.
    1. Scales vectors robustly (removing outlier skew).
    2. Applies Mass Weighting (log(volume)).
    3. Builds the 'relations' dict that links Day N to Day N+1.
    """
    print("   ⚙️ Preprocessing Spacetime Cube...")
    
    dict_list = []      # The list of relations for UMAP
    matrix_list = []    # The list of vector matrices
    meta_list = []      # Metadata to reconstruct the output
    
    # Global Scaler: Fits on ALL data to ensure consistent space
    # (Optional: You could fit per day, but global is safer for drift)
    all_vectors = np.concatenate([np.stack(df['vector'].values) for df in daily_frames])
    scaler = RobustScaler().fit(all_vectors)

    for i in range(len(daily_frames)):
        df = daily_frames[i]
        
        # 1. Get Base Vectors
        raw_matrix = np.stack(df['vector'].values)
        
        # 2. Apply Robust Scaling (Centers and normalizes IQR)
        scaled_matrix = scaler.transform(raw_matrix)
        
        # 3. Apply Mass Weighting
        # "Heavier" stocks (High Volume) get pushed to outer shells
        # We use log(volume) to dampen the exponential differences
        volumes = df['volume'].values.astype(np.float32)
        # Normalize volume factor roughly around 1.0 to 2.0
        mass_factor = np.log1p(volumes) 
        mass_factor = mass_factor / np.median(mass_factor) # Normalize around median
        
        # Broadcast multiply: Vector * Mass
        weighted_matrix = scaled_matrix * mass_factor[:, np.newaxis]
        
        matrix_list.append(weighted_matrix)
        meta_list.append(df)
        
        # 4. Build Relations (The "Time Glue")
        # Maps index in Frame[i] -> index in Frame[i+1]
        if i < len(daily_frames) - 1:
            next_df = daily_frames[i+1]
            current_tickers = df['ticker'].tolist()
            next_tickers = next_df['ticker'].tolist()
            
            # Map ticker -> index for the next day
            next_map = {t: idx for idx, t in enumerate(next_tickers)}
            
            relation = {}
            for curr_idx, t in enumerate(current_tickers):
                if t in next_map:
                    relation[curr_idx] = next_map[t]
            
            dict_list.append(relation)

    return matrix_list, dict_list, meta_list

def normalize_globally(coords_list, target_radius=150):
    """
    Normalizes the entire 3D spacetime block to fit the screen.
    Uses a single scale factor for ALL days to preserve relative volatility.
    """
    # 1. Center everything
    all_coords = np.vstack(coords_list)
    centroid = np.mean(all_coords, axis=0)
    
    centered_list = [c - centroid for c in coords_list]
    all_centered = np.vstack(centered_list)
    
    # 2. Find Global Radius (95th percentile)
    distances = np.linalg.norm(all_centered, axis=1)
    global_radius = np.percentile(distances, 95)
    
    if global_radius == 0: global_radius = 1
    
    scale_factor = target_radius / global_radius
    
    print(f"   📏 Global Scale Factor: {scale_factor:.4f} (Radius: {global_radius:.2f})")
    
    return [c * scale_factor for c in centered_list]

# --- MAIN ---

if __name__ == "__main__":
    print(f"🚀 Starting Global Spacetime Alignment (Last {HISTORY_DAYS} Days)...")
    
    end_date = datetime.now()
    dates = [(end_date - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(HISTORY_DAYS)]
    dates.reverse() # Chronological Order: Oldest -> Newest
    
    # 1. Fetch Phase
    daily_frames = []
    print(f"📥 Fetching History...", end=" ", flush=True)
    for d in dates:
        try:
            df = fetch_daily_data(d)
            if df is not None and not df.empty and len(df) > 5:
                daily_frames.append(df)
        except Exception as e:
            print(f"x", end="", flush=True)
    print(f"\n   ✅ Loaded {len(daily_frames)} valid days.")

    if not daily_frames:
        print("❌ No data found. Exiting.")
        exit()

    # 2. Math Phase
    matrices, relations, metadata = prepare_spacetime_cube(daily_frames)
    
    print("   🧠 Running Aligned UMAP (This may take a moment)...")
    reducer = umap.AlignedUMAP(
        n_neighbors=15,     # Increased for global stability
        min_dist=0.1,
        n_components=2,
        metric='euclidean',
        random_state=42,
        n_epochs=200        # Enough for convergence
    )
    
    # The Magic Line: Solves the entire history at once
    embeddings_list = reducer.fit_transform(matrices, relations=relations)
    
    # 3. Normalization Phase
    embeddings_list = normalize_globally(embeddings_list, TARGET_CANVAS_SIZE)

    # 4. Export Phase
    full_history = []
    
    for i, coords in enumerate(embeddings_list):
        meta_df = metadata[i]
        date_str = meta_df.iloc[0]['date']
        
        for idx, row in meta_df.iterrows():
            x, y = coords[idx]
            full_history.append({
                "date": date_str,
                "ticker": row['ticker'],
                "x": round(float(x), 2),
                "y": round(float(y), 2),
                "headline": row['headline'],
                "sentiment": round(row['sentiment'], 2)
            })

    output_path = "../public/data/market_physics_history.json"
    with open(output_path, "w") as f:
        json.dump({"data": full_history}, f)
        
    print(f"✨ DONE. Spacetime Block saved to {output_path}")
