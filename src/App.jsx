import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { useSystemHeartbeat } from './hooks/useSystemHeartbeat';
import { getSentimentColor, getRiskColor } from './utils/statusHelpers';
import { ChevronDown } from 'lucide-react'; 

// --- LAZY LOAD ---
const InspectorCard = lazy(() => import('./components/InspectorCard'));
const MarketPsychologyMap = lazy(() => import('./components/MarketPsychologyMap'));

// --- CONFIGURATION ---
const TICKER_COLORS = {
  NVDA: { color: '#4ade80', label: 'NVDA' },
  TSLA: { color: '#f87171', label: 'TSLA' },
  AAPL: { color: '#94a3b8', label: 'AAPL' },
  MSFT: { color: '#38bdf8', label: 'MSFT' },
  AMZN: { color: '#fbbf24', label: 'AMZN' },
  GOOGL: { color: '#818cf8', label: 'GOOGL' },
  META: { color: '#c084fc', label: 'META' } 
};
const WATCHLIST = ['AAPL', 'AMZN', 'GOOGL', 'META', 'MSFT', 'NVDA', 'TSLA'];

// --- MISSING LAYOUT DEFINITIONS (FIXED) ---
const scatterLayout = {
  xaxis: { title: 'Days to Expiry (DTE)', automargin: true },
  yaxis: { title: 'Moneyness', automargin: true },
  showlegend: false
};

const sentimentLayout = {
  xaxis: { title: 'Sentiment Signal', range: [-1, 1], automargin: true },
  yaxis: { title: 'Implied Volatility', automargin: true },
  showlegend: false
};

