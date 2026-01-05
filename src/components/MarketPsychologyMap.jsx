import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { X, TrendingUp, TrendingDown, Activity, Info } from 'lucide-react';

const COLORS = {
  'Justified Optimism': '#4ade80',
  'Bull Trap': '#f87171',
  'Justified Fear': '#ef4444',
  'Bear Trap': '#60a5fa',
  'Noise': '#334155'
};

const SENTIMENT_COLORS = {
  'Bullish': '#4ade80', // Green
  'Bearish': '#ef4444', // Red
  'Neutral': '#94a3b8'  // Slate
};

// --- TOOLTIP COMPONENT (Hover State) ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const sentimentClass = data.sentiment > 0 ? "text-green" : "text-red";
    
    return (
      <div className="custom-tooltip">
        <div className="tooltip-header">
            <span className="tooltip-ticker">{data.ticker}</span>
            <span className="tooltip-date">
              {new Date(data.published_at).toLocaleDateString()}
            </span>
        </div>
        <p className="tooltip-title">"{data.title}"</p>
        <div className="tooltip-footer">
            <span className="tooltip-label" style={{ color: COLORS[data.label] || '#fff' }}>
                {data.label}
            </span>
            <span className={sentimentClass}>
                Sent: {data.sentiment?.toFixed(2)}
            </span>
        </div>
        <div className="tooltip-instruction">Click cluster for AI Insights</div>
      </div>
    );
  }
  return null;
};

// --- INSIGHT PANEL COMPONENT (Click State) ---
const InsightPanel = ({ clusterId, label, insights, onClose }) => {
  const data = insights[clusterId];

  // Fallback if we clicked a point but have no RAG data for it yet
  if (!data) return null;

  const sentimentColor = SENTIMENT_COLORS[data.sentiment] || '#94a3b8';

  return (
    <div className="insight-panel-overlay">
      <div className="insight-panel">
        <div className="insight-header">
            <div className="insight-title-group">
                <span className="insight-label" style={{ color: COLORS[label] || '#fff', borderColor: COLORS[label] || '#fff' }}>
                    {label}
                </span>
                <span className="insight-id">Cluster #{clusterId}</span>
            </div>
            <button onClick={onClose} className="close-btn"><X size={18} /></button>
        </div>

        <div className="insight-body custom-scrollbar">
            {/* Sentiment Badge */}
            <div className="sentiment-badge" style={{ backgroundColor: `${sentimentColor}20`, color: sentimentColor, borderColor: `${sentimentColor}40` }}>
                {data.sentiment === 'Bullish' && <TrendingUp size={14} />}
                {data.sentiment === 'Bearish' && <TrendingDown size={14} />}
                {data.sentiment === 'Neutral' && <Activity size={14} />}
                <span className="ml-2 font-bold uppercase">{data.sentiment} Sentiment</span>
            </div>

            {/* Executive Summary */}
            <div className="insight-section">
                <h4 className="section-title"><Info size={14} className="mr-2" /> Market Narrative</h4>
                <p className="insight-text">{data.summary}</p>
            </div>

            {/* Key Takeaways */}
            {data.takeaways && data.takeaways.length > 0 && (
                <div className="insight-section">
                    <h4 className="section-title">Key Events</h4>
                    <ul className="takeaway-list">
                        {data.takeaways.map((item, i) => (
                            <li key={i} className="takeaway-item">
                                <span className="bullet" style={{ backgroundColor: COLORS[label] || '#fff' }}></span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <div className="insight-footer">
                Updated: {new Date(data.lastUpdated).toLocaleString()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default function MarketPsychologyMap({ onMetaLoaded }) {
  const [chartData, setChartData] = useState([]);
  const [insightData, setInsightData] = useState({}); // Map: cluster_id -> details
  const [selectedCluster, setSelectedCluster] = useState(null); // { id, label }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // 1. Parallel Fetch: Geometry (Map) + Intelligence (Feed)
            const [mapRes, feedRes] = await Promise.all([
                fetch('/data/market_psychology_map.json'),
                fetch('/data/market_cluster_feed.json')
            ]);

            if (!mapRes.ok) throw new Error("Map data missing");
            
            const mapJson = await mapRes.json();
            
            // Handle optional feed (it might not exist yet if Airflow hasn't run)
            let feedJson = { data: [] };
            if (feedRes.ok) {
                feedJson = await feedRes.json();
            }

            setChartData(mapJson.data || []);
            
            // 2. Index the Insights for O(1) Lookup
            // Transform Array [{id: 0, summary: "..."}] -> Object { 0: {summary: "..."} }
            const insightsMap = feedJson.data.reduce((acc, item) => {
                acc[item.id] = item;
                return acc;
            }, {});
            setInsightData(insightsMap);

            // 3. Bubble up Metadata for the Inspector
            if (onMetaLoaded && mapJson.meta) {
                // We combine metadata so the Inspector shows BOTH logic steps
                const combinedMeta = {
                    ...mapJson.meta,
                    inspector: {
                        ...mapJson.meta.inspector,
                        // Append the RAG logic description to the existing Map description
                        description: `${mapJson.meta.inspector.description} \n\n[RAG ENRICHMENT]: Clusters are analyzed by Llama 3 (via Snowflake Cortex) to generate the summaries visible on click.`
                    }
                };
                onMetaLoaded(combinedMeta);
            }

            setLoading(false);
        } catch (err) {
            console.error("Failed to load map/feed:", err);
            setLoading(false);
        }
    };

    fetchData();
  }, [onMetaLoaded]);

  // Handle click on a scatter point
  const handlePointClick = (data) => {
    if (data && data.cluster_id !== undefined) {
        setSelectedCluster({ id: data.cluster_id, label: data.label });
    }
  };

  if (loading) return <div className="loading-state">Loading Neural Map & Insights...</div>;

  return (
    <div className="map-container relative-container">
        
        {/* THE INTERACTIVE MAP */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
            <XAxis type="number" dataKey="x" hide domain={['dataMin', 'dataMax']} />
            <YAxis type="number" dataKey="y" hide domain={['dataMin', 'dataMax']} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#555' }} />
            
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            
            <Scatter 
                name="Clusters" 
                data={chartData} 
                fill="#8884d8"
                onClick={(e) => handlePointClick(e.payload)}
                cursor="pointer"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.label] || COLORS['Noise']} 
                  opacity={entry.label === 'Noise' ? 0.3 : 0.8}
                  // Make non-noise clusters slightly larger to invite clicking
                  r={entry.label === 'Noise' ? 2 : Math.min(18, 5 + (Math.abs(entry.impact || 0) * 800))}
                  className={entry.label !== 'Noise' ? 'cursor-pointer hover-pulse' : ''}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        {/* THE INSIGHT PANEL OVERLAY */}
        {selectedCluster && (
            <InsightPanel 
                clusterId={selectedCluster.id}
                label={selectedCluster.label}
                insights={insightData}
                onClose={() => setSelectedCluster(null)}
            />
        )}
    </div>
  );
}
