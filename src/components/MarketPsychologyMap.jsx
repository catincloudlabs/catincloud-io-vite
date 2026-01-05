import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { X, TrendingUp, TrendingDown, Activity, Info, Maximize2 } from 'lucide-react';

const CHART_COLORS = {
  'Justified Optimism': '#4ade80',
  'Bull Trap': '#f87171',
  'Justified Fear': '#ef4444',
  'Bear Trap': '#60a5fa',
  'Noise': '#334155'
};

// --- TOOLTIP COMPONENT ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.sentiment > 0;
    const themeColor = CHART_COLORS[data.label] || '#94a3b8';
    
    // We pass the dynamic color as a CSS variable
    return (
      <div className="custom-tooltip map-tooltip" style={{ '--tooltip-accent': themeColor }}>
        <div className="tooltip-header">
            <span className="tooltip-ticker">{data.ticker}</span>
            <span className="tooltip-date">{new Date(data.published_at).toLocaleDateString()}</span>
        </div>
        <div className="tooltip-title">"{data.title}"</div>
        <div className="tooltip-footer">
            <span className="tooltip-pill">{data.label}</span>
            <span className={isPositive ? "text-green" : "text-red"}>
              Sent: {data.sentiment?.toFixed(2)}
            </span>
        </div>
      </div>
    );
  }
  return null;
};

// --- INSIGHT PANEL (DOCKED) ---
const InsightPanel = ({ clusterId, label, insights, onClose }) => {
  const data = insights[clusterId];
  if (!data) return null;

  const themeColor = CHART_COLORS[label] || '#94a3b8';

  return (
    <div className="insight-panel-dock" style={{ '--panel-accent': themeColor }}>
      
      {/* HEADER */}
      <div className="dock-header">
         <div className="dock-title-group">
            <div className="dock-indicator" />
            <div>
              <h3 className="dock-title">{label}</h3>
              <p className="dock-subtitle">Cluster ID: {clusterId}</p>
            </div>
         </div>
         <button onClick={onClose} className="dock-close-btn">
           <X size={18} />
         </button>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="dock-body custom-scrollbar">
          
          {/* SENTIMENT BADGE */}
          <div className="dock-sentiment-box">
             {data.sentiment === 'Bullish' && <TrendingUp size={16} className="text-green" />}
             {data.sentiment === 'Bearish' && <TrendingDown size={16} className="text-red" />}
             {data.sentiment === 'Neutral' && <Activity size={16} className="text-muted" />}
             <span className="dock-sentiment-text">{data.sentiment} Sentiment</span>
          </div>

          {/* AI SUMMARY */}
          <div className="dock-section">
            <h4 className="dock-section-title">
              <Info size={12} className="mr-2" /> Narrative Analysis
            </h4>
            <p className="dock-text">
              {data.summary}
            </p>
          </div>

          {/* KEY TAKEAWAYS */}
          {data.takeaways && data.takeaways.length > 0 && (
            <div className="dock-section">
              <h4 className="dock-section-title">Key Events</h4>
              <ul className="dock-list">
                {data.takeaways.map((item, i) => (
                   <li key={i} className="dock-list-item">
                      <span className="dock-bullet" />
                      {item}
                   </li>
                ))}
              </ul>
            </div>
          )}
      </div>

      {/* FOOTER */}
      <div className="dock-footer">
         AI Analysis Updated: {new Date(data.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default function MarketPsychologyMap({ onMetaLoaded }) {
  const [chartData, setChartData] = useState([]);
  const [insightData, setInsightData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Store only the ID and Label of the active cluster
  const [activeCluster, setActiveCluster] = useState(null); 

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [mapRes, feedRes] = await Promise.all([
                fetch('/data/market_psychology_map.json'),
                fetch('/data/market_cluster_feed.json')
            ]);
            const mapJson = await mapRes.json();
            const feedJson = feedRes.ok ? await feedRes.json() : { data: [] };

            setChartData(mapJson.data || []);
            setInsightData(feedJson.data.reduce((acc, item) => ({ ...acc, [item.id]: item }), {}));

            if (onMetaLoaded && mapJson.meta) {
                onMetaLoaded({
                    ...mapJson.meta,
                    inspector: {
                        ...mapJson.meta.inspector,
                        description: `${mapJson.meta.inspector.description}\n\n[RAG ENRICHMENT]: Analyzed by OpenAI Embeddings.`
                    }
                });
            }
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    };
    fetchData();
  }, [onMetaLoaded]);

  // --- MEMOIZED SORTING ---
  // 1. Sort "Noise" to the beginning so they render first (background).
  // 2. Sort high impact items to end so they render on top.
  const sortedData = useMemo(() => {
    return [...chartData].sort((a, b) => {
      // If A is Noise and B is not, A comes first (return -1)
      if (a.label === 'Noise' && b.label !== 'Noise') return -1;
      if (a.label !== 'Noise' && b.label === 'Noise') return 1;
      return 0;
    });
  }, [chartData]);

  const handlePointClick = (nodeProps) => {
    const data = nodeProps.payload;
    // Don't open insights for 'Noise' points
    if (data && data.cluster_id !== undefined && data.label !== 'Noise') {
        setActiveCluster({
            id: data.cluster_id,
            label: data.label
        });
    }
  };

  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Neural Map...</div>
     </div>
  );

  return (
    <div className="map-wrapper">
        
        {/* EMPTY STATE HINT */}
        {!activeCluster && (
           <div className="map-empty-state-hint">
              <span className="hint-text">
                 <Maximize2 size={10} /> Click a colored cluster to analyze
              </span>
           </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* Hide Axes for clean "Map" look */}
            <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
            <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
            
            <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px' }} 
            />
            
            <Scatter 
                name="Clusters" 
                data={sortedData} 
                onClick={(props) => handlePointClick(props)} 
                cursor="pointer"
                fill="#64748b" /* Slate-500 for visible legend icon */
            >
              {sortedData.map((entry, index) => {
                 const isNoise = entry.label === 'Noise';
                 // Threshold for pulsing: Impact > 0.7
                 const isHighImpact = !isNoise && Math.abs(entry.impact || 0) > 0.7; 
                 
                 return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[entry.label] || CHART_COLORS['Noise']} 
                      stroke={isHighImpact ? CHART_COLORS[entry.label] : 'none'}
                      opacity={isNoise ? 0.2 : 0.8}
                      // Scaled sizing logic
                      r={isNoise ? 2 : Math.min(12, 4 + (Math.abs(entry.impact || 0) * 8))} 
                      className={isHighImpact ? 'node-pulse cursor-pointer' : (isNoise ? 'node-noise' : 'node-standard cursor-pointer')}
                    />
                 );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* DOCKED INSIGHT PANEL */}
        {activeCluster && (
            <InsightPanel 
                clusterId={activeCluster.id}
                label={activeCluster.label}
                insights={insightData}
                onClose={() => setActiveCluster(null)}
            />
        )}
    </div>
  );
}
