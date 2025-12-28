import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';

// Icons
import { Activity, Zap, Radio, Server } from 'lucide-react';

function App() {
  
  // --- STATE MANAGEMENT ---
  const [chaosData, setChaosData] = useState(null);
  const [chaosLoading, setChaosLoading] = useState(true);

  const [whaleData, setWhaleData] = useState(null);
  const [whaleLoading, setWhaleLoading] = useState(true);

  // --- DATA FETCHING ---
  useEffect(() => {
    
    // 1. Fetch Chaos Scatter Data
    fetch('/data/chaos.json')
      .then(res => res.json())
      .then(json => {
        const raw = json.data;
        const plotTrace = {
          x: raw.map(d => d.dte),          // X: Days to Expiration
          y: raw.map(d => d.moneyness),    // Y: Greed (Strike/Spot)
          text: raw.map(d => d.contract),  // Hover Text
          mode: 'markers',
          type: 'scatter',
          marker: {
            size: raw.map(d => Math.log(d.volume) * 4), // Log scale for bubbles
            color: raw.map(d => d.iv),     // Color by Volatility
            colorscale: 'Viridis',
            showscale: true,
            opacity: 0.8
          }
        };
        setChaosData({ plot: [plotTrace], meta: json.meta });
        setChaosLoading(false);
      })
      .catch(err => console.error("Chaos Artifact Missing:", err));

    // 2. Fetch Whale Table Data
    fetch('/data/whales.json')
      .then(res => res.json())
      .then(json => {
        setWhaleData(json);
        setWhaleLoading(false);
      })
      .catch(err => console.error("Whale Artifact Missing:", err));

  }, []);

  // --- SHARED LAYOUTS ---
  const darkLayout = {
    xaxis: { 
      title: 'Days to Expiration (DTE)', 
      gridcolor: '#334155',
      zerolinecolor: '#334155'
    },
    yaxis: { 
      title: 'Moneyness (Strike / Spot)', 
      gridcolor: '#334155',
      zerolinecolor: '#334155',
      range: [0.5, 2.0] 
    },
    showlegend: false
  };

  return (
    <div className="app-container">
      <Header />
      
      <main className="bento-grid">
        
        {/* ROW 1: LIVE METRICS */}
        <MetricCard 
          title="Pipeline State" 
          value="ONLINE" 
          subValue="Latency: 42ms" 
          icon={<Server size={16} className="text-green" />}
          statusColor="green"
        />
        <MetricCard 
          title="Chaos Index" 
          value="8.2σ" 
          subValue="GME Volatility Spike" 
          icon={<Zap size={16} className="text-yellow" />}
        />
        <MetricCard 
          title="Whale Flow" 
          value="$142M" 
          subValue="Premium Traded (1h)" 
          icon={<Activity size={16} className="text-accent" />}
        />
        <MetricCard 
          title="Last Build" 
          value="16:05" 
          subValue="2025-12-28" 
          icon={<Radio size={16} className="text-muted" />}
        />

        {/* ROW 2: MAG 7 (Placeholder for now) */}
        <div className="span-2">
           <InspectorCard 
              title="Mag 7 Momentum" 
              tag="Trend"
              desc="Bullish/Bearish Flow Signals vs Price Action."
              isLoading={true} // Loading state until we build this JSON
              chartType="line" 
           />
        </div>

        {/* ROW 2: CHAOS SCATTER (Live) */}
        <div className="span-2">
           <InspectorCard 
              title={chaosData?.meta.title || "Chaos Engine"} 
              tag={chaosData?.meta.inspector.tag || "Risk"}
              desc={chaosData?.meta.inspector.description || "Loading..."}
              isLoading={chaosLoading}
              
              chartType="scatter"
              plotData={chaosData?.plot}
              plotLayout={darkLayout}
              
              sqlCode={chaosData?.meta.inspector.sql_logic}
           />
        </div>

        {/* ROW 3: WHALE HUNTER (Live Table) */}
        <div className="span-4">
           <InspectorCard 
              title={whaleData?.meta.title || "Whale Hunter"}
              tag="Flow"
              desc={whaleData?.meta.inspector.description || "Loading..."}
              isLoading={whaleLoading}
              
              chartType="table"
              tableData={whaleData?.data}
              
              sqlCode={whaleData?.meta.inspector.sql_logic}
           />
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default App;
