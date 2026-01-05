import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react'; // Added Suspense, lazy
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import GlobalControlBar from './components/GlobalControlBar'; 
import { Activity, Zap, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useSystemHeartbeat } from './hooks/useSystemHeartbeat';
import { getSentimentColor, getRiskColor, getMomentumColor } from './utils/statusHelpers';

// --- LAZY LOAD HEAVY COMPONENTS ---
// This prevents the 4MB Plotly chunk from blocking the initial page paint
const InspectorCard = lazy(() => import('./components/InspectorCard'));
const MarketPsychologyMap = lazy(() => import('./components/MarketPsychologyMap'));

// --- CONFIGURATION ---
const MAG7_CONFIG = {
  NVDA: { color: '#4ade80', label: 'NVDA' },
  TSLA: { color: '#f87171', label: 'TSLA' },
  AAPL: { color: '#94a3b8', label: 'AAPL' },
  MSFT: { color: '#38bdf8', label: 'MSFT' },
  AMZN: { color: '#fbbf24', label: 'AMZN' },
  GOOGL: { color: '#818cf8', label: 'GOOGL' },
  META: { color: '#c084fc', label: 'META' } 
};

const WATCHLIST = ['AAPL', 'AMZN', 'GOOGL', 'META', 'MSFT', 'NVDA', 'TSLA'];

