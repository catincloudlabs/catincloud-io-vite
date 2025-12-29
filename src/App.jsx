import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MetricCard from './components/MetricCard';
import InspectorCard from './components/InspectorCard';
import { SystemStatusRibbon } from './components/SystemStatusRibbon';
import TimeSlider from './components/TimeSlider';
import { Activity, Zap, Radio, Server } from 'lucide-react';

function App() {
  
  // --- STATE ---
  const [chaosRaw, setChaosRaw] = useState([]); 
  const [chaosMeta, setChaosMeta] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [chaosLoading, setChaosLoading] = useState(true);

  const [whaleData, setWhaleData] = useState(null);
  const [whaleLoading, setWhaleLoading] = useState(true);

  const [magData, setMagData] = useState(null);
  const [magLoading, setMagLoading] = useState(true);

  // --- FETCHING ---
  useEffect(() => {
    
    // 1. Chaos Scatter
    fetch('/data/chaos.json')
      .then(res => res.json())
      .then(json => {
        setChaosRaw(json.data); 
        setChaosMeta(json.meta);
        
        if (json.meta.available_dates && json.meta.available_dates.length > 0) {
           const latest = json.meta.available_dates[json.meta.available_dates.length - 1];
           setSelectedDate(latest);
        }
        setChaosLoading(false);
      })
      .catch(err => {
        console.error("Chaos Data Fetch Error:", err);
        setChaosLoading(false);
      });

    // 2. Whale Table
    fetch('/data/whales.json')
      .then(res => res.json())
      .then(json => {
        setWhaleData(json);
        setWhaleLoading(false);
      })
      .catch(err => {
         console.error("Whale Data Fetch Error:", err);
         setWhaleLoading(false);
      });

    // 3. Mag 7 Momentum
    fetch('/data/mag7.json')
      .then(res => res.json())
      .then(json => {
        const raw = json.data;
        const nvda = raw.filter(d => d.ticker === 'NVDA');
        const tsla = raw.filter(d => d.ticker === 'TSLA');

        const traces = [
          {
            x: nvda.map(d => d.trade_date),
            y: nvda.map(d => d.net_sentiment_flow), 
            name: 'NVDA',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#22c55e', width: 2 } 
          },
          {
            x: tsla.map(d => d.trade_date),
            y: tsla.map(d => d.net_sentiment_flow), 
            name: 'TSLA',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#ef4444', width: 2 } 
          }
        ];

        setMagData({ plot: traces, meta: json.meta });
        setMagLoading(false);
      })
      .catch(err => {
         console.error("Mag 7 Fetch Error:", err);
         setMagLoading(false);
      });

  }, []);

  // --- HELPERS ---
  const getFilteredChaosPlot = () => {
    if (!selectedDate || chaosRaw.length === 0) return [];

    const dailyData = chaosRaw.filter(d => d.trade_date && d.trade_date.startsWith(selectedDate));

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
         showscale: true,
         opacity: 0.8
       }
    }];
  };

  // --- LAYOUTS ---
  const scatterLayout = {
    xaxis: { title: 'DTE', gridcolor: '#334155', zerolinecolor: '#334155' },
    yaxis: { title: 'Moneyness', gridcolor: '#334155', zerolinecolor: '#334155', range: [0.5, 2.0] },
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)', 
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' },
    margin: { t: 0, b: 40, l: 40, r: 20 } 
  };

  const lineLayout = {
    xaxis: { title: 'Date', gridcolor: '#334155' },
    yaxis: { title: 'Net Sentiment Flow', gridcolor: '#334155', zerolinecolor: '#334155' },
    showlegend: true,
    legend: { x: 0, y: 1, font: { color: '#94a3b8' } },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { color: '#94a3b8' }
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

        {/* ROW 2: MAG 7 */}
        <div className="span-2">
           {/* Added chart-box class to ensure full height fill */}
           <div className="chart-box">
             <InspectorCard 
                title={magData?.meta.title || "Mag 7 Momentum"} 
                tag="Trend"
                desc={magData?.meta.inspector.description || "Loading..."}
                isLoading={magLoading}
                chartType="line"
                plotData={magData?.plot}
                plotLayout={lineLayout}
                sqlCode={magData?.meta.inspector.sql_logic} 
             />
           </div>
        </div>

        {/* ROW 2: CHAOS (WITH TIME TRAVEL) */}
        <div className="span-2">
           {/* Chart Container: Uses existing CSS class to fill available space */}
           <div className="chart-box">
             <InspectorCard 
                title={chaosMeta?.title || "Chaos Engine"} 
                tag="Risk"
                desc={chaosMeta?.inspector.description}
                isLoading={chaosLoading}
                chartType="scatter"
                plotData={getFilteredChaosPlot()}
                plotLayout={scatterLayout}
                sqlCode={chaosMeta?.inspector.sql_logic}
             />
           </div>

           {/* Slider: Automatically stacks at bottom via Flexbox in CSS */}
           {!chaosLoading && chaosMeta?.available_dates && (
              <TimeSlider 
                dates={chaosMeta.available_dates}
                selectedDate={selectedDate}
                onChange={setSelectedDate}
              />
           )}
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
           />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;
