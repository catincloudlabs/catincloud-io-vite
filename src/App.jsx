import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';
import { SystemStatusRibbon } from './components/SystemStatusRibbon';
import TimeSlider from './components/TimeSlider';
import { Activity, Zap, Radio, Server } from 'lucide-react';

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
  const [visibleTickers, setVisibleTickers] = useState(['NVDA', 'TSLA']);

  // NEW: Detect Mobile Screen Width for Layout Calculations
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- FETCHING ---
  useEffect(() => {
    
    // 1. Chaos Scatter
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

    // 2. Whale Table
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

  }, []);

  // --- HELPERS ---

  // 1. Dynamic Mag 7 Plot
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

  // 2. Helper: Get Unique Tickers from Chaos Data
  const availableChaosTickers = useMemo(() => {
    if (!chaosRaw.length) return ['GME'];
    const tickers = [...new Set(chaosRaw.map(d => d.ticker))];
    return tickers.sort(); 
  }, [chaosRaw]);

  // 3. Chaos Plot Generator (Updated for Mobile)
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
         // IMPORTANT: Disable the color bar on mobile to save width
         showscale: !isMobile, 
         opacity: 0.8
       }
    }];
  };

  // --- TOGGLE HANDLER (Mag 7 - Multi Select) ---
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

  // --- LAYOUTS ---
  
  // UPDATED: Tight margins for Mobile to maximize width
  const scatterLayout = {
    xaxis: { title: 'DTE', gridcolor: '#334155', zerolinecolor: '#334155' },
    yaxis: { title: 'Moneyness', gridcolor: '#334155', zerolinecolor: '#334155', range: [0.5, 2.0] },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)', 
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    // Logic: If mobile, 0 right margin (no legend). If Desktop, 20 right margin.
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
        <MetricCard title="Pipeline State" value="ONLINE" subValue="Latency: 42ms" icon={<Server size={16} className="text-green" />} statusColor="green"/>
        <MetricCard title="Chaos Index" value="8.2σ" subValue="GME Volatility Spike" icon={<Zap size={16} className="text-yellow" />}/>
        <MetricCard title="Whale Flow" value="$142M" subValue="Premium Traded (1h)" icon={<Activity size={16} className="text-accent" />}/>
        <MetricCard title="Last Build" value="16:05" subValue="2025-12-28" icon={<Radio size={16} className="text-muted" />}/>

        {/* ROW 2: MAG 7 (WITH TOGGLES) */}
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
           >
             <div className="ticker-controls-container">
               {Object.keys(MAG7_CONFIG).map(ticker => (
                 <button
                   key={ticker}
                   onClick={() => toggleTicker(ticker)}
                   className={`ticker-pill ${visibleTickers.includes(ticker) ? 'active' : ''}`}
                   style={{ '--pill-color': MAG7_CONFIG[ticker].color }}
                 >
                   {ticker}
                 </button>
               ))}
             </div>
           </InspectorCard>
        </div>

        {/* ROW 2: CHAOS (WITH PILLS & TIME TRAVEL) */}
        <div className="span-2">
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
           >
             {/* FOOTER CONTROLS */}
             <div className="chaos-controls-container">
               
               {/* 1. PILL SELECTOR (Vertical) */}
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

               {/* 2. TIME SLIDER (Flex Grow to fill remaining space) */}
               {!chaosLoading && chaosMeta?.available_dates && (
                  <div style={{ flex: 1 }}> 
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

        {/* ROW 3: WHALES */}
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
           />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