function App() {
  
  // --- STATE ---
  const { data: heartbeat } = useSystemHeartbeat();

  // Global State
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('AAPL'); 

  // Data State
  const [chaosRaw, setChaosRaw] = useState([]); 
  const [chaosMeta, setChaosMeta] = useState(null);
  const [chaosLoading, setChaosLoading] = useState(true);

  const [whaleData, setWhaleData] = useState(null);
  const [whaleLoading, setWhaleLoading] = useState(true);

  const [magRaw, setMagRaw] = useState([]); 
  const [magMeta, setMagMeta] = useState(null);
  const [magLoading, setMagLoading] = useState(true);

  const [sentVolRaw, setSentVolRaw] = useState([]);
  const [sentVolMeta, setSentVolMeta] = useState(null);
  const [sentVolLoading, setSentVolLoading] = useState(true);

  // New: Map Metadata State (Bubbled up from Child)
  const [mapMeta, setMapMeta] = useState(null);

  // UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarTab, setSidebarTab] = useState('risk'); 

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FETCHING ---
  // (Your fetching logic remains exactly the same...)
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

    fetch('/data/mag7.json').then(res => res.json()).then(json => {
        setMagRaw(json.data); setMagMeta(json.meta); setMagLoading(false);
      }).catch(err => { console.error("Mag 7 Error:", err); setMagLoading(false); });

    fetch('/data/sentiment_volatility.json').then(res => res.json()).then(json => {
        setSentVolRaw(json.data); setSentVolMeta(json.meta); setSentVolLoading(false);
      }).catch(err => { console.error("Sent/Vol Error:", err); setSentVolLoading(false); });
  }, []);

  // --- METRICS ---
  // (Your metric logic remains exactly the same...)
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
    const todayData = chaosRaw.filter(d => d.trade_date === selectedDate);
    if (!todayData.length) return { value: "--", sub: "No Data" };
    const maxIVRow = todayData.reduce((prev, current) => (prev.iv > current.iv) ? prev : current);
    return { value: `${maxIVRow.ticker}`, sub: `Max IV: ${maxIVRow.iv.toFixed(0)}%`, isExtreme: maxIVRow.iv > 100 };
  }, [chaosRaw, selectedDate]);

  const magLeaderMetric = useMemo(() => {
    if (!magRaw.length || !selectedDate) return { value: "--", sub: "Flat" };
    const todayStats = magRaw.filter(d => d.trade_date === selectedDate);
    if (!todayStats.length) return { value: "--", sub: "Flat" };
    const leader = todayStats.reduce((prev, current) => (Math.abs(prev.net_sentiment_flow) > Math.abs(current.net_sentiment_flow)) ? prev : current);
    const flowM = (leader.net_sentiment_flow / 1000000).toFixed(1);
    return { value: leader.ticker, sub: `Net Flow: ${leader.net_sentiment_flow > 0 ? "+" : ""}$${flowM}M`, isPositive: leader.net_sentiment_flow > 0 };
  }, [magRaw, selectedDate]);

  // --- PLOT HELPERS ---
  // (Your plot helpers remain exactly the same...)
  const getMag7PlotData = () => { /* ... */ return []; }; // Kept abbreviated for clarity, paste your original logic here
  const getFilteredChaosPlot = () => { /* ... */ return []; };
  const getSentimentPlotData = () => { /* ... */ return []; };

  // --- LAYOUTS ---
  const scatterLayout = { /* ... */ }; 
  const lineLayout = { /* ... */ };
  const sentimentLayout = { /* ... */ };

  const sidebarProps = sidebarTab === 'momentum' ? {
        title: "Mag 7 Momentum", tag: "Trend", desc: magMeta?.inspector.description || "Net Sentiment Flow",
        isLoading: magLoading, chartType: "line", plotData: getMag7PlotData(), 
        plotLayout: lineLayout, sqlCode: magMeta?.inspector.sql_logic, dbtCode: magMeta?.inspector.dbt_logic, dbtYml: magMeta?.inspector.dbt_yml
    } : {
        title: "Risk Radar", tag: "AI MODEL", desc: "Sentiment vs Volatility",
        isLoading: sentVolLoading, chartType: "scatter", plotData: getSentimentPlotData(),
        plotLayout: sentimentLayout, sqlCode: sentVolMeta?.inspector.sql_logic, dbtCode: sentVolMeta?.inspector.dbt_logic, dbtYml: sentVolMeta?.inspector.dbt_yml
    };

  return (
    <div className="app-container">
      
      {/* 1. HEADER (Brand & Nav Only) */}
      <div className="sticky-header-group">
        <Header />
      </div>

      <main className="bento-grid">
        
        {/* 2. KPI STRIP (Lightweight - Renders Instantly) */}
        <div className="span-4 metric-strip area-metrics">
           <MetricCard title="Market Sentiment" value={(Math.random() * 100).toFixed(0)} subValue="Fear / Greed Index" icon={<TrendingUp size={16} className="text-accent" />} />
           <MetricCard title="Whale Flow" value={whaleMetric.value} subValue={whaleMetric.sub} icon={<Activity size={16} className={getSentimentColor(whaleMetric.isBullish)} />} />
           <MetricCard title="Max Volatility" value={chaosMetric.value} subValue={chaosMetric.sub} icon={<Zap size={16} className={getRiskColor(chaosMetric.isExtreme)} />} />
           <MetricCard title="Mag 7 Leader" value={magLeaderMetric.value} subValue={magLeaderMetric.sub} icon={magLeaderMetric.isPositive ? <ArrowUpRight size={16} className={getMomentumColor(true)}/> : <ArrowDownRight size={16} className={getMomentumColor(false)}/>} />
        </div>

        {/* --- LAZY LOAD BOUNDARY START --- */}
        {/* Everything inside here waits for the heavy JS chunks to download */}
        <Suspense fallback={<div className="span-4 h-tall flex items-center justify-center text-muted animate-pulse">Initializing AI Models...</div>}>

            {/* 3. MARKET PSYCHOLOGY HERO */}
            <div className="span-4 h-tall area-cluster">
               <InspectorCard 
                 className="ai-hero-card"
                 title="Market Psychology Map"
                 tag="AI MODEL"
                 desc="t-SNE Clustering of Uses OpenAI Embeddings..."
                 sqlCode={mapMeta?.inspector?.sql_logic}
                 dbtCode={mapMeta?.inspector?.dbt_logic}
                 dbtYml={mapMeta?.inspector?.dbt_yml}
                 plotLayout={{ margin: { l: 0, r: 0, t: 0, b: 0 }, xaxis: { visible: false }, yaxis: { visible: false } }}
                 customChart={
                     <MarketPsychologyMap onMetaLoaded={setMapMeta} />
                 }
               />
            </div>

            {/* 4. CONTROLS */}
            <div className="span-4 control-bar-spacing area-controls">
                <GlobalControlBar 
                  dates={chaosMeta?.available_dates || []} selectedDate={selectedDate} onDateChange={setSelectedDate}
                  availableTickers={WATCHLIST} selectedTicker={selectedTicker} onTickerChange={setSelectedTicker}
                />
            </div>

            {/* 5. STRUCTURE & TREND */}
            <div className="span-2 h-standard area-chaos">
               <InspectorCard 
                 title={`Chaos Map: ${selectedTicker}`} tag="Gamma" desc={chaosMeta?.inspector.description}
                 isLoading={chaosLoading} chartType="scatter" plotData={getFilteredChaosPlot()} plotLayout={scatterLayout}
                 sqlCode={chaosMeta?.inspector.sql_logic} dbtCode={chaosMeta?.inspector.dbt_logic} dbtYml={chaosMeta?.inspector.dbt_yml} 
               />
            </div>

            <div className="span-2 h-standard area-risk">
                <InspectorCard 
                  className="ai-hero-card" 
                  {...sidebarProps} 
                  headerControls={
                      <div className="header-tabs">
                          <button className={`header-tab-btn ${sidebarTab === 'risk' ? 'active' : ''}`} onClick={() => setSidebarTab('risk')}>Risk</button>
                          <button className={`header-tab-btn ${sidebarTab === 'momentum' ? 'active' : ''}`} onClick={() => setSidebarTab('momentum')}>Trend</button>
                      </div>
                  }
                >
                   {sidebarTab === 'momentum' && (
                     <div className="ticker-controls-compact">
                        <span className="text-muted text-sm">Showing All 7</span>
                     </div>
                   )}
                </InspectorCard>
            </div>

            {/* 6. WHALE HUNTER */}
            <div className="span-4 h-tall area-whale">
               <InspectorCard 
                 title={whaleData?.meta.title || "Whale Hunter"} tag="Flow" desc={whaleData?.meta.inspector.description}
                 isLoading={whaleLoading} chartType="table" tableData={whaleData?.data}
                 sqlCode={whaleData?.meta.inspector.sql_logic} dbtCode={whaleData?.meta.inspector.dbt_logic} dbtYml={whaleData?.meta.inspector.dbt_yml} 
               />
            </div>

        </Suspense> 
        {/* --- LAZY LOAD BOUNDARY END --- */}

      </main>
      <Footer />
    </div>
  );
}

export default App;
