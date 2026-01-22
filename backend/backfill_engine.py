import os
import requests
import time
import concurrent.futures
import warnings
import pandas as pd
import numpy as np
import databento as db
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from tenacity import retry, wait_random_exponential, stop_after_attempt

# --- SILENCE THE NOISE ---
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", message="The size of this streaming request")

# --- CONFIGURATION ---
load_dotenv()
DATABENTO_KEY = os.getenv("DATABENTO_API_KEY")
MASSIVE_KEY = os.getenv("MASSIVE_API_KEY") # Polygon Key
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not DATABENTO_KEY or not SUPABASE_URL:
    raise ValueError("❌ Missing Keys in .env")

# CLIENTS
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
db_client = db.Historical(DATABENTO_KEY)
openai_client = OpenAI(api_key=OPENAI_KEY)

# --- GLOBAL SETTINGS ---
# The Window: Jan 2026 (The Future Simulation)
# We fetch 2025 data to act as the "Seed" for the simulation.
START_DATE = "2025-01-02"
END_DATE = "2025-01-10"
BATCH_SIZE = 500

# Databento is heavy, so we throttle physics threads. 
# Polygon/OpenAI are fast, so we let them run wider.
PHYSICS_WORKERS = 4  
NEWS_WORKERS = 20    

# --- THE GALAXY UNIVERSE ---
# Currently set to Test Mode (7 Tickers)
ANCHOR_TICKERS = [
    "AAPL", "MSFT", "NVDA", "GOOGL",
    "AMZN", "META", "TSLA",
]

MANUAL_TICKERS = [
    "AAPL", "MSFT", "NVDA", "GOOGL",
    "AMZN", "META", "TSLA",
]

TICKER_UNIVERSE = list(set(MANUAL_TICKERS + ANCHOR_TICKERS))

# --- PART 1: THE PHYSICS ENGINE (DATABENTO MICRO-PRECISION) ---

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
            # This serves as a valid sample for Mass/Viscosity without downloading TBs of data.
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
                # No data for this day (holiday, etc)
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
            # Since we capped at 10k rows, we take the statistics of this chunk.
            
            # Use the last observed price in this chunk as the 'close' for the physics frame
            close_price = df['price'].iloc[-1]
            
            # Use median for physics properties to ignore high-frequency noise/spikes
            floor_mass_med = df['floor_mass'].median()
            viscosity_med = df['viscosity'].median()
            
            # Create the record
            record = {
                "ticker": ticker,
                "date": s_str, # Use the explicit start date of the loop
                "close": float(close_price),
                "chandrasekhar_mass": float(floor_mass_med),
                "viscosity": float(viscosity_med),
                "volume": 10000, # Placeholder volume since we capped it
                "potential_energy": 0.0 
            }
            
            all_physics_frames.append(record)
            # print(f"     ✅ {ticker} {s_str} captured.")

        except Exception as e:
            # print(f"     ⚠️ Physics Fetch Error ({ticker} on {s_str}): {e}")
            pass
        
        # Advance to next day
        current_start = current_end

    return all_physics_frames

# --- PART 2: THE NARRATIVE ENGINE (POLYGON + OPENAI) ---

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def get_embedding(text):
    text = text.replace("\n", " ")
    return openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding

def process_single_article(article):
    headline = article.get("title", "")
    description = article.get("description", "") or ""
    text_content = f"{headline}: {description}"
    url = article.get("article_url")
    
    if len(text_content) < 20 or not url: 
        return None, []

    try:
        vector = get_embedding(text_content)
        
        vector_record = {
            "ticker": "MARKET",
            "headline": headline,
            "published_at": article.get("published_utc"),
            "url": url,
            "embedding": vector
        }
        
        edge_stubs = []
        for t in article.get("tickers", []):
            edge_stubs.append({
                "source_url": url,
                "target_node": t,
                "weight": 1.0
            })
            
        return vector_record, edge_stubs
    except Exception as e:
        return None, []

