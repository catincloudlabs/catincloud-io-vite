import os
import time
import concurrent.futures
import warnings
import pandas as pd
import numpy as np
import databento as db
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from tenacity import retry, wait_random_exponential, stop_after_attempt

# --- SILENCE THE NOISE ---
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="The size of this streaming request")

# --- CONFIGURATION ---
load_dotenv()
DATABENTO_KEY = os.getenv("DATABENTO_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not DATABENTO_KEY or not SUPABASE_URL:
    raise ValueError("❌ Missing Keys in .env (DATABENTO_API_KEY or SUPABASE keys)")

# CLIENTS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
db_client = db.Historical(DATABENTO_KEY)

# --- GLOBAL SETTINGS ---
# The Window: Jan 2026 (The Future Simulation)
# We fetch 2025 data to act as the "Seed" for the simulation.
START_DATE = "2025-01-02"
END_DATE = "2025-01-10"
BATCH_SIZE = 500

# Databento is heavy, so we throttle physics threads. 
PHYSICS_WORKERS = 4  

# --- THE GALAXY UNIVERSE ---
# UNCOMMENT THE BIG LIST BELOW FOR FULL BURN
ANCHOR_TICKERS = [
    "AAPL", "MSFT", "NVDA", "GOOGL",
    "AMZN", "META", "TSLA",
]

MANUAL_TICKERS = [
    "AAPL", "MSFT", "NVDA", "GOOGL",
    "AMZN", "META", "TSLA",
]

# FULL_UNIVERSE = [
#     "A", "AAL", "AAPL", "ABBV", "ABNB", "ABT", "ACGL", "ACN", "ADBE", "ADI", 
#     "ADM", "ADP", "ADSK", "AEE", "AEP", "AES", "AFL", "AFRM", "AGG", "AI", 
#     # ... (Paste your full 600 ticker list here when ready)
# ]

TICKER_UNIVERSE = list(set(MANUAL_TICKERS + ANCHOR_TICKERS))

# --- UTILS ---

def upload_physics_batch(records):
    """Uploads batch specifically to the new stocks_physics table."""
    if not records: return
    try:
        supabase.table("stocks_physics").upsert(
            records, 
            on_conflict="ticker,date", 
            ignore_duplicates=True
        ).execute()
        print(f" 💾 Saved {len(records)} physics frames to DB.")
    except Exception as e:
        print(f" ❌ DB Error (Batch Skipped): {str(e)[:100]}...")

# --- PHYSICS ENGINE (DATABENTO MICRO-PRECISION) ---

def fetch_physics_grade_data(ticker):
    # This fetches REAL Order Book (MBP-10) data.
    # It calculates the "Chandrasekhar Limit" (Floor Mass) and "Viscosity" (Liquidity thickness).
    
    print(f"   > 🔭 [Databento] Requesting Order Book Physics for {ticker}...")
    
    all_physics_frames = []
    
    # Set time pointers
    current_start = datetime.strptime(START_DATE, "%Y-%m-%d")
    final_end = datetime.strptime(END_DATE, "%Y-%m-%d")
    
    # LOOP BY DAY (instead of by month) to ensure we get a sample for EVERY day
    while current_start < final_end:
        current_end = current_start + timedelta(days=1)
        
        s_str = current_start.strftime("%Y-%m-%d")
        e_str = current_end.strftime("%Y-%m-%d")
        
        # Skip weekends (simple check)
        if current_start.weekday() >= 5:
            current_start = current_end
            continue
            
        try:
            # Request MBP-10 (Market by Price, 10 levels deep)
            # We fetch ONE DAY at a time. 
            # limit=10000 gives us the "Morning Physics" (approx first few seconds/minutes)
            data = db_client.timeseries.get_range(
                dataset="XNAS.ITCH",
                symbols=ticker,
                schema="mbp-10",           
                start=s_str,
                end=e_str,
                stype_in="raw_symbol",
                limit=10000 
            )
            
            try:
                df = data.to_df()
            except Exception:
                current_start = current_end
                continue
            
            if df.empty:
                current_start = current_end
                continue

            # --- PHYSICS CALCULATIONS ---
            
            # 1. Price Logic (Mid-Price at top of book)
            # Handle cases where bid/ask might be 0/NaN by filling or dropping
            df['bid_px_00'] = df['bid_px_00'].replace(0, np.nan)
            df['ask_px_00'] = df['ask_px_00'].replace(0, np.nan)
            df.dropna(subset=['bid_px_00', 'ask_px_00'], inplace=True)
            
            df['price'] = (df['bid_px_00'] + df['ask_px_00']) / 2
            
            # 2. CHANDRASEKHAR MASS (M_ch)
            # Sum the volume of the Buy Wall (Bid Levels 0-9)
            bid_size_cols = [c for c in df.columns if c.startswith("bid_sz")]
            df['floor_mass'] = df[bid_size_cols].sum(axis=1)
            
            # 3. VISCOSITY (Eta) -> For Reynolds Number
            df['spread'] = df['ask_px_00'] - df['bid_px_00']
            df['spread'] = df['spread'].replace(0, 0.01) 
            df['viscosity'] = df['bid_sz_00'] / df['spread']
            
            # 4. AGGREGATE (Direct Calculation)
            # Use the last observed price in this chunk as the 'close' for the physics frame
            close_price = df['price'].iloc[-1]
            
            # Use median for physics properties to ignore high-frequency noise/spikes
            floor_mass_med = df['floor_mass'].median()
            viscosity_med = df['viscosity'].median()
            
            # Create the record for stocks_physics table
            record = {
                "ticker": ticker,
                "date": s_str, 
                "close": float(close_price),
                "volume": 10000, # Placeholder volume since we capped it
                "chandrasekhar_mass": float(floor_mass_med),
                "viscosity": float(viscosity_med),
                "potential_energy": 0.0 
            }
            
            all_physics_frames.append(record)

        except Exception as e:
            # Silence errors for missing tickers to keep logs clean
            pass
        
        # Advance to next day
        current_start = current_end

    return all_physics_frames

# --- EXECUTION ---

if __name__ == "__main__":
    start_time = time.time()
    
    print("🚀 Initializing Reactor Ignition Sequence (FULL GALAXY)...")
    print(f"📅 Window: {START_DATE} to {END_DATE}")
    print(f"🔭 Target Universe: {len(TICKER_UNIVERSE)} Tickers")
    print(f"💾 Target Table: stocks_physics")
    
    all_physics_records = []
    
    # 1. RUN PHYSICS (Databento)
    with concurrent.futures.ThreadPoolExecutor(max_workers=PHYSICS_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_physics_grade_data, t): t for t in TICKER_UNIVERSE}
        
        completed_count = 0
        for future in concurrent.futures.as_completed(future_to_ticker):
            try:
                data = future.result()
                if data: 
                    all_physics_records.extend(data)
            except Exception as e:
                print(f"   ⚠️ Worker Error: {e}")
            
            completed_count += 1
            if completed_count % 20 == 0:
                print(f"   ... Processed {completed_count}/{len(TICKER_UNIVERSE)} tickers")

    print(f"📦 Storing {len(all_physics_records)} Physics Frames to Database...")
    for i in range(0, len(all_physics_records), BATCH_SIZE):
        batch = all_physics_records[i:i+BATCH_SIZE]
        upload_physics_batch(batch)
    
    print(f"\n✨ DATABENTO INGEST COMPLETE in {time.time() - start_time:.2f}s")
