import os
import requests
import time
import concurrent.futures
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from tenacity import retry, wait_random_exponential, stop_after_attempt
import networkx as nx
import community as community_louvain  # python-louvain

# --- CONFIGURATION & SETUP ---
load_dotenv()
MASSIVE_KEY = os.getenv("MASSIVE_API_KEY")
MASSIVE_BASE_URL = "https://api.polygon.io" 

session = requests.Session()
adapter = requests.adapters.HTTPAdapter(pool_connections=20, pool_maxsize=20)
session.mount('https://', adapter)

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

MAX_WORKERS = 10 
NEWS_LOOKBACK_LIMIT = 3
DB_BATCH_SIZE = 25 

ANCHOR_TICKERS = [
    "SPY", "QQQ", "IWM", "DIA",       
    "AAPL", "MSFT", "NVDA", "GOOGL",  
    "AMZN", "META", "TSLA",           
    "JPM", "V", "UNH", "XOM"          
]
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
TICKER_UNIVERSE = list(set(MANUAL_TICKERS + ANCHOR_TICKERS))

# --- CLASS: COMMUNITY DETECTOR ---
class CommunityDetector:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.graph = nx.Graph()

    def fetch_and_build(self):
        """Fetches recent edges and builds the NetworkX graph."""
        print("   > 🕸️ Fetching Knowledge Graph for Community Detection...")
        
        # 1. Fetch Edges (Ticker-to-Ticker via News)
        # We only want 'MENTIONS' edges from the last 7 days to keep it relevant
        try:
            # Note: You might need to adjust this query depending on your exact schema volume
            response = self.supabase.table('knowledge_graph')\
                .select("*").eq('edge_type', 'MENTIONS').execute()
            
            edges = response.data
            if not edges:
                print("   > ⚠️ No edges found. Skipping detection.")
                return

            print(f"   > 🕸️ Analyzing {len(edges)} connections...")
            
            # 2. Build Graph
            for edge in edges:
                # We are connecting Target (Ticker) <-> Source (News ID)
                # This creates a bipartite graph. We need to project it to Ticker <-> Ticker
                # OR: simpler approach for now -> If we have direct Ticker-Ticker edges.
                
                # Assuming your structure is News -> Ticker. 
                # To find Ticker <-> Ticker, we look for News nodes with degree > 1
                self.graph.add_edge(edge['source_node'], edge['target_node'], weight=edge.get('weight', 1))

        except Exception as e:
            print(f"   > ❌ Graph Build Error: {e}")

    def run_detection(self):
        """Runs Louvain Algorithm and PageRank to label communities."""
        if self.graph.number_of_nodes() == 0:
            return

        # 1. Project to Ticker-Only Graph
        # Currently the graph is Mixed (News IDs + Ticker Strings)
        # We need to filter for Ticker nodes only.
        ticker_nodes = [n for n in self.graph.nodes() if isinstance(n, str) and n.isupper() and len(n) < 6]
        
        if len(ticker_nodes) < 2: 
            return

        # Create a projection: Two tickers are connected if they share a News Article
        projected_graph = nx.Graph()
        
        # (This is a simplified projection for speed)
        # Iterate all news nodes (numeric IDs usually)
        news_nodes = [n for n in self.graph.nodes() if n not in ticker_nodes]
        
        for news in news_nodes:
            neighbors = list(self.graph.neighbors(news))
            # If a news story mentions multiple tickers, connect them all
            for i in range(len(neighbors)):
                for j in range(i + 1, len(neighbors)):
                    t1, t2 = neighbors[i], neighbors[j]
                    if t1 in ticker_nodes and t2 in ticker_nodes:
                        if projected_graph.has_edge(t1, t2):
                            projected_graph[t1][t2]['weight'] += 1
                        else:
                            projected_graph.add_edge(t1, t2, weight=1)

        print(f"   > 🧮 Projected Graph: {projected_graph.number_of_nodes()} Tickers, {projected_graph.number_of_edges()} Links")

        if projected_graph.number_of_nodes() == 0:
            return

        # 2. Run Louvain
        # Returns dict: {ticker: community_id}
        partition = community_louvain.best_partition(projected_graph)
        
        # 3. Analyze Communities
        # We need to label them. "Community 4" means nothing. "The NVDA Cluster" means everything.
        community_groups = {}
        for ticker, com_id in partition.items():
            if com_id not in community_groups: community_groups[com_id] = []
            community_groups[com_id].append(ticker)
            
        # Run PageRank on the projected graph for "Importance"
        pagerank = nx.pagerank(projected_graph)
        
        updates = []
        today = datetime.now().strftime('%Y-%m-%d')

        print(f"   > 🏷️ Discovered {len(community_groups)} unique market clusters.")

        for com_id, members in community_groups.items():
            # Find the member with the highest PageRank
            leader = max(members, key=lambda x: pagerank.get(x, 0))
            label = f"{leader}-Linked" # e.g., "NVDA-Linked"
            
            # Prepare DB updates
            for ticker in members:
                updates.append({
                    "ticker": ticker,
                    "date": today,
                    "community_id": com_id,
                    "community_label": label
                })

        # 4. Save to Supabase
        # We are updating the 'stocks_ohlc' table. 
        # Note: You need to add 'community_id' and 'community_label' columns to your Supabase table first!
        if updates:
            print(f"   > 💾 Saving {len(updates)} community classifications...")
            # We use upsert. Since (ticker, date) is unique, this updates the row.
            try:
                # Chunking for safety
                batch_size = 50
                for i in range(0, len(updates), batch_size):
                    batch = updates[i:i+batch_size]
                    self.supabase.table("stocks_ohlc").upsert(batch, on_conflict="ticker,date").execute()
            except Exception as e:
                print(f"   > ❌ Save Error: {e}")


