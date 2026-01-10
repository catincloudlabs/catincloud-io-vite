import os
import requests
import time
import concurrent.futures
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# 1. SETUP: Load Secrets & Initialize Engines
load_dotenv()

# The Source (Massive.com / Polygon)
MASSIVE_KEY = os.getenv("MASSIVE_API_KEY")
MASSIVE_BASE_URL = "https://api.polygon.io" 

# The Brain (OpenAI)
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# The Storage (Supabase)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# --- CONFIGURATION ---
MAX_WORKERS = 10  # Number of simultaneous connections
NEWS_LOOKBACK_LIMIT = 3 # Only fetch the top 3 freshest stories per ticker (prevents noise)
DB_BATCH_SIZE = 50 

# --- MARKET UNIVERSE ---
TICKER_UNIVERSE = [
    # 1. THE MAGNIFICENT 7 & MEGA CAP
    "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "BRK.B", "LLY", "AVGO", "JPM",
    
    # 2. SEMICONDUCTORS & AI
    "AMD", "QCOM", "TXN", "INTC", "AMAT", "MU", "LRCX", "ADI", "KLAC", "MRVL", "SNPS", 
    "CDNS", "PANW", "CRWD", "PLTR", "SMCI", "ARM", "TSM", "ASML", "ON", "MCHP", "STM",
    
    # 3. SOFTWARE & CLOUD
    "ORCL", "ADBE", "CRM", "INTU", "IBM", "NOW", "UBER", "SAP", "FI", "ADP", "ACN", 
    "CSCO", "SQ", "SHOP", "WDAY", "SNOW", "TEAM", "ADSK", "DDOG", "ZM", "NET", "TTD",
    "MDB", "ZS", "GIB", "FICO", "ANET", "ESTC",
    
    # 4. FINANCE & PAYMENTS
    "V", "MA", "BAC", "WFC", "MS", "GS", "C", "BLK", "SPGI", "AXP", "MCO", "PGR", "CB", 
    "MMC", "AON", "USB", "PNC", "TFC", "COF", "DFS", "PYPL", "AFRM", "HOOD", "COIN",
    "KKR", "BX", "APO", "TRV", "ALL", "HIG", "MET",
    
    # 5. HEALTHCARE & BIO
    "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "DHR", "PFE", "AMGN", "ISRG", "ELV", 
    "VRTX", "REGN", "ZTS", "BSX", "BDX", "GILD", "HCA", "MCK", "CI", "HUM", "CVS", 
    "BMY", "SYK", "EW", "MDT", "DXCM", "ILMN", "ALGN", "BIIB", "MRNA", "BNTX",
    
    # 6. CONSUMER & RETAIL
    "WMT", "PG", "COST", "HD", "KO", "PEP", "MCD", "DIS", "NKE", "SBUX", "LOW", "PM", 
    "TGT", "TJX", "EL", "CL", "MO", "LULU", "CMG", "MAR", "BKNG", "ABNB", "HLT", "YUM",
    "DE", "CAT", "HON", "GE", "MMM", "ETN", "ITW", "EMR", "PH", "CMI", "PCAR", "TT",
    
    # 7. ENERGY & INDUSTRIALS
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HES", "KMI", "WMB",
    "LMT", "RTX", "BA", "GD", "NOC", "LHX", "TDG", "GE", "WM", "RSG", "UNP", "CSX", "NSC",
    "DAL", "UAL", "AAL", "LUV", "FDX", "UPS",
    
    # 8. MACRO ETFS
    "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "VEA", "VWO",
    "XLK", "XLV", "XLF", "XLE", "XLC", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE",
    "SMH", "SOXX", "XBI", "KRE", "KBE", "JETS", "ITB",
    "TLT", "IEF", "SHY", "LQD", "HYG", "AGG", "BND",
    "GLD", "SLV", "USO", "UNG", "DBC",
    
    # 9. VOLATILITY & LEVERAGE
    "VIXY", "UVXY", "VXX",
    "TQQQ", "SQQQ", "SOXL", "SOXS", "SPXU", "UPRO", "LABU", "LABD", "TMF", "TMV"
]

def get_embedding(text):
    text = text.replace("\n", " ")
    try:
        return openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding
    except Exception as e:
        print(f" ⚠️ Embedding Error: {e}")
        return None

# --- PHASE 1: STOCK DATA (PARALLEL FETCH) ---

def fetch_single_stock(ticker):
    """ Fetches OHLC data for a single stock. """
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    url = f"{MASSIVE_BASE_URL}/v1/open-close/{ticker}/{yesterday}?adjusted=true&apiKey={MASSIVE_KEY}"
    
    attempts = 0
    max_retries = 3
    
    while attempts < max_retries:
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 429:
                wait_time = 1.5 * (2 ** attempts)
                time.sleep(wait_time)
                attempts += 1
                continue
            
            if resp.status_code == 404: return None
            if resp.status_code != 200: return None
                
            data = resp.json()
            return {
                "ticker": data.get("symbol"),
                "date": data.get("from"),
                "open": data.get("open"),
                "high": data.get("high"),
                "low": data.get("low"),
                "close": data.get("close"),
                "volume": data.get("volume")
            }
        except Exception:
            return None
    return None

