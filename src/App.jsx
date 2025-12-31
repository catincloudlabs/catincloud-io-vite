import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';
import { SystemStatusRibbon } from './components/SystemStatusRibbon';
import TimeSlider from './components/TimeSlider';
import { Activity, Zap, Server, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useSystemHeartbeat } from './hooks/useSystemHeartbeat';
import { getHealthColor, getSentimentColor, getRiskColor, getMomentumColor } from './utils/statusHelpers';

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

function App() {
  
  // --- STATE ---
  const { data: heartbeat } = useSystemHeartbeat();

  const [chaosRaw, setChaosRaw] = useState([]); 
  const [chaosMeta, setChaosMeta] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedChaosTicker, setSelectedChaosTicker] = useState('GME'); 
  const [chaosLoading, setChaosLoading] = useState(true);

  const [whaleData, setWhaleData] = useState(null);
  const [whaleLoading, setWhaleLoading] = useState(true);

  const [magRaw, setMagRaw] = useState([]); 
  const [magMeta, setMagMeta] = useState(null);
  const [magLoading, setMagLoading] = useState(true);
  const [visibleTickers, setVisibleTickers] = useState(['NVDA', 'TSLA', 'AAPL']);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FETCHING ---
  useEffect(() => {
    fetch('/data/chaos.json')
      .then(res => res.json())
      .then(json => {
        setChaosRaw(json.data); 
        setChaosMeta(json.meta);
        if (json.meta.available_dates?.length > 0) {
           setSelectedDate(json.meta.available_dates[json.meta.available_dates.length - 1]);
        }
        setChaosLoading(false);
      })
      .catch(err => { console.error("Chaos Error:", err); setChaosLoading(false); });

    fetch('/data/whales.json')
      .then(res => res.json())
      .then(json => { setWhaleData(json); setWhaleLoading(false); })
      .catch(err => { console.error("Whale Error:", err); setWhaleLoading(false); });

    fetch('/data/mag7.json')
      .then(res => res.json())
      .then(json => {
        setMagRaw(json.data);
        setMagMeta(json.meta);
        setMagLoading(false);
      })
      .catch(err => { console.error("Mag 7 Error:", err); setMagLoading(false); });

  }, []);

  // --- SMART METRICS ---

  // 1. Whale Sentiment (Dynamic Label Update with $B formatting)
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
    
    // Auto-format Billions vs Millions
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

  // 2. Max Chaos
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

  // 3. Mag 7 Leader
  const magLeaderMetric = useMemo(() => {
    if (!magRaw.length) return { value: "--", sub: "Flat" };

    const dates = [...new Set(magRaw.map(d => d.trade_date))].sort();
    const latestDate = dates[dates.length - 1];
    
    const todayStats = magRaw.filter(d => d.trade_date === latestDate);
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
  }, [magRaw]);

  // --- CHART LOGIC ---
  const getMag7PlotData = () => {
    if (!magRaw || magRaw.length === 0) return [];
    return visibleTickers.map(ticker => {
      const tickerData = magRaw.filter(d => d.ticker === ticker);
      const config = MAG7_CONFIG[ticker] || { color: '#ccc' };
      return {
        x: tickerData.map(d => d.trade_date),
        y: tickerData.map(d => d.net_sentiment_flow),
        name: ticker,
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: config.color, width: 2 },
        marker: { size: 4 }
      };
    });
  };

  const availableChaosTickers = useMemo(() => {
    if (!chaosRaw.length) return ['GME'];
    const tickers = [...new Set(chaosRaw.map(d => d.ticker))];
    return tickers.sort(); 
  }, [chaosRaw]);

  const getFilteredChaosPlot = () => {
    if (!selectedDate || chaosRaw.length === 0) return [];
    
    const dailyData = chaosRaw.filter(d => 
      d.trade_date?.startsWith(selectedDate) && 
      d.ticker === selectedChaosTicker
    );

    return [{
       x: dailyData.map(d => d.dte),
       y: dailyData.map(d => d.moneyness),
       text: dailyData.map(d => d.contract),
       mode: 'markers',
       type: 'scatter',
       marker: {
         size: dailyData.map(d => Math.log(d.volume) * 4),
         color: dailyData.map(d => d.iv),
         colorscale: 'Viridis',
         showscale: !isMobile, 
         opacity: 0.8
       }
    }];
  };

  const toggleTicker = (ticker) => {
    setVisibleTickers(prev => {
      if (prev.includes(ticker)) {
        if (prev.length === 1) return prev; 
        return prev.filter(t => t !== ticker);
      } else {
        return [...prev, ticker];
      }
    });
  };

  const scatterLayout = {
    xaxis: { title: 'DTE', gridcolor: '#334155', zerolinecolor: '#334155' },
    yaxis: { title: 'Moneyness', gridcolor: '#334155', zerolinecolor: '#334155', range: [0.5, 2.0] },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)', 
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    margin: isMobile ? { t: 0, b: 40, l: 30, r: 0 } : { t: 0, b: 40, l: 40, r: 20 }
  };

  const lineLayout = {
    xaxis: { title: 'Date', gridcolor: '#334155' },
    yaxis: { title: 'Net Sentiment Flow', gridcolor: '#334155', zerolinecolor: '#334155' },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    margin: isMobile ? { t: 10, b: 40, l: 30, r: 5 } : { t: 10, b: 40, l: 40, r: 10 }
  };

  return (
    <div className="app-container">
      <SystemStatusRibbon />
      <Header />
      
      <main className="bento-grid">
        
        {/* ROW 1: KPI CARDS */}
        <MetricCard 
          title="Pipeline State" 
          value={heartbeat?.system_status || "OFFLINE"} 
          subValue={heartbeat ? `${(heartbeat.metrics.total_rows_managed / 1000000).toFixed(1)}M Rows` : "Connecting..."} 
          icon={<Server size={16} className={getHealthColor(heartbeat?.system_status)} />} 
          statusColor={heartbeat?.system_status === 'Healthy' ? 'green' : 'red'}
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

        {/* ROW 2: CHAOS (Full Width, Taller) */}
        <div className="span-4 h-tall">
           <InspectorCard 
             title={chaosMeta?.title || "Chaos Engine"} 
             tag="Risk"
             desc={chaosMeta?.inspector.description}
             isLoading={chaosLoading}
             chartType="scatter"
             plotData={getFilteredChaosPlot()}
             plotLayout={scatterLayout}
             sqlCode={chaosMeta?.inspector.sql_logic}
             dbtCode={chaosMeta?.inspector.dbt_logic}
             dbtYml={chaosMeta?.inspector.dbt_yml} 
           >
             <div className="chaos-controls-container">
               <div className="pill-group">
                 {availableChaosTickers.map(ticker => (
                   <button
                     key={ticker}
                     onClick={() => setSelectedChaosTicker(ticker)}
                     className={`ticker-pill ${selectedChaosTicker === ticker ? 'active-chaos' : ''}`}
                   >
                     {ticker}
                   </button>
                 ))}
               </div>
               {!chaosLoading && chaosMeta?.available_dates && (
                  <div className="time-slider-wrapper"> 
                    <TimeSlider 
                      dates={chaosMeta.available_dates}
                      selectedDate={selectedDate}
                      onChange={setSelectedDate}
                    />
                  </div>
               )}
             </div>
           </InspectorCard>
        </div>

        {/* ROW 3 LEFT: MAG 7 (Half Width) */}
        <div className="span-2">
           <InspectorCard 
             title={magMeta?.title || "Mag 7 Momentum"} 
             tag="Trend"
             desc={magMeta?.inspector.description || "Loading..."}
             isLoading={magLoading}
             chartType="line"
             plotData={getMag7PlotData()}
             plotLayout={lineLayout}
             sqlCode={magMeta?.inspector.sql_logic} 
             dbtCode={magMeta?.inspector.dbt_logic}
             dbtYml={magMeta?.inspector.dbt_yml} 
           >
             <div className="ticker-controls-container">
               {Object.keys(MAG7_CONFIG).map(ticker => (
                 <button
                   key={ticker}
                   onClick={() => toggleTicker(ticker)}
                   className={`ticker-pill ticker-${ticker} ${visibleTickers.includes(ticker) ? 'active' : ''}`}
                 >
                   {ticker}
                 </button>
               ))}
             </div>
           </InspectorCard>
        </div>

        {/* ROW 3 RIGHT: WHALES (Half Width) */}
        <div className="span-2">
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