# --- HELPER FUNCTIONS (UNCHANGED) ---
@retry(wait=wait_random_exponential(min=1, max=60), stop=stop_after_attempt(6))
def get_embedding(text):
    text = text.replace("\n", " ")
    return openai_client.embeddings.create(input=[text], model="text-embedding-3-small").data[0].embedding

def upload_stock_batch(records):
    if not records: return
    try:
        supabase.table("stocks_ohlc").upsert(records, on_conflict="ticker,date").execute()
        print(f" 💾 Stocks DB Commit: Saved {len(records)} tickers.")
    except Exception as e:
        print(f" ❌ Stocks DB Error: {e}")

def fetch_single_stock(ticker):
    yesterday = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    url = f"{MASSIVE_BASE_URL}/v1/open-close/{ticker}/{yesterday}?adjusted=true&apiKey={MASSIVE_KEY}"
    attempts = 0
    while attempts < 3:
        try:
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

def fetch_ticker_news(ticker):
    url = f"{MASSIVE_BASE_URL}/v2/reference/news?ticker={ticker}&limit={NEWS_LOOKBACK_LIMIT}&apiKey={MASSIVE_KEY}"
    try:
        resp = session.get(url, timeout=10)
        if resp.status_code == 200:
            return resp.json().get("results", [])
    except Exception:
        pass
    return []

def process_article_embedding(article):
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

@retry(stop=stop_after_attempt(5), wait=wait_random_exponential(min=2, max=10))
def upload_news_batch(vectors, edges):
    if not vectors: return
    res = supabase.table("news_vectors").upsert(vectors, on_conflict="url").execute()
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
            supabase.table("knowledge_graph").upsert(final_edges, on_conflict="source_node,target_node,edge_type", ignore_duplicates=True).execute()

# --- MAIN EXECUTION ---
if __name__ == "__main__":
    start_time = time.time()
    print(f"🚀 Starting Engine for {len(TICKER_UNIVERSE)} Tickers...")
    
    # 1. Stocks
    print("\n📊 Phase 1: Fetching Market Physics (OHLC)...")
    valid_records = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {executor.submit(fetch_single_stock, t): t for t in TICKER_UNIVERSE}
        for future in concurrent.futures.as_completed(future_to_ticker):
            result = future.result()
            if result: valid_records.append(result)

    for i in range(0, len(valid_records), DB_BATCH_SIZE):
        upload_stock_batch(valid_records[i:i + DB_BATCH_SIZE])

    # 2. News
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
                time.sleep(0.5)

        if page_vectors:
            try:
                upload_news_batch(page_vectors, page_edges)
                print(f"     ... processed {len(unique_articles)}/{len(unique_articles)}")
            except Exception as e:
                print(f" ❌ Error uploading final batch: {e}")

    # 3. Community Detection (NEW)
    print("\n🕸️ Phase 3: Mathematical Clustering (Bubble Detection)...")
    detector = CommunityDetector(supabase)
    detector.fetch_and_build()
    detector.run_detection()

    duration = time.time() - start_time
    print(f"\n✨ SYSTEM UPDATE COMPLETE in {duration:.2f} seconds.")
