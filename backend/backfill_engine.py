import os
import requests
import time
import concurrent.futures
import numpy as np  # PATCH 1: Added for math validation
from collections import Counter # PATCH 2: Added for day counting
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from tenacity import retry, wait_random_exponential, stop_after_attempt

# 1. SETUP
load_dotenv()
MASSIVE_KEY = os.getenv("MASSIVE_API_KEY")
POLYGON_BASE_URL = "https://api.polygon.io" 

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# --- CONFIGURATION: TARGETED REGIME ---
START_DATE = "2025-11-01"
END_DATE = datetime.now().strftime('%Y-%m-%d')
MAX_WORKERS = 20 
DB_BATCH_SIZE = 200

# The Curated Universe (242 Tickers)
TICKER_UNIVERSE = [
    "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "BRK.B", "LLY", "AVGO", "JPM",
    "AMD", "QCOM", "TXN", "INTC", "AMAT", "MU", "LRCX", "ADI", "KLAC", "MRVL", "SNPS", 
    "CDNS", "PANW", "CRWD", "PLTR", "SMCI", "ARM", "TSM", "ASML", "ON", "MCHP", "STM",
    "ORCL", "ADBE", "CRM", "INTU", "IBM", "NOW", "UBER", "SAP", "FI", "ADP", "ACN", 
    "CSCO", "SQ", "SHOP", "WDAY", "SNOW", "TEAM", "ADSK", "DDOG", "ZM", "NET", "TTD",
    "MDB", "ZS", "GIB", "FICO", "ANET", "ESTC",
    "V", "MA", "BAC", "WFC", "MS", "GS", "C", "BLK", "SPGI", "AXP", "MCO", "PGR", "CB", 
    "MMC", "AON", "USB", "PNC", "TFC", "COF", "DFS", "PYPL", "AFRM", "HOOD", "COIN",
    "KKR", "BX", "APO", "TRV", "ALL", "HIG", "MET",
    "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "DHR", "PFE", "AMGN", "ISRG", "ELV", 
    "VRTX", "REGN", "ZTS", "BSX", "BDX", "GILD", "HCA", "MCK", "CI", "HUM", "CVS", 
    "BMY", "SYK", "EW", "MDT", "DXCM", "ILMN", "ALGN", "BIIB", "MRNA", "BNTX",
    "WMT", "PG", "COST", "HD", "KO", "PEP", "MCD", "DIS", "NKE", "SBUX", "LOW", "PM", 
    "TGT", "TJX", "EL", "CL", "MO", "LULU", "CMG", "MAR", "BKNG", "ABNB", "HLT", "YUM",
    "DE", "CAT", "HON", "GE", "MMM", "ETN", "ITW", "EMR", "PH", "CMI", "PCAR", "TT",
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HES", "KMI", "WMB",
    "LMT", "RTX", "BA", "GD", "NOC", "LHX", "TDG", "GE", "WM", "RSG", "UNP", "CSX", "NSC",
    "DAL", "UAL", "AAL", "LUV", "FDX", "UPS",
    "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "VEA", "VWO",
    "XLK", "XLV", "XLF", "XLE", "XLC", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE",
    "SMH", "SOXX", "XBI", "KRE", "KBE", "JETS", "ITB",
    "TLT", "IEF", "SHY", "LQD", "HYG", "AGG", "BND",
    "GLD", "SLV", "USO", "UNG", "DBC",
    "VIXY", "UVXY", "VXX", "TQQQ", "SQQQ", "SOXL", "SOXS", "SPXU", "UPRO", "LABU", "LABD", "TMF", "TMV"
]

# --- ROBUST UTILS ---

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def get_embedding(text):
    text = text.replace("\n", " ")
    try:
        vector = openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding
        
        # PATCH 1: The "Zero Vector" Firewall
        # Prevents UMAP Overflow by rejecting corrupt math
        if np.isnan(vector).any():
            print(f"⚠️ OpenAI returned NaNs. Skipping...")
            return None
        if np.allclose(vector, 0):
            print(f"⚠️ OpenAI returned Zero-Vector. Skipping...")
            return None
            
        return vector
    except Exception as e:
        print(f"Embedding Error: {e}")
        return None

def upload_stock_batch(records):
    if not records: return
    try:
        supabase.table("stocks_ohlc").upsert(
            records, 
            on_conflict="ticker,date"
            # PATCH 3: Removed ignore_duplicates=True so we overwrite bad data
        ).execute()
        print(f" 💾 Saved {len(records)} rows to DB.")
    except Exception as e:
        print(f" ❌ DB Error (Batch Skipped): {str(e)[:100]}...")