function App() {
  
  // --- STATE ---
  const { data: heartbeat } = useSystemHeartbeat();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('AAPL'); 

  // Data State
  const [chaosRaw, setChaosRaw] = useState([]); 
  const [chaosMeta, setChaosMeta] = useState(null);
  const [chaosLoading, setChaosLoading] = useState(true);

  const [whaleData, setWhaleData] = useState(null);
  const [whaleLoading, setWhaleLoading] = useState(true);

  const [sentVolRaw, setSentVolRaw] = useState([]);
  const [sentVolMeta, setSentVolMeta] = useState(null);
  const [sentVolLoading, setSentVolLoading] = useState(true);

  const [mapMeta, setMapMeta] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FETCHING ---
  useEffect(() => {
    fetch('/data/chaos.json').then(res => res.json()).then(json => {
        setChaosRaw(json.data); 
        setChaosMeta(json.meta);
        if (json.meta.available_dates?.length > 0) {
           setSelectedDate(json.meta.available_dates[json.meta.available_dates.length - 1]);
        }
        setChaosLoading(false);
      }).catch(err => { console.error("Chaos Error:", err); setChaosLoading(false); });

    fetch('/data/whales.json').then(res => res.json()).then(json => { 
        setWhaleData(json); setWhaleLoading(false); 
    }).catch(err => { console.error("Whale Error:", err); setWhaleLoading(false); });

    fetch('/data/sentiment_volatility.json').then(res => res.json()).then(json => {
        setSentVolRaw(json.data); setSentVolMeta(json.meta); setSentVolLoading(false);
      }).catch(err => { console.error("Sent/Vol Error:", err); setSentVolLoading(false); });
  }, []);

  // --- METRICS ---
  const whaleMetric = useMemo(() => {
    if (!whaleData?.data) return { value: "$0M", sub: "No Data" };
    let bullTotal = 0, total = 0;
    whaleData.data.forEach(row => {
        total += row.premium || 0;
        if (row.sentiment === 'Bullish') bullTotal += (row.premium || 0);
    });
    const bullPct = total > 0 ? Math.round((bullTotal / total) * 100) : 0;
    const formattedTotal = Math.abs(total) >= 1000000000 ? `$${(total / 1000000000).toFixed(2)}B` : `$${(total / 1000000).toFixed(1)}M`;
    return { value: formattedTotal, sub: `${bullPct > 50 ? bullPct : 100 - bullPct}% ${bullPct > 50 ? 'Bullish' : 'Bearish'} Flow`, isBullish: bullPct > 50 };
  }, [whaleData]);

  const chaosMetric = useMemo(() => {
    if (!chaosRaw.length || !selectedDate) return { value: "--", sub: "Low Volatility" };
    const tickerData = chaosRaw.filter(d => d.trade_date === selectedDate && d.ticker === selectedTicker);
    if (!tickerData.length) return { value: "--", sub: "No Data" };
    const maxIVRow = tickerData.reduce((prev, current) => (prev.iv > current.iv) ? prev : current);
    return { 
        value: `${maxIVRow.iv.toFixed(0)}%`, 
        sub: `Strike: $${maxIVRow.strike}`, 
        isExtreme: maxIVRow.iv > 100 
    };
  }, [chaosRaw, selectedDate, selectedTicker]);

  const riskMetric = useMemo(() => {
    if (!sentVolRaw.length || !selectedDate) return { value: "--", label: "AVG SENTIMENT", color: "text-gray-500" };
    const todayData = sentVolRaw.filter(d => d.trade_date === selectedDate && WATCHLIST.includes(d.ticker));
    if (!todayData.length) return { value: "--", label: "AVG SENTIMENT", color: "text-gray-500" };
    const avgSent = todayData.reduce((acc, curr) => acc + (curr.sentiment_signal || 0), 0) / todayData.length;
    return { 
        value: avgSent.toFixed(2), 
        label: "Market Mood", 
        color: avgSent > 0 ? "text-green-500" : "text-red-500" 
    };
  }, [sentVolRaw, selectedDate]);

  // --- PLOT HELPERS ---
  const getFilteredChaosPlot = () => {
    if (!selectedDate || chaosRaw.length === 0) return [];
    const dailyData = chaosRaw.filter(d => d.trade_date?.startsWith(selectedDate) && d.ticker === selectedTicker);
    return [{
       x: dailyData.map(d => d.dte), y: dailyData.map(d => d.moneyness),
       text: dailyData.map(d => `Strike: ${d.strike}<br>IV: ${d.iv.toFixed(1)}%`),
       mode: 'markers', type: 'scatter',
       marker: {
         size: dailyData.map(d => Math.log(d.chaos_score || d.volume) * 3),
         color: dailyData.map(d => d.iv), 
         colorscale: 'Viridis', 
         showscale: !isMobile, 
         opacity: 0.8, 
         line: { color: 'white', width: 0.5 },
         colorbar: { orientation: 'v', x: 1.01, y: 0.5, yanchor: 'middle', len: 0.9, thickness: 10, tickfont: { size: 9, color: '#94a3b8', family: 'JetBrains Mono' }, bgcolor: 'rgba(0,0,0,0)', outlinecolor: 'rgba(0,0,0,0)' }
       }
    }];
  };

  const getSentimentPlotData = () => {
    if (!sentVolRaw || sentVolRaw.length === 0 || !selectedDate) return [];
    const dailyData = sentVolRaw.filter(d => d.trade_date === selectedDate && WATCHLIST.includes(d.ticker)).sort((a, b) => a.ticker.localeCompare(b.ticker));
    if (dailyData.length === 0) return [];
    return dailyData.map(row => ({
      x: [row.sentiment_signal], y: [row.avg_iv], mode: 'markers', name: row.ticker, 
      marker: { 
         size: [Math.max(6, Math.log(row.news_volume || 1) * 10)], 
         color: TICKER_COLORS[row.ticker]?.color || '#94a3b8', opacity: 0.8, line: { color: 'white', width: 1 },
         sizemode: 'area', sizeref: 0.2
      },
      hovertemplate: `<b>${row.ticker}</b><br>Sentiment: %{x:.2f}<br>Implied Vol: %{y:.1f}%<br>News Vol: ${row.news_volume || 0}<extra></extra>`
    }));
  };

  // --- UI HELPERS ---
  const renderMetric = (label, value, colorClass) => (
    <div className="flex flex-col items-end leading-tight min-w-[80px]">
      <span className="text-[10px] uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-sm font-bold font-mono ${colorClass}`}>{value}</span>
    </div>
  );

  // UPDATED: Uses standard CSS classes defined in Step 1
  const renderTickerSelector = () => (
    <div className="ticker-select-container">
        <select 
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="ticker-select-input"
        >
            {WATCHLIST.map(t => <option key={t} value={t} style={{color: 'black'}}>{t}</option>)}
        </select>
        <ChevronDown size={12} className="ticker-select-arrow" />
    </div>
  );

  return (
    <div className="app-container">
      
      <div className="sticky-header-group">
        <Header />
      </div>

      <main className="bento-grid pt-4">
        
        <Suspense fallback={<div className="span-4 h-tall flex items-center justify-center text-muted animate-pulse">Initializing AI Models...</div>}>

            {/* 2. HERO: MARKET PSYCHOLOGY */}
            <div className="span-4 h-tall area-cluster">
               <InspectorCard 
                 className="ai-hero-card"
                 title="Market Psychology Map"
                 tag="AI MODEL" 
                 desc="t-SNE Clustering Using OpenAI Embeddings"
                 headerControls={renderMetric("Fear/Greed", "NEUTRAL", "text-blue-500")}
                 sqlCode={mapMeta?.inspector?.sql_logic}
                 dbtCode={mapMeta?.inspector?.dbt_logic}
                 dbtYml={mapMeta?.inspector?.dbt_yml}
                 plotLayout={{ margin: { l: 0, r: 0, t: 0, b: 0 }, xaxis: { visible: false }, yaxis: { visible: false } }}
                 customChart={
                    <MarketPsychologyMap onMetaLoaded={setMapMeta} isMobile={isMobile} />
                 }
               />
            </div>

            {/* 3. STRUCTURE: CHAOS MAP */}
            <div className="span-2 h-standard area-chaos">
               <InspectorCard 
                 title={
                    <div className="flex items-center">
                        <span>Chaos Map</span>
                        {renderTickerSelector()}
                    </div>
                 }
                 desc={`Structural Risk for ${selectedTicker}`}
                 
                 // Metric on the Right
                 headerControls={renderMetric("Max IV", chaosMetric.value, getRiskColor(chaosMetric.isExtreme))}
                 
                 isLoading={chaosLoading} 
                 chartType="scatter" 
                 plotData={getFilteredChaosPlot()} 
                 plotLayout={scatterLayout}
                 sqlCode={chaosMeta?.inspector.sql_logic} 
                 dbtCode={chaosMeta?.inspector.dbt_logic} 
                 dbtYml={chaosMeta?.inspector.dbt_yml} 
               />
            </div>

            {/* 4. RISK: RISK RADAR */}
            <div className="span-2 h-standard area-risk">
                <InspectorCard 
                  title="Risk Radar" 
                  desc="Sentiment vs Volatility (Market Wide)"
                  isLoading={sentVolLoading} 
                  chartType="scatter" 
                  plotData={getSentimentPlotData()}
                  plotLayout={sentimentLayout} 
                  sqlCode={sentVolMeta?.inspector.sql_logic} 
                  dbtCode={sentVolMeta?.inspector.dbt_logic} 
                  dbtYml={sentVolMeta?.inspector.dbt_yml}
                  headerControls={renderMetric(riskMetric.label, riskMetric.value, riskMetric.color)}
                />
            </div>

            {/* 5. FLOW: WHALE HUNTER */}
            <div className="span-4 h-tall area-whale">
               <InspectorCard 
                 title={whaleData?.meta.title || "Whale Hunter"} 
                 desc={whaleData?.meta.inspector.description}
                 headerControls={renderMetric("Net Flow", whaleMetric.value, getSentimentColor(whaleMetric.isBullish))}
                 isLoading={whaleLoading} chartType="table" tableData={whaleData?.data}
                 sqlCode={whaleData?.meta.inspector.sql_logic} dbtCode={whaleData?.meta.inspector.dbt_logic} dbtYml={whaleData?.meta.inspector.dbt_yml} 
               />
            </div>

        </Suspense> 

      </main>
      <Footer />
    </div>
  );
}

export default App;
