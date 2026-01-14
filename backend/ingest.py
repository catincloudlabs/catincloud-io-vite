import os
import requests
import time
import concurrent.futures
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from tenacity import retry, wait_random_exponential, stop_after_attempt, retry_if_exception_type

# 1. SETUP
load_dotenv()
MASSIVE_KEY = os.getenv("MASSIVE_API_KEY")
MASSIVE_BASE_URL = "https://api.polygon.io" 

# Use a Global Session for Connection Pooling (Fixes Socket Exhaustion)
session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=20)
session.mount('https://', adapter)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# --- CONFIGURATION ---
MAX_WORKERS = 10 
NEWS_LOOKBACK_LIMIT = 3
DB_BATCH_SIZE = 25 # Reduced batch size for stability

# --- MARKET UNIVERSE ---
TICKER_UNIVERSE = [
    # MEGA CAP & TECH
    "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "BRK.B", "LLY", "AVGO", "JPM",
    
    # SEMICONDUCTORS & HARDWARE
    "AMD", "QCOM", "TXN", "INTC", "AMAT", "MU", "LRCX", "ADI", "KLAC", "MRVL", "SNPS", 
    "CDNS", "PANW", "CRWD", "PLTR", "SMCI", "ARM", "TSM", "ASML", "ON", "MCHP", "STM",
    
    # SOFTWARE & CLOUD
    "ORCL", "ADBE", "CRM", "INTU", "IBM", "NOW", "UBER", "SAP", "FI", "ADP", "ACN", 
    "CSCO", "SQ", "SHOP", "WDAY", "SNOW", "TEAM", "ADSK", "DDOG", "ZM", "NET", "TTD",
    "MDB", "ZS", "GIB", "FICO", "ANET", "ESTC",

    # FINANCE & PAYMENTS
    "V", "MA", "BAC", "WFC", "MS", "GS", "C", "BLK", "SPGI", "AXP", "MCO", "PGR", "CB", 
    "MMC", "AON", "USB", "PNC", "TFC", "COF", "DFS", "PYPL", "AFRM", "HOOD", "COIN",
    "KKR", "BX", "APO", "TRV", "ALL", "HIG", "MET",

    # HEALTHCARE
    "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "DHR", "PFE", "AMGN", "ISRG", "ELV", 
    "VRTX", "REGN", "ZTS", "BSX", "BDX", "GILD", "HCA", "MCK", "CI", "HUM", "CVS", 
    "BMY", "SYK", "EW", "MDT", "DXCM", "ILMN", "ALGN", "BIIB", "MRNA", "BNTX", "NVO",

    # CONSUMER & RETAIL
    "WMT", "PG", "COST", "HD", "KO", "PEP", "MCD", "DIS", "NKE", "SBUX", "LOW", "PM", 
    "TGT", "TJX", "EL", "CL", "MO", "LULU", "CMG", "MAR", "BKNG", "ABNB", "HLT", "YUM",
    
    # INDUSTRIALS & ENERGY
    "DE", "CAT", "HON", "GE", "MMM", "ETN", "ITW", "EMR", "PH", "CMI", "PCAR", "TT",
    "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HES", "KMI", "WMB",
    "LMT", "RTX", "BA", "GD", "NOC", "LHX", "TDG", "WM", "RSG", "UNP", "CSX", "NSC",
    "DAL", "UAL", "AAL", "LUV", "FDX", "UPS",

    # --- NEW ADDITIONS (AI Power, Infra, Crypto, Space) ---
    "VST", "CEG", "NRG", "VRT",           # AI Power & Cooling
    "EQIX", "DLR", "AMT",                 # Data Center Infra
    "MSTR", "IBIT", "MARA",               # Crypto High Beta
    "RKLB", "ASTS",                       # Space & Deep Tech
    "BABA", "PDD",                        # Global Tech

    # ETFS
    "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "VEA", "VWO",
    "XLK", "XLV", "XLF", "XLE", "XLC", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE",
    "SMH", "SOXX", "XBI", "KRE", "KBE", "JETS", "ITB",
    "TLT", "IEF", "SHY", "LQD", "HYG", "AGG", "BND",
    "GLD", "SLV", "USO", "UNG", "DBC",
    "VIXY", "UVXY", "VXX", "TQQQ", "SQQQ", "SOXL", "SOXS", "SPXU", "UPRO", "LABU", "LABD", "TMF", "TMV"
]

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def get_embedding(text):
    text = text.replace("\n", " ")
    return openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding

# --- PHASE 1: STOCK DATA ---

