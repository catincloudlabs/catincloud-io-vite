import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { X, TrendingUp, TrendingDown, Activity, Info, Eye, EyeOff, Target, FileText, Database } from 'lucide-react';

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

// --- INSIGHT PANEL ---
const InsightPanel = ({ clusterId, label, insights, onClose, rawArticles }) => {
  const data = insights[clusterId];
  const [viewMode, setViewMode] = useState('narrative'); // 'narrative' | 'sources'

  // Filter and sort the raw articles for this specific cluster
  const sourceArticles = useMemo(() => {
    if (!rawArticles) return [];
    return rawArticles
      .filter(node => node.cluster_id === clusterId)
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  }, [rawArticles, clusterId]);

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

      {/* BODY CONTENT SWITCHER */}
      <div className="dock-body custom-scrollbar">
        
        {viewMode === 'narrative' ? (
          <>
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
          </>
        ) : (
          /* SOURCE DATA TABLE VIEW */
          <div className="dock-section">
             <h4 className="dock-section-title mb-4">
               <Database size={12} className="mr-2" /> Underlying Signals ({sourceArticles.length})
             </h4>
             <div className="overflow-x-auto">
               <table className="dock-table">
                 <thead>
                   <tr>
                     <th>Ticker</th>
                     <th>Headline</th>
                     <th className="text-right">Sent.</th>
                   </tr>
                 </thead>
                 <tbody>
                   {sourceArticles.map((row, i) => (
                     <tr key={i}>
                       <td className="font-mono text-xs text-slate-300">{row.ticker}</td>
                       <td className="max-w-[140px] truncate" title={row.title}>{row.title}</td>
                       <td className={`text-right font-mono ${row.sentiment > 0 ? 'text-green' : 'text-red'}`}>
                         {row.sentiment > 0 ? '+' : ''}{row.sentiment?.toFixed(2)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div className="dock-footer flex justify-between items-center">
         <span className="text-[10px] text-slate-500">Updated: {new Date(data.lastUpdated).toLocaleTimeString()}</span>
         
         <button 
           className="dock-action-btn"
           onClick={() => setViewMode(viewMode === 'narrative' ? 'sources' : 'narrative')}
         >
           {viewMode === 'narrative' ? (
             <> <Database size={12} /> View Sources </>
           ) : (
             <> <FileText size={12} /> View Summary </>
           )}
         </button>
      </div>
    </div>
  );
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  const [chartData, setChartData] = useState([]);
  const [insightData, setInsightData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // --- VIEW STATES ---
  const [showNoise, setShowNoise] = useState(true);
  const [focusMode, setFocusMode] = useState(false); // Semantic Zoom
  const [hoveredLegend, setHoveredLegend] = useState(null); // Legend Interaction

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

  // --- MEMOIZED DATA PROCESSING ---
  const sortedData = useMemo(() => {
    let data = [...chartData];

    // 1. Hide Noise Toggle
    if (!showNoise) {
        data = data.filter(d => d.label !== 'Noise');
    }

    // 2. Semantic Zoom (Focus Mode) - Show only High Sentiment Magnitude (> 0.6)
    if (focusMode) {
        // CHANGED: Using Sentiment Magnitude instead of Impact
        data = data.filter(d => Math.abs(d.sentiment || 0) > 0.6);
    }

    // 3. Sort for Z-Index (Noise back, Impact/Sentiment front)
    return data.sort((a, b) => {
      if (a.label === 'Noise' && b.label !== 'Noise') return -1;
      if (a.label !== 'Noise' && b.label === 'Noise') return 1;
      return 0;
    });
  }, [chartData, showNoise, focusMode]); 

  const handlePointClick = (nodeProps) => {
    const data = nodeProps.payload;
    if (data && data.cluster_id !== undefined && data.label !== 'Noise') {
        setActiveCluster({
            id: data.cluster_id,
            label: data.label
        });
    }
  };

  const chartMargins = isMobile 
    ? { top: 10, right: 10, bottom: 10, left: 10 } 
    : { top: 20, right: 20, bottom: 20, left: 20 };

  // --- LEGEND HANDLERS ---
  const handleLegendEnter = (o) => {
    setHoveredLegend(o.value);
  };
  
  const handleLegendLeave = () => {
    setHoveredLegend(null);
  };

  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Neural Map...</div>
     </div>
  );

  return (
    <div className="map-wrapper">
        
        {/* --- CONTROLS GROUP (Top Left) --- */}
        {/* OPTIONAL SAFETY TWEAK: Hide controls if a cluster is active (Mobile UX) */}
        {(!activeCluster || !isMobile) && (
            <div className="map-controls-group">
                <button 
                    className={`map-control-btn ${!showNoise ? 'active' : ''}`}
                    onClick={() => setShowNoise(!showNoise)}
                    title={showNoise ? "Hide Noise" : "Show Noise"}
                >
                    {showNoise ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span className="control-text desktop-only-text">Noise</span>
                </button>

                <button 
                    className={`map-control-btn ${focusMode ? 'active-focus' : ''}`}
                    onClick={() => setFocusMode(!focusMode)}
                    title="Focus Mode (High Sentiment Magnitude Only)"
                >
                    <Target size={14} />
                    <span className="control-text desktop-only-text">Focus</span>
                </button>
            </div>
        )}

        {/* EMPTY STATE HINT (Top Right) */}
        {!activeCluster && (
           <div className="map-empty-state-hint">
              <span className="hint-text">
                  Click a colored cluster to analyze
              </span>
           </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={chartMargins}>
            <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
            <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#334155' }} />
            
            <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle" 
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '10px', cursor: 'pointer' }}
                onMouseEnter={handleLegendEnter}
                onMouseLeave={handleLegendLeave}
            />
            
            <Scatter 
                name="Clusters" 
                data={sortedData} 
                onClick={(props) => handlePointClick(props)} 
                cursor="pointer"
                fill="#64748b"
            >
              {sortedData.map((entry, index) => {
                  const isNoise = entry.label === 'Noise';
                  const sentMagnitude = Math.abs(entry.sentiment || 0);
                  const isHighMagnitude = !isNoise && sentMagnitude > 0.7; 
                  const radius = isMobile 
                    ? (isNoise ? 3 : Math.min(18, 8 + (sentMagnitude * 10)))
                    : (isNoise ? 2 : Math.min(12, 4 + (sentMagnitude * 8)));

                  // INTERACTIVE LEGEND OPACITY LOGIC
                  let opacity = isNoise ? 0.2 : 0.8;
                  if (hoveredLegend && hoveredLegend !== entry.label) {
                    opacity = 0.1; 
                  } else if (hoveredLegend && hoveredLegend === entry.label) {
                    opacity = 1; // Highlight active group
                  }

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CHART_COLORS[entry.label] || CHART_COLORS['Noise']} 
                      stroke={isHighMagnitude ? CHART_COLORS[entry.label] : 'none'}
                      opacity={opacity}
                      r={radius} 
                      className={isHighMagnitude ? 'node-pulse cursor-pointer' : (isNoise ? 'node-noise' : 'node-standard cursor-pointer')}
                    />
                  );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* DOCKED INSIGHT PANEL (With rawArticles passed down) */}
        {activeCluster && (
            <InsightPanel 
                clusterId={activeCluster.id}
                label={activeCluster.label}
                insights={insightData}
                rawArticles={chartData} 
                onClose={() => setActiveCluster(null)}
            />
        )}
    </div>
  );
}
