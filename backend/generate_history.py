import os
import json
import numpy as np
import pandas as pd
import umap
from supabase import create_client, Client
from sklearn.preprocessing import RobustScaler
from textblob import TextBlob
from dotenv import load_dotenv
from datetime import datetime, timedelta

# 1. SETUP
load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# --- CONFIGURATION ---
UMAP_NEIGHBORS = 30       
UMAP_MIN_DIST = 0.05      
UMAP_COMPONENTS = 2       # 2D Optimized
LOOKBACK_DAYS = 200       # Buffer for volatility calc

# --- HELPERS ---
def sanitize(val):
    """Prevents JSON errors by converting NaN/Inf to 0."""
    if val is None or pd.isna(val) or np.isinf(val):
        return 0.0
    return float(val)

def get_sentiment(text):
    """Returns polarity: -1.0 (Negative) to 1.0 (Positive)."""
    if not text: return 0.0
    return TextBlob(text).sentiment.polarity

# --- CORE FUNCTIONS ---

def fetch_market_data():
    print("📥 Fetching Stock History...")
    
    start_date = (datetime.now() - timedelta(days=LOOKBACK_DAYS)).strftime('%Y-%m-%d')
    
    response = supabase.table("stocks_ohlc")\
        .select("date, ticker, close")\
        .gte("date", start_date)\
        .order("date")\
        .execute()
        
    if not response.data: 
        raise Exception("No stock data found! Run backfill_engine.py first.")
    
    df = pd.DataFrame(response.data)
    
    # Pivot: Rows = Dates, Cols = Tickers
    price_pivot = df.pivot(index="date", columns="ticker", values="close").sort_index()
    
    # CLEANING: Forward fill gaps, then backfill start
    price_pivot = price_pivot.ffill().bfill().dropna(axis=1, how='any')
    
    # PHYSICS ENGINE
    log_returns = np.log(price_pivot / price_pivot.shift(1)).fillna(0)
    
    # Energy (Volatility): 14-day rolling std dev * 1000 (Radius)
    volatility = log_returns.rolling(window=14).std().iloc[-1] * 1000
    
    # Velocity (Momentum): 5-day simple return
    momentum = price_pivot.pct_change(5).iloc[-1]
    
    print(f"   ✅ Processed {len(price_pivot.columns)} tickers over {len(price_pivot)} days.")
    return price_pivot, log_returns, volatility, momentum

def fetch_narrative_data():
    print("📰 Fetching Knowledge Graph & Headlines...")
    
    # 1. Get Latest Articles (News First Strategy)
    news_resp = supabase.table("news_vectors")\
        .select("id, headline, published_at")\
        .order("published_at", desc=True)\
        .limit(1000)\
        .execute()
        
    if not news_resp.data:
        print("   ⚠️ No news found.")
        return {}

    article_map = {n['id']: n for n in news_resp.data}
    article_ids = list(article_map.keys())
    
    # 2. Get Edges (Article -> Ticker)
    edges_resp = supabase.table("knowledge_graph")\
        .select("source_node, target_node")\
        .in_("source_node", article_ids)\
        .eq("edge_type", "MENTIONS")\
        .execute()
        
    ticker_news = {}
    
    # 3. Map Ticker -> Latest Headline
    for edge in edges_resp.data:
        ticker = edge['target_node']
        article_id = edge['source_node']
        article = article_map.get(article_id)
        
        if article:
            current = ticker_news.get(ticker)
            # Use newer article if exists
            if not current or article['published_at'] > current['published_at']:
                ticker_news[ticker] = article
                
    return ticker_news

def generate_spacetime_cube():
    print("🚀 Starting Market Map Generation (2D)...")
    
    # 1. Physics Layer
    price_df, returns_df, volatility, momentum = fetch_market_data()
    valid_tickers = price_df.columns.tolist()
    
    # 2. Narrative Layer
    news_map = fetch_narrative_data()
    
    # 3. Geometry Layer (UMAP)
    print("   🧠 Calculating 2D Manifold...")
    scaler = RobustScaler()
    scaled_data = scaler.fit_transform(returns_df.values)
    
    # Transpose: Map TICKERS (cols)
    ticker_matrix = scaled_data.T 
    
    reducer = umap.UMAP(
        n_neighbors=UMAP_NEIGHBORS,
        min_dist=UMAP_MIN_DIST,
        n_components=UMAP_COMPONENTS, # 2D
        metric='cosine',
        init='random',
        random_state=42,
        n_jobs=1
    )
    
    embedding = reducer.fit_transform(ticker_matrix)
    
    # 4. Synthesis
    print("   💧 Hydrating Nodes...")
    results = []
    
    for i, ticker in enumerate(valid_tickers):
        # Geometry (Scale x10)
        x = float(embedding[i, 0]) * 10 
        y = float(embedding[i, 1]) * 10
        
        # Physics (Sanitized)
        energy = sanitize(volatility.get(ticker, 0))
        mom_val = sanitize(momentum.get(ticker, 0))
        
        # Narrative
        article = news_map.get(ticker, {})
        headline = article.get('headline', "")
        sentiment = get_sentiment(headline)
        
        results.append({
            "ticker": ticker,
            "x": x,
            "y": y,
            "z": 0, # Flat plane for compatibility
            "vx": mom_val * 50, # Visual Vector Projection
            "vy": mom_val * 50, 
            "energy": energy,
            "headline": headline,
            "sentiment": sentiment
        })
        
    # 5. Export
    output = {
        "date": price_df.index[-1],
        "nodes": results
    }
    
    with open("spacetime_cube.json", "w") as f:
        json.dump(output, f, indent=2)
        
    print(f"   ✨ Success! Generated {len(results)} nodes for MarketMap.")

if __name__ == "__main__":
    generate_spacetime_cube()