def fetch_single_stock(ticker):
    """ Fetches OHLC data for a single stock using pooled session. """
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    url = f"{MASSIVE_BASE_URL}/v1/open-close/{ticker}/{yesterday}?adjusted=true&apiKey={MASSIVE_KEY}"
    
    attempts = 0
    while attempts < 3:
        try:
            # USE SESSION HERE
            resp = session.get(url, timeout=10)
            if resp.status_code == 429:
                time.sleep(2)
                attempts += 1
                continue
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
        supabase.table("stocks_ohlc").upsert(
            records, 
            on_conflict="ticker,date"
        ).execute()
        print(f" 💾 Stocks DB Commit: Saved {len(records)} tickers.")
    except Exception as e:
        print(f" ❌ Stocks DB Error: {e}")

# --- PHASE 2: TARGETED NEWS DATA ---

def fetch_ticker_news(ticker):
    url = f"{MASSIVE_BASE_URL}/v2/reference/news?ticker={ticker}&limit={NEWS_LOOKBACK_LIMIT}&apiKey={MASSIVE_KEY}"
    try:
        # USE SESSION HERE
        resp = session.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json().get("results", [])
    except Exception:
        pass
    return []

def process_article_embedding(article):
    """ Generates embedding but DOES NOT upload. Returns data for batching. """
    headline = article.get("title", "")
    description = article.get("description", "") or ""
    text_content = f"{headline}: {description}"
    article_url = article.get("article_url")
    
    if len(text_content) < 15 or not article_url: return None, []

    try:
        vector = get_embedding(text_content)
        
        vector_record = {
            "ticker": "MARKET",
            "headline": headline,
            "published_at": article.get("published_utc"),
            "url": article_url,
            "embedding": vector
        }
        
        edge_stubs = []
        for t in article.get("tickers", []):
            edge_stubs.append({
                "source_url": article_url,
                "target_node": t,
                "weight": 1.0
            })
            
        return vector_record, edge_stubs
    except Exception as e:
        return None, []

# FIX 3: Add Retry Logic to Uploads to handle 10054/10013 errors gracefully
@retry(stop=stop_after_attempt(5), wait=wait_random_exponential(min=2, max=10))
def upload_news_batch(vectors, edges):
    if not vectors: return
    
    # 1. Upload Vectors
    res = supabase.table("news_vectors").upsert(
        vectors, 
        on_conflict="url"
    ).execute()
    
    # 2. Map URLs to new IDs for Edges
    if res.data:
        url_to_id = {item['url']: item['id'] for item in res.data}
        final_edges = []
        
        for stub in edges:
            article_id = url_to_id.get(stub['source_url'])
            if article_id:
                final_edges.append({
                    "source_node": str(article_id),
                    "target_node": stub['target_node'],
                    "edge_type": "MENTIONS",
                    "weight": stub['weight']
                })
        
        if final_edges:
            supabase.table("knowledge_graph").upsert(
                final_edges, 
                on_conflict="source_node,target_node,edge_type",
                ignore_duplicates=True
            ).execute()

# --- MAIN EXECUTION ---

if __name__ == "__main__":
    start_time = time.time()
    print(f"🚀 Starting Engine for {len(TICKER_UNIVERSE)} Tickers...")
    
    # PART 1: STOCKS
    print("\n📊 Phase 1: Fetching Market Physics (OHLC)...")
    valid_records = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_single_stock, t): t for t in TICKER_UNIVERSE}
        for future in concurrent.futures.as_completed(future_to_ticker):
            result = future.result()
            if result: valid_records.append(result)

    for i in range(0, len(valid_records), DB_BATCH_SIZE):
        upload_stock_batch(valid_records[i:i + DB_BATCH_SIZE])

    # PART 2: NEWS
    print("\n🧠 Phase 2: Targeted Knowledge Ingestion...")
    
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

    page_vectors = []
    page_edges = []
    processed_count = 0
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = list(executor.map(process_article_embedding, unique_articles.values()))
        
        for vec, edges in futures:
            if vec:
                page_vectors.append(vec)
                page_edges.extend(edges)
            
            if len(page_vectors) >= DB_BATCH_SIZE:
                try:
                    upload_news_batch(page_vectors, page_edges)
                    processed_count += len(page_vectors)
                    print(f"     ... processed {processed_count}/{len(unique_articles)}")
                except Exception as e:
                    print(f" ❌ Skipping batch due to persistent error: {e}")
                
                # RESET
                page_vectors = []
                page_edges = []
                
                # FIX 4: Tiny sleep to let OS reclaim sockets
                time.sleep(0.5)

        if page_vectors:
            try:
                upload_news_batch(page_vectors, page_edges)
                print(f"     ... processed {len(unique_articles)}/{len(unique_articles)}")
            except Exception as e:
                print(f" ❌ Error uploading final batch: {e}")

    duration = time.time() - start_time
    print(f"\n✨ SYSTEM UPDATE COMPLETE in {duration:.2f} seconds.")
    