def upload_stock_batch(records):
    if not records: return
    try:
        supabase.table("stocks_ohlc").upsert(records).execute()
        print(f" 💾 Stocks DB Commit: Saved {len(records)} tickers.")
    except Exception as e:
        print(f" ❌ Stocks DB Error: {e}")

# --- PHASE 2: TARGETED NEWS DATA ---

def fetch_ticker_news(ticker):
    """ 
    Fetches the 3 most recent articles SPECIFIC to a ticker. 
    Does NOT generate embeddings yet. Just raw extraction.
    """
    url = f"{MASSIVE_BASE_URL}/v2/reference/news?ticker={ticker}&limit={NEWS_LOOKBACK_LIMIT}&apiKey={MASSIVE_KEY}"
    
    attempts = 0
    while attempts < 2:
        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 429:
                time.sleep(2)
                attempts += 1
                continue
            
            if resp.status_code != 200: return []
            
            data = resp.json()
            return data.get("results", [])
        except Exception as e:
            print(f" ⚠️ News Fetch Error for {ticker}: {e}")
            return []
    return []

def process_and_upload_article(article):
    """
    Takes a raw article object, generates embedding, and uploads to Graph.
    """
    headline = article.get("title", "")
    description = article.get("description", "") or ""
    text_content = f"{headline}: {description}"
    article_url = article.get("article_url")
    
    if len(text_content) < 15 or not article_url: return

    # 1. Generate Embedding (The Brain)
    vector = get_embedding(text_content)
    if not vector: return

    # 2. Upload News Node
    payload = {
        "ticker": "MARKET", # We keep this generic as it's a many-to-many relation
        "headline": headline,
        "published_at": article.get("published_utc"),
        "url": article_url,
        "embedding": vector
    }

    try:
        # Upsert the Article Node
        res = supabase.table("news_vectors").upsert(payload, on_conflict="url").execute()
        if not res.data: return
        
        news_id = res.data[0]['id']
        related_tickers = article.get("tickers", [])

        # 3. Build The Edges (The Knowledge Graph)
        edges = []
        for t in related_tickers:
            # Only creating edges for tickers we care about helps reduce noise,
            # but for discovery, we usually allow all.
            edges.append({
                "source_node": str(news_id), 
                "target_node": t, 
                "edge_type": "MENTIONS", 
                "weight": 1.0
            })
        
        if edges:
            supabase.table("knowledge_graph").insert(edges).execute()
            
    except Exception as e:
        if "duplicate key" not in str(e): 
            print(f" ❌ Graph Upload Error: {e}")

# --- MAIN EXECUTION ---

if __name__ == "__main__":
    start_time = time.time()
    print(f"🚀 Starting Engine for {len(TICKER_UNIVERSE)} Tickers...")
    
    # ---------------------------------------------------------
    # PART 1: STOCK PRICES (The Physics)
    # ---------------------------------------------------------
    print("\n📊 Phase 1: Fetching Market Physics (OHLC)...")
    valid_records = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_single_stock, t): t for t in TICKER_UNIVERSE}
        for future in concurrent.futures.as_completed(future_to_ticker):
            result = future.result()
            if result: valid_records.append(result)

    # Batch Upload Stocks
    for i in range(0, len(valid_records), DB_BATCH_SIZE):
        upload_stock_batch(valid_records[i:i + DB_BATCH_SIZE])


    # ---------------------------------------------------------
    # PART 2: TARGETED NEWS (The Brain)
    # ---------------------------------------------------------
    print("\n🧠 Phase 2: Targeted Knowledge Ingestion...")
    
    # Step A: Fetch Raw News for EVERY Ticker (Parallel)
    # We use a dictionary to deduplicate articles by URL immediately.
    unique_articles = {} 
    
    print(f"   > Scouting news for {len(TICKER_UNIVERSE)} targets...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_ticker_news, t): t for t in TICKER_UNIVERSE}
        
        for future in concurrent.futures.as_completed(future_to_ticker):
            articles = future.result()
            for art in articles:
                if art.get('article_url'):
                    unique_articles[art['article_url']] = art

    print(f"   > Found {len(unique_articles)} unique relevant stories.")
    print(f"   > Processing Embeddings & Graph Edges...")

    # Step B: Process Unique Articles (Parallel)
    # This prevents generating embeddings 5 times for the same 'Market Wrap' story.
    processed_count = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(process_and_upload_article, art) for art in unique_articles.values()]
        
        for future in concurrent.futures.as_completed(futures):
            future.result() # Wait for completion to catch errors if needed
            processed_count += 1
            if processed_count % 25 == 0:
                print(f"     ... processed {processed_count}/{len(unique_articles)}")

    duration = time.time() - start_time
    print(f"\n✨ SYSTEM UPDATE COMPLETE in {duration:.2f} seconds.")
