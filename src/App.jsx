import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';

// Icons
import { Activity, Zap, Radio, Server } from 'lucide-react';

function App() {
  // We will load data here later. For now, static props.
  return (
    <div className="app-container">
      <Header />
      
      <main className="bento-grid">
        {/* TOP ROW: Live Metrics (Replaces "Market Regime", "Top Alpha" etc) */}
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

        {/* ROW 2: The Core Charts (Wrapped in Inspector Mode) */}
        
        {/* 1. Mag 7 Momentum */}
        <div className="span-2">
           <InspectorCard 
              title="Mag 7 Momentum" 
              tag="Trend"
              desc="Bullish/Bearish Flow Signals vs Price Action."
              // We will pass the mock data and SQL here in the next step
              chartType="line" 
           />
        </div>

        {/* 2. Chaos Scatter (Replacing VRP) */}
        <div className="span-2">
           <InspectorCard 
              title="Chaos Engine" 
              tag="Risk"
              desc="Gamma Exposure vs Moneyness. Bubble size = Volume."
              chartType="scatter"
           />
        </div>

        {/* ROW 3: Whale Table (Replacing Pairs Trading) */}
        <div className="span-4">
           <InspectorCard 
              title="Whale Hunter" 
              tag="Flow"
              desc="Top 25 Options Contracts by Premium Traded."
              chartType="table"
           />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
