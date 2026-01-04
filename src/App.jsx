import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';
import GlobalControlBar from './components/GlobalControlBar'; 
import { Activity, Zap, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { useSystemHeartbeat } from './hooks/useSystemHeartbeat';
import { getSentimentColor, getRiskColor, getMomentumColor } from './utils/statusHelpers';

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
  const [selectedTicker, setSelectedTicker] = useState('NVDA'); 

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

  // UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarTab, setSidebarTab] = useState('risk'); 

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

    fetch('/data/mag7.json').then(res => res.json()).then(json => {
        setMagRaw(json.data); setMagMeta(json.meta); setMagLoading(false);
      }).catch(err => { console.error("Mag 7 Error:", err); setMagLoading(false); });

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
  const getMag7PlotData = () => {
    if (!magRaw || magRaw.length === 0) return [];
    return Object.keys(MAG7_CONFIG).map(ticker => {
      const tickerData = magRaw.filter(d => d.ticker === ticker);
      return {
        x: tickerData.map(d => d.trade_date), y: tickerData.map(d => d.net_sentiment_flow),
        name: ticker, type: 'scatter', mode: 'lines', line: { color: MAG7_CONFIG[ticker]?.color || '#ccc', width: 2 },
      };
    });
  };

  const getFilteredChaosPlot = () => {
    if (!selectedDate || chaosRaw.length === 0) return [];
    const dailyData = chaosRaw.filter(d => d.trade_date?.startsWith(selectedDate) && d.ticker === selectedTicker);
    return [{
       x: dailyData.map(d => d.dte), y: dailyData.map(d => d.moneyness),
       text: dailyData.map(d => `Strike: ${d.strike}<br>IV: ${d.iv.toFixed(1)}%`),
       mode: 'markers', type: 'scatter',
       marker: {
         size: dailyData.map(d => Math.log(d.chaos_score || d.volume) * 3),
         color: dailyData.map(d => d.iv), colorscale: 'Viridis', showscale: !isMobile, opacity: 0.8, line: { color: 'white', width: 0.5 },
         colorbar: { title: 'IV%', titleside: 'right', titlefont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' }, tickfont: { size: 10, color: '#94a3b8', family: 'JetBrains Mono' }, x: 1, thickness: 12, bgcolor: 'rgba(0,0,0,0)', outlinecolor: 'rgba(0,0,0,0)' }
       }
    }];
  };

  const getSentimentPlotData = () => {
    if (!sentVolRaw || sentVolRaw.length === 0 || !selectedDate) return [];
    const dailyData = sentVolRaw.filter(d => d.trade_date === selectedDate);
    if (dailyData.length === 0) return [];
    
    return dailyData.map(row => ({
      x: [row.sentiment_signal], 
      y: [row.avg_iv], 
      mode: 'markers', 
      name: row.ticker, 
      marker: { 
         size: [Math.max(6, Math.log(row.news_volume || 1) * 10)], 
         color: MAG7_CONFIG[row.ticker]?.color || '#94a3b8', 
         opacity: 0.8, 
         line: { color: 'white', width: 1 },
         sizemode: 'area', 
         sizeref: 0.2
      },
      hovertemplate: `
        <b>${row.ticker}</b><br>
        Sentiment: %{x:.2f}<br>
        Implied Vol: %{y:.1f}%<br>
        News Vol: ${row.news_volume || 0}
        <extra></extra>
      `
    }));
  };

  // --- LAYOUTS ---
  const scatterLayout = { xaxis: { title: 'DTE', gridcolor: '#334155' }, yaxis: { title: 'Moneyness', gridcolor: '#334155', range: [0.5, 1.8] }, showlegend: false, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#94a3b8' }, margin: isMobile ? { t: 10, b: 40, l: 30, r: 0 } : { t: 10, b: 40, l: 40, r: 20 } };
  const lineLayout = { xaxis: { title: 'Trend', gridcolor: '#334155' }, yaxis: { title: 'Flow', gridcolor: '#334155' }, showlegend: false, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#94a3b8' }, margin: isMobile ? { t: 10, b: 40, l: 30, r: 5 } : { t: 10, b: 40, l: 40, r: 10 } };
  const sentimentLayout = { xaxis: { title: 'Sentiment', gridcolor: '#334155', range: [-1, 1], zeroline: true }, yaxis: { title: 'IV', gridcolor: '#334155' }, showlegend: false, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#94a3b8' }, margin: isMobile ? { t: 10, b: 40, l: 30, r: 10 } : { t: 20, b: 40, l: 50, r: 20 }, shapes: [{ type: 'rect', xref: 'x', yref: 'paper', x0: -1, y0: 0.5, x1: 0, y1: 1, fillcolor: '#ef4444', opacity: 0.05, line: { width: 0 }}, { type: 'rect', xref: 'x', yref: 'paper', x0: 0, y0: 0, x1: 1, y1: 0.5, fillcolor: '#22c55e', opacity: 0.05, line: { width: 0 }}] };

  const sidebarProps = sidebarTab === 'momentum' ? {
        title: "Mag 7 Momentum", tag: "Trend", desc: magMeta?.inspector.description || "Net Sentiment Flow",
        isLoading: magLoading, chartType: "line", plotData: getMag7PlotData(), 
        plotLayout: lineLayout, sqlCode: magMeta?.inspector.sql_logic, dbtCode: magMeta?.inspector.dbt_logic, dbtYml: magMeta?.inspector.dbt_yml
    } : {
        title: "Risk Radar", tag: "Alpha", desc: "Sentiment vs Volatility",
        isLoading: sentVolLoading, chartType: "scatter", plotData: getSentimentPlotData(),
        plotLayout: sentimentLayout, sqlCode: sentVolMeta?.inspector.sql_logic, dbtCode: sentVolMeta?.inspector.dbt_logic, dbtYml: sentVolMeta?.inspector.dbt_yml
    };

  return (
    <div className="app-container">
      
      <div className="sticky-header-group">
        <Header />
        <GlobalControlBar 
          dates={chaosMeta?.available_dates || []} selectedDate={selectedDate} onDateChange={setSelectedDate}
          availableTickers={WATCHLIST} selectedTicker={selectedTicker} onTickerChange={setSelectedTicker}
        />
      </div>

      <main className="bento-grid">
        
        {/* ROW 1: KPI STRIP (Horizontal Scroll on Mobile) */}
        <div className="span-4 metric-strip">
           <MetricCard title="Market Sentiment" value={(Math.random() * 100).toFixed(0)} subValue="Fear / Greed Index" icon={<TrendingUp size={16} className="text-accent" />} />
           <MetricCard title="Whale Flow" value={whaleMetric.value} subValue={whaleMetric.sub} icon={<Activity size={16} className={getSentimentColor(whaleMetric.isBullish)} />} />
           <MetricCard title="Max Volatility" value={chaosMetric.value} subValue={chaosMetric.sub} icon={<Zap size={16} className={getRiskColor(chaosMetric.isExtreme)} />} />
           <MetricCard title="Mag 7 Leader" value={magLeaderMetric.value} subValue={magLeaderMetric.sub} icon={magLeaderMetric.isPositive ? <ArrowUpRight size={16} className={getMomentumColor(true)}/> : <ArrowDownRight size={16} className={getMomentumColor(false)}/>} />
        </div>

        {/* ROW 2: SPLIT VIEW */}
        <div className="span-3 h-tall">
           <InspectorCard 
             title={`Chaos Map: ${selectedTicker}`} tag="Gamma" desc={chaosMeta?.inspector.description}
             isLoading={chaosLoading} chartType="scatter" plotData={getFilteredChaosPlot()} plotLayout={scatterLayout}
             sqlCode={chaosMeta?.inspector.sql_logic} dbtCode={chaosMeta?.inspector.dbt_logic} dbtYml={chaosMeta?.inspector.dbt_yml} 
           />
        </div>

        <div className="h-tall">
            <InspectorCard 
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

        {/* ROW 3: WHALE HUNTER */}
        <div className="span-4">
           <InspectorCard 
             title={whaleData?.meta.title || "Whale Hunter"} tag="Flow" desc={whaleData?.meta.inspector.description}
             isLoading={whaleLoading} chartType="table" tableData={whaleData?.data}
             sqlCode={whaleData?.meta.inspector.sql_logic} dbtCode={whaleData?.meta.inspector.dbt_logic} dbtYml={whaleData?.meta.inspector.dbt_yml} 
           />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
