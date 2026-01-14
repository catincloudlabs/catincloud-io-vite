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
