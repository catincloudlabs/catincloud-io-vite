import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Legend } from 'recharts';
import { X, TrendingUp, TrendingDown, Activity, Info, Eye, EyeOff, Target, FileText, Database } from 'lucide-react';

const CHART_COLORS = {
  'Justified Optimism': '#4ade80',
  'Bull Trap': '#f87171',
  'Justified Fear': '#ef4444',
  'Bear Trap': '#60a5fa',
  'Noise': '#334155'
};

// --- INSIGHT PANEL ---
const InsightPanel = ({ clusterId, label, insights, onClose, rawArticles, isLocked }) => {
  const data = insights[clusterId];
  const [viewMode, setViewMode] = useState('narrative'); // 'narrative' | 'sources'

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
      <div className="dock-header">
         <div className="dock-title-group">
            <div className="dock-indicator" />
            <div>
              <h3 className="dock-title">{label}</h3>
              <p className="dock-subtitle">
                {isLocked ? 'Analysis Locked' : 'Previewing Cluster'} • ID: {clusterId}
              </p>
            </div>
         </div>
         {/* Only show Close button if locked (clicked) */}
         {isLocked && (
             <button onClick={onClose} className="dock-close-btn">
               <X size={18} />
             </button>
         )}
      </div>

      <div className="dock-body custom-scrollbar">
        {viewMode === 'narrative' ? (
          <>
            <div className="dock-sentiment-box">
               {data.sentiment === 'Bullish' && <TrendingUp size={16} className="text-green" />}
               {data.sentiment === 'Bearish' && <TrendingDown size={16} className="text-red" />}
               {data.sentiment === 'Neutral' && <Activity size={16} className="text-muted" />}
               <span className="dock-sentiment-text">{data.sentiment} Sentiment</span>
            </div>
            <div className="dock-section">
              <h4 className="dock-section-title">
                <Info size={12} className="mr-2" /> Narrative Analysis
              </h4>
              <p className="dock-text">{data.summary}</p>
            </div>
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
  const [focusMode, setFocusMode] = useState(false);
  const [hoveredLegend, setHoveredLegend] = useState(null);
  
  // --- INTERACTION STATES ---
  const [lockedCluster, setLockedCluster] = useState(null);  // Clicked (Persistent)
  const [hoveredCluster, setHoveredCluster] = useState(null); // Hovered (Ephemeral)
  
  // --- MOBILE RESET LOGIC ---
  const [chartResetKey, setChartResetKey] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(true);

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

  const sortedData = useMemo(() => {
    let data = [...chartData];
    if (!showNoise) data = data.filter(d => d.label !== 'Noise');
    if (focusMode) data = data.filter(d => Math.abs(d.sentiment || 0) > 0.6);

    return data.sort((a, b) => {
      if (a.label === 'Noise' && b.label !== 'Noise') return -1;
      if (a.label !== 'Noise' && b.label === 'Noise') return 1;
      return 0;
    });
  }, [chartData, showNoise, focusMode]); 

  // --- HANDLERS ---

  // 1. Mouse Enter (Desktop Hover)
  const handleNodeMouseEnter = (nodeProps) => {
    if (isMobile) return; // Disable hover logic on mobile
    const data = nodeProps.payload;
    if (data && data.cluster_id !== undefined && data.label !== 'Noise') {
        setHoveredCluster({ id: data.cluster_id, label: data.label });
    }
  };

  // 2. Mouse Leave (Desktop Hover)
  const handleNodeMouseLeave = () => {
    if (isMobile) return;
    setHoveredCluster(null);
  };

  // 3. Click (Lock selection)
  const handleNodeClick = (nodeProps) => {
    const data = nodeProps.payload;
    if (data && data.cluster_id !== undefined && data.label !== 'Noise') {
        setLockedCluster({
            id: data.cluster_id,
            label: data.label
        });
    }
  };

  const handlePanelClose = () => {
    setLockedCluster(null);
    setHoveredCluster(null);
    setShouldAnimate(false);
    setChartResetKey(prev => prev + 1);
  };

  const chartMargins = isMobile 
    ? { top: 10, right: 10, bottom: 60, left: 10 } 
    : { top: 20, right: 20, bottom: 20, left: 20 };

  const handleLegendEnter = (o) => setHoveredLegend(o.value);
  const handleLegendLeave = () => setHoveredLegend(null);

  // Determine what to show: Locked takes precedence over Hovered
  const activeDisplayCluster = lockedCluster || hoveredCluster;

  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Neural Map...</div>
     </div>
  );

  return (
    <div className="map-wrapper">
        
        {(!activeDisplayCluster || !isMobile) && (
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

        {!activeDisplayCluster && (
           <div className="map-empty-state-hint">
              <span className="hint-text">
                  {isMobile ? 'Tap a cluster to analyze' : 'Hover to preview, click to lock'}
              </span>
           </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart key={chartResetKey} margin={chartMargins}>
            <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
            <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
            
            {/* TOOLTIP REMOVED ENTIRELY */}
            
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
                onClick={(props) => handleNodeClick(props)} 
                onMouseEnter={(props) => handleNodeMouseEnter(props)}
                onMouseLeave={handleNodeMouseLeave}
                cursor="pointer"
                fill="#64748b"
                isAnimationActive={shouldAnimate}
            >
              {sortedData.map((entry, index) => {
                  const isNoise = entry.label === 'Noise';
                  const sentMagnitude = Math.abs(entry.sentiment || 0);
                  const isHighMagnitude = !isNoise && sentMagnitude > 0.7; 
                  
                  // Increased base size to 10 and multiplier to 15 for mobile
                  const radius = isMobile 
                    ? (isNoise ? 4 : Math.min(24, 10 + (sentMagnitude * 15)))
                    : (isNoise ? 2 : Math.min(12, 4 + (sentMagnitude * 8)));

                  let opacity = isNoise ? 0.2 : 0.8;
                  
                  // Priority: Hovered Legend > Active Panel > Default
                  if (hoveredLegend) {
                      opacity = (hoveredLegend === entry.label) ? 1 : 0.1;
                  } else if (activeDisplayCluster) {
                      // If panel is open/hovered, dim everything else
                      opacity = (activeDisplayCluster.id === entry.cluster_id) ? 1 : 0.1;
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

        {activeDisplayCluster && (
            <InsightPanel 
                clusterId={activeDisplayCluster.id}
                label={activeDisplayCluster.label}
                insights={insightData}
                rawArticles={chartData} 
                onClose={handlePanelClose} 
                isLocked={!!lockedCluster} // Pass lock state to toggle "X" button
            />
        )}
    </div>
  );
}
