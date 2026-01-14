import os
import requests
import time
import concurrent.futures
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
# "The AI Catalyst Window"
START_DATE = "2025-10-01"
END_DATE = datetime.now().strftime('%Y-%m-%d')
MAX_WORKERS = 20 
DB_BATCH_SIZE = 200

# --- MARKET UNIVERSE (S&P 500 + CORE HIGH BETA/AI/CRYPTO) ---
TICKER_UNIVERSE = [
    # --- CUSTOM HIGH CONVICTION (Crypto, AI, Space, ETFs) ---
    "MSTR", "IBIT", "MARA", "COIN", "HOOD", "SQ", "RKLB", "ASTS", "VST", "CEG", 
    "NRG", "VRT", "PLTR", "SOUN", "IONQ", "TSM", "ARM", "ASML", "BABA", "PDD", 
    "JD", "BIDU", "EQIX", "DLR", "AMT", "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", 
    "VEA", "VWO", "XLK", "XLV", "XLF", "XLE", "XLC", "XLY", "XLP", "XLI", "XLU", 
    "XLB", "XLRE", "SMH", "SOXX", "XBI", "KRE", "KBE", "JETS", "ITB", "TLT", 
    "IEF", "SHY", "LQD", "HYG", "AGG", "BND", "GLD", "SLV", "USO", "UNG", "DBC", 
    "VIXY", "UVXY", "VXX", "TQQQ", "SQQQ", "SOXL", "SOXS", "SPXU", "UPRO", "LABU", 
    "LABD", "TMF", "TMV",

    # --- S&P 500 & MARKET LEADERS ---
    "MMM", "AOS", "ABT", "ABBV", "ACN", "ADBE", "AMD", "AES", "AFL", "A", "APD", 
    "ABNB", "AKAM", "ALB", "ARE", "ALGN", "ALLE", "LNT", "ALL", "GOOGL", "GOOG", 
    "MO", "AMZN", "AMCR", "AEE", "AEP", "AXP", "AIG", "AWK", "AMP", "AME", "AMGN", 
    "APH", "ADI", "ANSS", "AON", "APA", "AAPL", "AMAT", "APTV", "ACGL", "ADM", 
    "ANET", "AJG", "AIZ", "T", "ATO", "ADSK", "ADP", "AZO", "AVB", "AVY", "AXON", 
    "BKR", "BALL", "BAC", "BK", "BBWI", "BAX", "BDX", "BRK.B", "BBY", "BIO", 
    "TECH", "BIIB", "BLK", "BX", "BA", "BKNG", "BWA", "BXP", "BSX", "BMY", "AVGO", 
    "BR", "BRO", "BF.B", "BG", "CHRW", "CDNS", "CZR", "CPT", "COF", "CAH", "KMX", 
    "CCL", "CARR", "CTLT", "CAT", "CBOE", "CBRE", "CDW", "CE", "COR", "CNC", "CNP", 
    "CDAY", "CF", "CRL", "SCHW", "CHTR", "CVX", "CMG", "CB", "CHD", "CI", "CINF", 
    "CTAS", "CSCO", "C", "CFG", "CLX", "CME", "CMS", "KO", "CTSH", "CL", "CMCSA", 
    "CAG", "COP", "ED", "STZ", "COO", "CPRT", "GLW", "CTVA", "CSGP", "COST", 
    "CTRA", "CCI", "CSX", "CMI", "CVS", "DHI", "DHR", "DRI", "DVA", "DE", "DAL", 
    "XRAY", "DVN", "DXCM", "FANG", "DFS", "DIS", "DG", "DLTR", "D", "DPZ", "DOV", 
    "DOW", "DTE", "DUK", "DD", "EMN", "ETN", "EBAY", "ECL", "EIX", "EW", "EA", 
    "ELV", "LLY", "EMR", "ENPH", "ETR", "EOG", "EPAM", "EQT", "EFX", "EQR", "ESS", 
    "EL", "ETSY", "EG", "EVRG", "ES", "EXC", "EXPE", "EXPD", "EXR", "XOM", "FFIV", 
    "FDS", "FICO", "FAST", "FRT", "FDX", "FITB", "FSLR", "FE", "FIS", "FI", "FLT", 
    "FMC", "F", "FTNT", "FTV", "FOXA", "FOX", "BEN", "FCX", "GRMN", "IT", "GE", 
    "GEHC", "GEV", "GNRC", "GD", "GIS", "GM", "GPC", "GILD", "GL", "GPN", "GS", 
    "HAL", "HIG", "HAS", "HCA", "PEAK", "HSIC", "HSY", "HES", "HPE", "HLT", "HOLX", 
    "HD", "HON", "HRL", "HST", "HWM", "HPQ", "HUBB", "HUM", "HBAN", "HII", "IBM", 
    "IEX", "IDXX", "ITW", "ILMN", "INCY", "IR", "PODD", "INTC", "ICE", "IGP", "IP", 
    "IPG", "IFF", "INTU", "ISRG", "IVZ", "INVH", "IQV", "IRM", "JBHT", "JKHY", "J", 
    "JNJ", "JCI", "JPM", "JNPR", "K", "KVUE", "KDP", "KEY", "KEYS", "KMB", "KIM", 
    "KMI", "KLAC", "KHC", "KR", "LHX", "LH", "LRCX", "LW", "LVS", "LDOS", "LEN", 
    "LIN", "LYV", "LKQ", "LMT", "L", "LOW", "LULU", "LYB", "MTB", "MRO", "MPC", 
    "MKTX", "MAR", "MMC", "MLM", "MAS", "MA", "MTCH", "MKC", "MCD", "MCK", "MDT", 
    "MRK", "META", "MET", "MTD", "MGM", "MCHP", "MU", "MSFT", "MAA", "MRNA", "MHK", 
    "MOH", "TAP", "MDLZ", "MPWR", "MNST", "MCO", "MS", "MOS", "MSI", "MSCI", 
    "NDAQ", "NTAP", "NFLX", "NEM", "NWSA", "NWS", "NEE", "NKE", "NI", "NDSN", 
    "NSC", "NTRS", "NOC", "NCLH", "NUE", "NVDA", "NVR", "NXPI", "ORLY", "OXY", 
    "ODFL", "OMC", "ON", "OKE", "ORCL", "OGN", "OTIS", "PCAR", "PKG", "PANW", 
    "PARA", "PH", "PAYX", "PAYC", "PYPL", "PNR", "PEP", "PFE", "PCG", "PM", "PSX", 
    "PNW", "PXD", "PNC", "POOL", "PPG", "PPL", "PFG", "PG", "PGR", "PLD", "PRU", 
    "PEG", "PTC", "PSA", "PHM", "QRVO", "PWR", "QCOM", "DGX", "RL", "RJF", "O", 
    "REG", "REGN", "RF", "RSG", "RMD", "RVTY", "RHI", "ROK", "ROL", "ROP", "ROST", 
    "RCL", "SPGI", "CRM", "SBAC", "SLB", "STX", "SEE", "SRE", "NOW", "SHW", "SPG", 
    "SWKS", "SJM", "SNA", "SEDG", "SO", "LUV", "SWK", "SBUX", "STT", "STLD", "STE", 
    "SYK", "SYF", "SNPS", "SYY", "TMUS", "TROW", "TTWO", "TPR", "TRGP", "TGT", 
    "TEL", "TDY", "TFX", "TER", "TSLA", "TXN", "TXT", "TMO", "TJX", "TSCO", "TT", 
    "TDG", "TRV", "TRMB", "TFC", "TYL", "TSN", "USB", "UDR", "ULTA", "UNP", "UAL", 
    "UPS", "URI", "UNH", "UHS", "VLO", "VTR", "VRSN", "VRSK", "VZ", "VRTX", "VFC", 
    "VTRS", "VICI", "V", "VMC", "WAB", "WBA", "WMT", "WBD", "WM", "WAT", "WEC", 
    "WFC", "WELL", "WST", "WDC", "WRK", "WY", "WHR", "WMB", "WTW", "GWW", "WYNN", 
    "XEL", "XYL", "YUM", "ZBRA", "ZBH", "ZION", "ZTS", "DELL", "KKR", "CRWD", 
    "GDDY", "ERIE", "CNH", "DASH", "APP", "WDAY", "ARES", "WSM", "SOLV", "VLTO"
]

# --- ROBUST UTILS ---

@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def get_embedding(text):
    text = text.replace("\n", " ")
    return openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding

def upload_stock_batch(records):
    if not records: return
    try:
        supabase.table("stocks_ohlc").upsert(
            records, 
            on_conflict="ticker,date", 
            ignore_duplicates=True
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
    # UPDATED: Use hardcoded dates instead of relative math
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

def backfill_news():
    print(f"\n📰 Starting Parallel News Backfill ({START_DATE} to {END_DATE})...")
    
    # UPDATED: Use both .gte (start) and .lte (end) to bound the regime
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

    print(f"📦 Uploading {len(all_stock_records)} historical stock rows...")
    for i in range(0, len(all_stock_records), DB_BATCH_SIZE):
        batch = all_stock_records[i:i + DB_BATCH_SIZE]
        upload_stock_batch(batch)
    
    # 2. NEWS
    backfill_news()
    
    print(f"\n✨ BACKFILL COMPLETE in {time.time() - start_time:.2f}s")