def upload_news_batch(vectors, edges):
    """ Helper to atomically upload a batch of news """
    if not vectors: return
    try:
        # 1. Upload Vectors (Must happen first to get IDs)
        res = supabase.table("news_vectors").upsert(
            vectors, 
            on_conflict="url"
        ).execute()
        
        # 2. Map new IDs to edges
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
                    final_edges, 
                    on_conflict="source_node,target_node,edge_type", 
                    ignore_duplicates=True
                ).execute()
                print(f"   ↳ Linked {len(final_edges)} graph edges.")
                
    except Exception as e:
        print(f" ❌ News Upload Error: {str(e)[:100]}")

# --- PART 1: OPTIMIZED STOCK HISTORY ---

@retry(stop=stop_after_attempt(5), wait=wait_random_exponential(min=1, max=10))
def fetch_ticker_history(ticker):
    url = f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{START_DATE}/{END_DATE}?adjusted=true&sort=asc&apiKey={MASSIVE_KEY}"
    
    resp = requests.get(url, timeout=15)
    
    if resp.status_code == 429:
        raise Exception("Rate Limited")
        
    if resp.status_code != 200:
        return []
        
    data = resp.json()
    if "results" not in data: return []
        
    records = []
    for bar in data["results"]:
        date_str = datetime.fromtimestamp(bar["t"] / 1000).strftime('%Y-%m-%d')
        records.append({
            "ticker": ticker,
            "date": date_str,
            "open": bar.get("o"),
            "high": bar.get("h"),
            "low": bar.get("l"),
            "close": bar.get("c"),
            "volume": bar.get("v")
        })
    return records

# --- PART 2: PARALLELIZED NEWS ARCHIVE ---

def process_single_article(article):
    """ Worker function to process one article independently """
    headline = article.get("title", "")
    description = article.get("description", "") or ""
    text_content = f"{headline}: {description}"
    url = article.get("article_url")
    
    if len(text_content) < 20 or not url: 
        return None, []

    # Get safe embedding (handles None returns)
    vector = get_embedding(text_content)
    if vector is None:
        return None, []

    try:
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

def backfill_news():
    print(f"\n📰 Starting Parallel News Backfill ({START_DATE} to {END_DATE})...")
    
    url = f"{POLYGON_BASE_URL}/v2/reference/news?published_utc.gte={START_DATE}&published_utc.lte={END_DATE}&limit=1000&sort=published_utc&order=desc&apiKey={MASSIVE_KEY}"
    
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
            
            print(f" 📥 Fetched {len(articles)} articles. Crunching embeddings in parallel...")
            
            page_vectors = []
            page_edges = []
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                results = list(executor.map(process_single_article, articles))
                
                for vec, edges in results:
                    if vec:
                        page_vectors.append(vec)
                        page_edges.extend(edges)
            
            chunk_size = 50
            for i in range(0, len(page_vectors), chunk_size):
                upload_news_batch(
                    page_vectors[i:i+chunk_size], 
                    page_edges 
                )
                
            total_processed += len(page_vectors)
            print(f" ✅ Page complete. Total embedded: {total_processed}")
            
            next_url = data.get("next_url")
            if next_url: next_url += f"&apiKey={MASSIVE_KEY}"
            else: break
            
        except Exception as e:
            print(f" ❌ Critical Error in News Loop: {e}")
            break

# --- EXECUTION ---

if __name__ == "__main__":
    start_time = time.time()
    
    # 1. STOCKS
    print(f"🚀 Backfilling STOCKS for {len(TICKER_UNIVERSE)} tickers...")
    all_stock_records = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_ticker_history, t): t for t in TICKER_UNIVERSE}
        completed = 0
        for future in concurrent.futures.as_completed(future_to_ticker):
            try:
                data = future.result()
                if data: all_stock_records.extend(data)
            except Exception as e:
                print(f"Worker Error: {e}")
            completed += 1
            if completed % 50 == 0: print(f"  ... {completed}/{len(TICKER_UNIVERSE)}")

    # PATCH 2: The "Global Day" Validator (Prunes Sparse Days)
    # Prevents Disconnected Graph Errors by enforcing minimal density
    print(f"🧹 Validating Data Density...")
    day_counts = Counter(r['date'] for r in all_stock_records)
    min_tickers = len(TICKER_UNIVERSE) * 0.5 # Require 50% universe participation
    
    valid_records = []
    dropped_days = 0
    for r in all_stock_records:
        if day_counts[r['date']] >= min_tickers:
            valid_records.append(r)
        else:
            dropped_days += 1
            
    if dropped_days > 0:
        print(f"   📉 Dropped {dropped_days} rows (Sparse/Holiday/Weekend data).")
    
    print(f"📦 Uploading {len(valid_records)} CLEAN stock rows...")
    for i in range(0, len(valid_records), DB_BATCH_SIZE):
        batch = valid_records[i:i + DB_BATCH_SIZE]
        upload_stock_batch(batch)
    
    # 2. NEWS
    backfill_news()
    
    print(f"\n✨ BACKFILL COMPLETE in {time.time() - start_time:.2f}s")