def upload_news_batch(vectors, edges):
    if not vectors: return
    try:
        res = supabase.table("news_vectors").upsert(
            vectors, on_conflict="url"
        ).execute()
        
        if res.data:
            url_to_id = {item['url']: item['id'] for item in res.data}
            final_edges = []
            for edge_stub in edges:
                article_id = url_to_id.get(edge_stub['source_url'])
                if article_id:
                    final_edges.append({
                        "source_node": str(article_id),
                        "target_node": edge_stub['target_node'],
                        "edge_type": "MENTIONS",
                        "weight": edge_stub['weight']
                    })
            
            if final_edges:
                supabase.table("knowledge_graph").upsert(
                    final_edges, on_conflict="source_node,target_node,edge_type", ignore_duplicates=True
                ).execute()
                print(f"   ↳ Linked {len(final_edges)} graph edges.")
                
    except Exception as e:
        print(f" ❌ News Upload Error: {str(e)[:100]}")

def backfill_news():
    print(f"\n📰 Starting Parallel News Backfill ({START_DATE} to {END_DATE})...")
    
    url = f"https://api.polygon.io/v2/reference/news?published_utc.gte={START_DATE}&published_utc.lte={END_DATE}&limit=1000&sort=published_utc&order=desc&apiKey={MASSIVE_KEY}"
    
    total_processed = 0
    next_url = url
    
    while next_url:
        try:
            resp = requests.get(next_url, timeout=20)
            if resp.status_code != 200:
                print(f"❌ News Error {resp.status_code}")
                break
                
            data = resp.json()
            articles = data.get("results", [])
            
            if not articles: break
            
            print(f" 📥 Fetched {len(articles)} articles. Embedding...")
            
            page_vectors = []
            page_edges = []
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=NEWS_WORKERS) as executor:
                results = list(executor.map(process_single_article, articles))
                
                for vec, edges in results:
                    if vec:
                        page_vectors.append(vec)
                        page_edges.extend(edges)
            
            chunk_size = 50
            for i in range(0, len(page_vectors), chunk_size):
                upload_news_batch(page_vectors[i:i+chunk_size], page_edges)
                
            total_processed += len(page_vectors)
            print(f" ✅ Batch complete. Total embedded: {total_processed}")
            
            next_url = data.get("next_url")
            if next_url: next_url += f"&apiKey={MASSIVE_KEY}"
            else: break
            
        except Exception as e:
            print(f" ❌ Critical Error in News Loop: {e}")
            break

# --- EXECUTION ---

if __name__ == "__main__":
    start_time = time.time()
    
    print("🚀 Initializing Reactor Ignition Sequence (FULL GALAXY)...")
    print(f"📅 Window: {START_DATE} to {END_DATE}")
    print(f"🔭 Target Universe: {len(TICKER_UNIVERSE)} Tickers")
    
    all_stock_records = []
    
    # 1. RUN PHYSICS (Databento) - Throttled to avoid rate limits
    with concurrent.futures.ThreadPoolExecutor(max_workers=PHYSICS_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_physics_grade_data, t): t for t in TICKER_UNIVERSE}
        
        completed_count = 0
        for future in concurrent.futures.as_completed(future_to_ticker):
            try:
                data = future.result()
                if data: 
                    all_stock_records.extend(data)
            except Exception as e:
                print(f"   ⚠️ Worker Error: {e}")
            
            completed_count += 1
            if completed_count % 20 == 0:
                print(f"   ... Processed {completed_count}/{len(TICKER_UNIVERSE)} tickers")

    print(f"📦 Storing {len(all_stock_records)} Physics Frames to Database...")
    for i in range(0, len(all_stock_records), BATCH_SIZE):
        batch = all_stock_records[i:i+BATCH_SIZE]
        try:
            supabase.table("stocks_ohlc").upsert(batch, on_conflict="ticker,date").execute()
            print(f"   ✅ Batch {i//BATCH_SIZE + 1} Committed.")
        except Exception as e:
            print(f"   ⚠️ Batch Write Error: {e}")

    # 2. RUN NARRATIVE (Polygon)
    backfill_news()
    
    print(f"\n✨ FULL BACKFILL COMPLETE in {time.time() - start_time:.2f}s")
