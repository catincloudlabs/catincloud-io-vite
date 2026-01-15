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

# The "Pins" that hold the map steady. 
# We ensure these are ALWAYS ingested so the Visualization Engine (Procrustes) has anchors.
ANCHOR_TICKERS = [
    "SPY", "QQQ", "IWM", "DIA",       # Indices
    "AAPL", "MSFT", "NVDA", "GOOGL",  # Mag 7
    "AMZN", "META", "TSLA",           # Mag 7
    "JPM", "V", "UNH", "XOM"          # Sector Leaders
]

# Standard Universe (Manual List)
MANUAL_TICKERS = [
    "A", "AAL", "AAPL", "ABBV", "ABNB", "ABT", "ACGL", "ACN", "ADBE", "ADI", 
    "ADM", "ADP", "ADSK", "AEE", "AEP", "AES", "AFL", "AFRM", "AGG", "AI", 
    "AIG", "AIZ", "AJG", "AKAM", "ALB", "ALGN", "ALL", "ALLE", "AMAT", "AMC", 
    "AMCR", "AMD", "AME", "AMGN", "AMP", "AMT", "AMZN", "ANET", "ANSS", "AON", 
    "AOS", "APA", "APD", "APH", "APP", "APTV", "ARE", "ARES", "ARM", "ASML", 
    "ASTS", "ATO", "AVB", "AVGO", "AVY", "AWK", "AXON", "AXP", "AZO", "BA", 
    "BABA", "BAC", "BALL", "BAX", "BB", "BBWI", "BBY", "BCS", "BDX", "BEN", 
    "BF.B", "BG", "BIIB", "BIO", "BK", "BKNG", "BKR", "BLK", "BMY", "BND", 
    "BR", "BRK.B", "BRO", "BSX", "BWA", "BX", "BXP", "BYND", "C", "CAG", 
    "CAH", "CARR", "CAT", "CB", "CBOE", "CBRE", "CCI", "CCL", "CDAY", "CDNS", 
    "CDW", "CE", "CEG", "CF", "CFG", "CHD", "CHPT", "CHRW", "CHTR", "CHWY", 
    "CI", "CINF", "CL", "CLX", "CMCSA", "CME", "CMG", "CMI", "CMS", "CNC", 
    "CNH", "CNP", "COF", "COIN", "COO", "COP", "COR", "COST", "CPRT", "CPT", 
    "CRL", "CRM", "CRWD", "CSCO", "CSGP", "CSX", "CTAS", "CTLT", "CTRA", "CTSH", 
    "CTVA", "CVNA", "CVS", "CVX", "CZR", "D", "DAL", "DASH", "DBC", "DD", 
    "DE", "DELL", "DFS", "DG", "DGX", "DHI", "DHR", "DIA", "DIS", "DJT", 
    "DKNG", "DLR", "DLTR", "DOV", "DOW", "DPZ", "DRI", "DTE", "DUK", "DVA", 
    "DVN", "DXCM", "EA", "EBAY", "ECL", "ED", "EFX", "EG", "EIX", "EL", 
    "ELV", "EMN", "EMR", "ENPH", "EOG", "EPAM", "EQIX", "EQR", "EQT", "ERIE", 
    "ES", "ESS", "ETN", "ETR", "ETSY", "EVRG", "EW", "EXC", "EXPD", "EXPE", 
    "EXR", "F", "FANG", "FAST", "FCX", "FDS", "FDX", "FE", "FFIV", "FI", 
    "FICO", "FIS", "FITB", "FLT", "FMC", "FOX", "FOXA", "FRT", "FSLR", "FTNT", 
    "FTV", "FUBO", "GD", "GDDY", "GE", "GEHC", "GEV", "GILD", "GIS", "GL", 
    "GLD", "GLW", "GM", "GME", "GNRC", "GOOG", "GOOGL", "GPC", "GPN", "GRMN", 
    "GS", "GWW", "HAL", "HAS", "HBAN", "HCA", "HD", "HES", "HIG", "HII", 
    "HIMS", "HLT", "HOLX", "HON", "HOOD", "HPE", "HPQ", "HRL", "HSIC", "HST", 
    "HSY", "HUBB", "HUM", "HWM", "HYG", "IBM", "IBIT", "ICE", "IDXX", "IEF", 
    "IEX", "IFF", "IGP", "ILMN", "INCY", "INTC", "INTU", "INVH", "IONQ", "IP", 
    "IPG", "IQV", "IR", "IRM", "ISRG", "IT", "ITB", "ITW", "IVZ", "IWM", 
    "J", "JBHT", "JCI", "JD", "JETS", "JKHY", "JNJ", "JNPR", "JPM", "K", 
    "KBE", "KDP", "KEY", "KEYS", "KHC", "KIM", "KKR", "KLAC", "KMB", "KMI", 
    "KMX", "KO", "KR", "KRE", "KVUE", "L", "LABD", "LABU", "LCID", "LDOS", 
    "LEN", "LH", "LHX", "LIN", "LKQ", "LLY", "LMT", "LNT", "LOW", "LQD", 
    "LRCX", "LULU", "LUNR", "LUV", "LVS", "LW", "LYB", "LYV", "MA", "MAA", 
    "MAR", "MARA", "MAS", "MCD", "MCHP", "MCK", "MCO", "MDLZ", "MDT", "MET", 
    "META", "MGM", "MHK", "MKC", "MKTX", "MLM", "MMC", "MMM", "MNST", "MO", 
    "MOH", "MOS", "MPC", "MPWR", "MRK", "MRNA", "MRO", "MRVL", "MS", "MSCI", 
    "MSFT", "MSI", "MSTR", "MTB", "MTCH", "MTD", "MU", "NCLH", "NDAQ", "NDSN", 
    "NEE", "NEM", "NFLX", "NI", "NKLA", "NKE", "NOC", "NOW", "NRG", "NSC", 
    "NTAP", "NTRS", "NUE", "NVDA", "NVR", "NWS", "NWSA", "NXPI", "O", "ODFL", 
    "OGN", "OKE", "OMC", "ON", "OPEN", "ORCL", "ORLY", "OTIS", "OXY", "PANW", 
    "PARA", "PAYC", "PAYX", "PCAR", "PCG", "PDD", "PEAK", "PEG", "PEP", "PFE", 
    "PFG", "PG", "PGR", "PH", "PHM", "PKG", "PLD", "PLTR", "PM", "PNC", 
    "PNR", "PNW", "PODD", "POOL", "PPG", "PPL", "PRU", "PSA", "PSX", "PTC", 
    "PTON", "PWR", "PXD", "PYPL", "QCOM", "QQQ", "QRVO", "QS", "RBLX", "RCL", 
    "RDDT", "REG", "REGN", "RF", "RHI", "RJF", "RKLB", "RL", "RMD", "RIVN", 
    "ROK", "ROL", "ROP", "ROST", "RSG", "RTX", "RVTY", "SBAC", "SBUX", "SCHW", 
    "SEE", "SHW", "SHY", "SJM", "SLB", "SLV", "SMH", "SNA", "SNPS", "SO", 
    "SOFI", "SOLV", "SOUN", "SOXL", "SOXS", "SOXX", "SPCE", "SPG", "SPGI", 
    "SPXU", "SPY", "SQ", "SQQQ", "SRE", "STE", "STLD", "STM", "STT", "STX", 
    "STZ", "SWK", "SWKS", "SYF", "SYK", "SYY", "T", "TAP", "TDG", "TDY", 
    "TECH", "TEL", "TER", "TFC", "TFX", "TGT", "TJX", "TLR", "TLRY", "TLT", 
    "TMF", "TMO", "TMUS", "TMV", "TPR", "TQQQ", "TRGP", "TRMB", "TROW", "TRV", 
    "TSCO", "TSLA", "TSM", "TSN", "TT", "TTD", "TTWO", "TXN", "TXT", "TYL", 
    "U", "UAL", "UDR", "UHS", "ULTA", "UNG", "UNH", "UNP", "UPS", "UPRO", 
    "UPST", "URI", "USB", "USO", "UVXY", "V", "VEA", "VFC", "VICI", "VIXY", 
    "VLO", "VLTO", "VMC", "VNO", "VOO", "VRSK", "VRSN", "VRT", "VRTX", "VTI", 
    "VTR", "VTRS", "VST", "VWO", "VXX", "VZ", "WAB", "WAT", "WBA", "WBD", 
    "WDC", "WDAY", "WEC", "WELL", "WFC", "WHR", "WM", "WMB", "WMT", "WRB", 
    "WRK", "WSM", "WST", "WTW", "WY", "WYNN", "XBI", "XEL", "XLB", "XLC", 
    "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY", "XOM", 
    "XRAY", "XYL", "YUM", "ZBH", "ZBRA", "ZION", "ZTS"
]

# Guarantee that ANCHOR_TICKERS are present in the final universe
TICKER_UNIVERSE = list(set(MANUAL_TICKERS + ANCHOR_TICKERS))

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
