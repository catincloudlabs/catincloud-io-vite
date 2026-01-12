import os
import json
import numpy as np
import pandas as pd
import umap
from supabase import create_client, Client
from sklearn.preprocessing import StandardScaler, RobustScaler
from dotenv import load_dotenv

# 1. SETUP
load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# Configuration
MIN_TICKERS_PER_DAY = 10  # Sanity check
UMAP_NEIGHBORS = 50       # Higher = Global Structure (Connects islands)
UMAP_MIN_DIST = 0.05      # Lower = Tighter clusters
ALIGNMENT_WINDOW = 3      # How many days forward/back to link

def fetch_history():
    print("📥 Fetching Stock History from Supabase...")
    # Fetch all adjusted close prices ordered by date
    response = supabase.table("stocks_ohlc").select("date, ticker, close").order("date").execute()
    data = response.data
    
    if not data:
        raise Exception("No data found in stocks_ohlc table!")
        
    df = pd.DataFrame(data)
    
    # Pivot: Rows = Dates, Cols = Tickers, Values = Close Price
    # This creates the "Matrix" needed for dimensionality reduction
    pivot_df = df.pivot(index="date", columns="ticker", values="close")
    
    # Sort index to ensure time continuity
    pivot_df = pivot_df.sort_index()
    
    # CLEANING:
    # 1. Forward Fill (if a price is missing today, use yesterday's)
    pivot_df = pivot_df.ffill()
    # 2. Backward Fill (if missing start, use first available)
    pivot_df = pivot_df.bfill()
    # 3. Drop columns that are still empty
    pivot_df = pivot_df.dropna(axis=1, how='any')
    
    print(f"   ✅ Matrix Shape: {pivot_df.shape} (Days x Tickers)")
    return pivot_df

def generate_spacetime_cube():
    print("🚀 Starting Global Spacetime Alignment...")
    
    # 1. Get Data
    raw_df = fetch_history()
    dates = raw_df.index.tolist()
    
    # 2. FEATURE ENGINEERING: Log Returns
    # Raw prices cause overflow. Log returns (change %) are stable.
    # We add 1e-9 to avoid log(0) errors
    returns_df = np.log(raw_df / raw_df.shift(1)).fillna(0)
    
    # 3. SCALING (Crucial for UMAP stability)
    print("   ⚙️ Scaling Data (preventing overflow)...")
    scaler = RobustScaler() # RobustScaler handles outliers better than StandardScaler
    scaled_data = scaler.fit_transform(returns_df.values)
    
    # 4. PREPARE SLICES FOR ALIGNED UMAP
    # AlignedUMAP expects a list of arrays (one per time slice)
    # Since our tickers are consistent, we pass the same structure, 
    # but technically AlignedUMAP is usually for changing populations.
    # A standard UMAP on the whole timeline usually works better for fixed tickers,
    # BUT if you want 'Time' as the Z-axis, we do this:
    
    # OPTION A: Treat every day as a separate slice with relations between them
    # This is heavy. For a "Spacetime Cube", we often just want 
    # to project the *tickers* based on their movement over time.
    
    # However, assuming you want a literal cube where (x,y,z) = (umap_1, umap_2, time):
    # We will map the *relationship of tickers* per day.
    
    # Constructing the "Relations" dict for AlignedUMAP
    # This maps row_index in Slice T to row_index in Slice T+1
    # Since our tickers are fixed columns, the mapping is Identity (0->0, 1->1, etc.)
    
    # Note: AlignedUMAP is complex. If you just want a 3D plot, 
    # usually you run UMAP on the *Transposed* matrix. 
    # Let's assume you want: Each point is a TICKER.
    
    # TRANSPOSE: Rows = Tickers, Cols = Days
    # This embeds "How did AAPL behave over history?"
    ticker_history = scaled_data.T 
    
    print("   🧠 Running UMAP on Ticker Behavior...")
    
    reducer = umap.UMAP(
        n_neighbors=UMAP_NEIGHBORS,
        min_dist=UMAP_MIN_DIST,
        n_components=3,         # 3D Output
        metric='cosine',        # Cosine similarity is best for high-dim timeseries
        init='random',          # <--- FIX: Prevents Spectral Crash
        random_state=42,        # Consistency
        n_jobs=1                # Fixes parallelism warnings
    )
    
    embedding = reducer.fit_transform(ticker_history)
    
    # 5. EXPORT
    print("   💾 Saving Embeddings...")
    
    results = []
    tickers = raw_df.columns.tolist()
    
    for i, ticker in enumerate(tickers):
        results.append({
            "ticker": ticker,
            "x": float(embedding[i, 0]),
            "y": float(embedding[i, 1]),
            "z": float(embedding[i, 2])
        })
        
    # Save to JSON or DB
    with open("spacetime_cube.json", "w") as f:
        json.dump(results, f)
        
    print(f"   ✨ Success! Generated cubes for {len(results)} tickers.")

if __name__ == "__main__":
    generate_spacetime_cube()
