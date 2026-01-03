import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';
import { SystemStatusRibbon } from './components/SystemStatusRibbon';
import GlobalControlBar from './components/GlobalControlBar'; // UPDATED IMPORT
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

// Chaos tickers to show in the global selector
const WATCHLIST = ['GME', 'TSLA', 'SPY', 'NVDA', 'AAPL', 'AMZN', 'MSFT'];

function App() {
  
  // --- STATE ---
  const { data: heartbeat } = useSystemHeartbeat();

  // Global State (Controls the whole dashboard)
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('GME'); // Default Ticker

  // Chaos State
  const [chaosRaw, setChaosRaw] = useState([]); 
  const [chaosMeta, setChaosMeta] = useState(null);
  const [chaosLoading, setChaosLoading] = useState(true);

  // Whale State
  const [whaleData, setWhaleData] = useState(null);
  const [whaleLoading, setWhaleLoading] = useState(true);

  // Mag 7 State
  const [magRaw, setMagRaw] = useState([]); 
  const [magMeta, setMagMeta] = useState(null);
  const [magLoading, setMagLoading] = useState(true);

  // Sentiment vs Volatility State
  const [sentVolRaw, setSentVolRaw] = useState([]);
  const [sentVolMeta, setSentVolMeta] = useState(null);
  const [sentVolLoading, setSentVolLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FETCHING ---
  useEffect(() => {
    // 1. Chaos Data
    fetch('/data/chaos.json')
      .then(res => res.json())
      .then(json => {
        setChaosRaw(json.data); 
        setChaosMeta(json.meta);
        // Initialize Date from data if not set
        if (json.meta.available_dates?.length > 0) {
           setSelectedDate(json.meta.available_dates[json.meta.available_dates.length - 1]);
        }
        setChaosLoading(false);
      })
      .catch(err => { console.error("Chaos Error:", err); setChaosLoading(false); });

    // 2. Whale Data
    fetch('/data/whales.json')
      .then(res => res.json())
      .then(json => { setWhaleData(json); setWhaleLoading(false); })
      .catch(err => { console.error("Whale Error:", err); setWhaleLoading(false); });

    // 3. Mag 7 Momentum
    fetch('/data/mag7.json')
      .then(res => res.json())
      .then(json => {
        setMagRaw(json.data);
        setMagMeta(json.meta);
        setMagLoading(false);
      })
      .catch(err => { console.error("Mag 7 Error:", err); setMagLoading(false); });

    // 4. Sentiment vs Volatility
    fetch('/data/sentiment_volatility.json')
      .then(res => res.json())
      .then(json => {
        setSentVolRaw(json.data);
        setSentVolMeta(json.meta);
        setSentVolLoading(false);
      })
      .catch(err => { console.error("Sent/Vol Error:", err); setSentVolLoading(false); });

  }, []);

  // --- SMART METRICS ---

  // 1. Whale Sentiment
  const whaleMetric = useMemo(() => {
    if (!whaleData?.data) return { value: "$0M", sub: "No Data" };
    
    let bullTotal = 0;
    let total = 0;

    whaleData.data.forEach(row => {
        const premium = row.premium || 0;
        total += premium;
        if (row.sentiment === 'Bullish') bullTotal += premium;
    });

    const bullPct = total > 0 ? Math.round((bullTotal / total) * 100) : 0;
    const bearPct = 100 - bullPct; 
    
    let formattedTotal;
    if (Math.abs(total) >= 1000000000) {
        formattedTotal = `$${(total / 1000000000).toFixed(2)}B`;
    } else {
        formattedTotal = `$${(total / 1000000).toFixed(1)}M`;
    }

    const isBullish = bullPct > 50;

    return {
        value: formattedTotal,
        sub: isBullish ? `${bullPct}% Bullish Flow` : `${bearPct}% Bearish Flow`,
        isBullish: isBullish
    };
  }, [whaleData]);

  // 2. Max Chaos (Contextual to Selected Date)
  const chaosMetric = useMemo(() => {
    if (!chaosRaw.length || !selectedDate) return { value: "--", sub: "Low Volatility" };
    
    const todayData = chaosRaw.filter(d => d.trade_date === selectedDate);
    if (!todayData.length) return { value: "--", sub: "No Data" };

    const maxIVRow = todayData.reduce((prev, current) => (prev.iv > current.iv) ? prev : current);
    
    return {
        value: `${maxIVRow.ticker}`,
        sub: `Max IV: ${maxIVRow.iv.toFixed(0)}%`,
        isExtreme: maxIVRow.iv > 100
    };
  }, [chaosRaw, selectedDate]);

  // 3. Mag 7 Leader (Contextual to Selected Date)
  const magLeaderMetric = useMemo(() => {
    if (!magRaw.length || !selectedDate) return { value: "--", sub: "Flat" };

    const todayStats = magRaw.filter(d => d.trade_date === selectedDate);
    if (!todayStats.length) return { value: "--", sub: "Flat" };

    const leader = todayStats.reduce((prev, current) => 
        (Math.abs(prev.net_sentiment_flow) > Math.abs(current.net_sentiment_flow)) ? prev : current
    );

    const flowM = (leader.net_sentiment_flow / 1000000).toFixed(1);
    const sign = leader.net_sentiment_flow > 0 ? "+" : "";

    return {
        value: leader.ticker,
        sub: `Net Flow: ${sign}$${flowM}M`,
        isPositive: leader.net_sentiment_flow > 0
    };
  }, [magRaw, selectedDate]);

  // --- CHART LOGIC ---

  // A. Mag 7 Line Chart
  const getMag7PlotData = () => {
    if (!magRaw || magRaw.length === 0) return [];
    
    // Always show all 7 in the momentum chart for context
    const tickersToShow = Object.keys(MAG7_CONFIG);
    
    return tickersToShow.map(ticker => {
      const tickerData = magRaw.filter(d => d.ticker === ticker);
      const config = MAG7_CONFIG[ticker] || { color: '#ccc' };
      return {
        x: tickerData.map(d => d.trade_date),
        y: tickerData.map(d => d.net_sentiment_flow),
        name: ticker,
        type: 'scatter',
        mode: 'lines',
        line: { color: config.color, width: 2 },
      };
    });
  };

  // B. Chaos Scatter (Re-renders based on global slider + global ticker)
  const getFilteredChaosPlot = () => {
    if (!selectedDate || chaosRaw.length === 0) return [];
    
    const dailyData = chaosRaw.filter(d => 
      d.trade_date?.startsWith(selectedDate) && 
      d.ticker === selectedTicker // Uses GLOBAL ticker state
    );

    return [{
       x: dailyData.map(d => d.dte),
       y: dailyData.map(d => d.moneyness),
       text: dailyData.map(d => `Strike: ${d.strike}<br>IV: ${d.iv.toFixed(1)}%`),
       mode: 'markers',
       type: 'scatter',
       marker: {
         // Use CHAOS_SCORE (Volume * IV) if available, else fallback
         size: dailyData.map(d => Math.log(d.chaos_score || d.volume) * 3),
         color: dailyData.map(d => d.iv),
         colorscale: 'Viridis',
         showscale: !isMobile, 
         opacity: 0.8,
         line: { color: 'white', width: 0.5 }
       }
    }];
  };

  // C. Sentiment vs Volatility (Re-renders based on global slider)
  const getSentimentPlotData = () => {
    if (!sentVolRaw || sentVolRaw.length === 0 || !selectedDate) return [];

    // Filter by selected date so the chart "plays" along with the slider
    const dailyData = sentVolRaw.filter(d => d.trade_date === selectedDate);
    
    if (dailyData.length === 0) return [];

    return dailyData.map(row => {
      const config = MAG7_CONFIG[row.ticker] || { color: '#94a3b8' };
      return {
        x: [row.sentiment_signal], 
        y: [row.avg_iv],           
        mode: 'markers+text',
        type: 'scatter',
        name: row.ticker,
        text: [row.ticker],
        textposition: 'top center',
        marker: {
          size: [Math.max(15, Math.log(row.news_volume || 1) * 8)], 
          color: config.color,
          opacity: 0.9,
          line: { color: 'white', width: 1 }
        },
        hovertemplate: 
          `<b>${row.ticker}</b><br>` +
          `Sentiment: %{x:.2f}<br>` +
          `Implied Vol: %{y:.1f}%<br>` +
          `<extra></extra>`
      };
    });
  };

  // --- LAYOUTS ---
  const scatterLayout = {
    xaxis: { title: 'DTE (Days to Expiration)', gridcolor: '#334155', zerolinecolor: '#334155' },
    yaxis: { title: 'Moneyness (Strike / Price)', gridcolor: '#334155', zerolinecolor: '#334155', range: [0.5, 1.8] },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)', 
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    margin: isMobile ? { t: 0, b: 40, l: 30, r: 0 } : { t: 10, b: 40, l: 40, r: 20 }
  };

  const lineLayout = {
    xaxis: { title: '30 Day Trend', gridcolor: '#334155' },
    yaxis: { title: 'Net Sentiment Flow', gridcolor: '#334155', zerolinecolor: '#334155' },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    margin: isMobile ? { t: 10, b: 40, l: 30, r: 5 } : { t: 10, b: 40, l: 40, r: 10 }
  };

  const sentimentLayout = {
    xaxis: { 
      title: 'News Sentiment', 
      gridcolor: '#334155', 
      zerolinecolor: '#94a3b8', 
      range: [-1, 1],
      zeroline: true
    },
    yaxis: { 
      title: 'Implied Volatility', 
      gridcolor: '#334155', 
      zerolinecolor: '#334155',
      autorange: true 
    },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    margin: isMobile ? { t: 10, b: 40, l: 30, r: 10 } : { t: 20, b: 40, l: 50, r: 20 },
    shapes: [
      { type: 'rect', xref: 'x', yref: 'paper', x0: -1, y0: 0.5, x1: 0, y1: 1, fillcolor: '#ef4444', opacity: 0.05, line: { width: 0 }},
      { type: 'rect', xref: 'x', yref: 'paper', x0: 0, y0: 0, x1: 1, y1: 0.5, fillcolor: '#22c55e', opacity: 0.05, line: { width: 0 }}
    ],
    annotations: [
      { x: 0.8, y: 10, text: "Healthy Growth", showarrow: false, font: {color: '#4ade80', size: 12} },
      { x: -0.8, y: 80, text: "Fear Zone", showarrow: false, font: {color: '#f87171', size: 12} }
    ]
  };

  return (
    <div className="app-container">
      <SystemStatusRibbon />
      <Header />
      
      {/* GLOBAL COMMAND BAR (Sticky) */}
      <GlobalControlBar 
        dates={chaosMeta?.available_dates || []}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        availableTickers={WATCHLIST}
        selectedTicker={selectedTicker}
        onTickerChange={setSelectedTicker}
      />

      <main className="bento-grid">
        
        {/* ROW 1: KPI CARDS (Removed System Health Card) */}
        <MetricCard 
          title="Market Sentiment" 
          value={(Math.random() * 100).toFixed(0)} // Placeholder or calculate from sentVolRaw
          subValue="Fear / Greed Index"
          icon={<TrendingUp size={16} className="text-accent" />}
        />
        
        <MetricCard 
          title="Whale Flow" 
          value={whaleMetric.value} 
          subValue={whaleMetric.sub} 
          icon={<Activity size={16} className={getSentimentColor(whaleMetric.isBullish)} />}
        />
        
        <MetricCard 
          title="Max Volatility" 
          value={chaosMetric.value} 
          subValue={chaosMetric.sub} 
          icon={<Zap size={16} className={getRiskColor(chaosMetric.isExtreme)} />}
        />

        <MetricCard 
          title="Mag 7 Leader" 
          value={magLeaderMetric.value} 
          subValue={magLeaderMetric.sub} 
          icon={magLeaderMetric.isPositive ? <ArrowUpRight size={16} className={getMomentumColor(true)}/> : <ArrowDownRight size={16} className={getMomentumColor(false)}/>} 
        />

        {/* ROW 2: THE HERO SPLIT (Chaos + Risk) */}
        
        {/* Chaos Map: 3/4 Width */}
        <div className="span-3 h-tall">
           <InspectorCard 
             title={`Chaos Map: ${selectedTicker}`}
             tag="Gamma"
             desc={chaosMeta?.inspector.description}
             isLoading={chaosLoading}
             chartType="scatter"
             plotData={getFilteredChaosPlot()}
             plotLayout={scatterLayout}
             sqlCode={chaosMeta?.inspector.sql_logic}
             dbtCode={chaosMeta?.inspector.dbt_logic}
             dbtYml={chaosMeta?.inspector.dbt_yml} 
           />
        </div>

        {/* Risk Radar: 1/4 Width */}
        <div className="span-1 h-tall">
            <InspectorCard 
              title="Risk Radar"
              tag="Alpha"
              desc="Sentiment vs Vol."
              isLoading={sentVolLoading}
              chartType="scatter"
              plotData={getSentimentPlotData()}
              plotLayout={sentimentLayout}
              sqlCode={sentVolMeta?.inspector.sql_logic}
              dbtCode={sentVolMeta?.inspector.dbt_logic}
              dbtYml={sentVolMeta?.inspector.dbt_yml} 
            />
        </div>

        {/* ROW 3: MAG 7 MOMENTUM (Full Width) */}
        <div className="span-4">
           <InspectorCard 
             title="Mag 7 Momentum" 
             tag="Trend"
             desc={magMeta?.inspector.description || "Loading..."}
             isLoading={magLoading}
             chartType="line"
             plotData={getMag7PlotData()}
             plotLayout={lineLayout}
             sqlCode={magMeta?.inspector.sql_logic} 
             dbtCode={magMeta?.inspector.dbt_logic}
             dbtYml={magMeta?.inspector.dbt_yml} 
           />
        </div>

        {/* ROW 4: WHALE HUNTER (Full Width) */}
        <div className="span-4">
           <InspectorCard 
             title={whaleData?.meta.title || "Whale Hunter"}
             tag="Flow"
             desc={whaleData?.meta.inspector.description}
             isLoading={whaleLoading}
             chartType="table"
             tableData={whaleData?.data}
             sqlCode={whaleData?.meta.inspector.sql_logic}
             dbtCode={whaleData?.meta.inspector.dbt_logic}
             dbtYml={whaleData?.meta.inspector.dbt_yml} 
           />
        </div>

      </main>
      <Footer />
    </div>
  );
}

export default App;
