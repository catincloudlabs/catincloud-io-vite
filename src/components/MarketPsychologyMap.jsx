import React, { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const COLORS = {
  'Justified Optimism': '#4ade80',
  'Bull Trap': '#f87171',
  'Justified Fear': '#ef4444',
  'Bear Trap': '#60a5fa',
  'Noise': '#334155'
};

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
            {/* Note: Color logic remains in JS for dynamic labels, or you can map classes */}
            <span className="tooltip-label" style={{ color: COLORS[data.label] || '#fff' }}>
                {data.label}
            </span>
            <span className={sentimentClass}>
                Sent: {data.sentiment?.toFixed(2)}
            </span>
        </div>
      </div>
    );
  }
  return null;
};

// Accept 'onMetaLoaded' to pass timestamp info back to the parent Card
export default function MarketPsychologyMap({ onMetaLoaded }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://cdn.catincloud.io/data/market_psychology_map.json')
      .then(res => res.json())
      .then(payload => {
        setChartData(payload.data || []);
        setLoading(false);
        if (onMetaLoaded && payload.meta) {
            onMetaLoaded(payload.meta);
        }
      })
      .catch(err => {
        console.error("Failed to load map:", err);
        setLoading(false);
      });
  }, [onMetaLoaded]);

  if (loading) return <div className="loading-state">Loading Neural Map...</div>; // Add .loading-state to CSS if needed

  return (
    <div className="map-container">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
            <XAxis type="number" dataKey="x" hide domain={['auto', 'auto']} />
            <YAxis type="number" dataKey="y" hide domain={['auto', 'auto']} />
            
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#555' }} />
            
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
            />
            
            <Scatter name="Clusters" data={chartData} fill="#8884d8">
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[entry.label] || COLORS['Noise']} 
                  opacity={entry.label === 'Noise' ? 0.3 : 0.9}
                  r={entry.label === 'Noise' ? 2 : Math.min(15, 4 + (Math.abs(entry.impact || 0) * 800))} 
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
}
