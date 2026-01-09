import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar, Play, Pause } from 'lucide-react';

// --- CONFIGURATION ---
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

const CHART_COLORS = {
  'Positive': '#4ade80',  // Green
  'Negative': '#ef4444',  // Red
  'Mag 7': '#38bdf8',     // Blue (Brand Accent)
  'Chaos': '#e879f9',     // Purple
  'Noise': '#334155'      // Slate
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  // --- STATE ---
  const [historyData, setHistoryData] = useState({}); 
  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- LOAD DATA ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch('/data/market_physics_history.json');
            const json = await res.json();
            
            // 1. Group by Date
            const grouped = {};
            const uniqueDates = new Set();
            
            json.data.forEach(row => {
                if (!grouped[row.date]) grouped[row.date] = [];
                grouped[row.date].push(row);
                uniqueDates.add(row.date);
            });

            // 2. Sort & Set
            const sortedDates = Array.from(uniqueDates).sort();
            setHistoryData(grouped);
            setDates(sortedDates);
            setCurrentDateIndex(0); // Start at beginning
            
            if (onMetaLoaded) {
                onMetaLoaded({
                    title: "Market Physics Engine",
                    inspector: {
                        tag: "PHYSICS ENGINE",
                        description: "Visualizing semantic drift over 30 days. Use the arrows to step through time and observe how news narratives push and pull stocks into different sectors.",
                        sql_logic: "-- VECTOR AGGREGATION\nSELECT ticker, AVG(embedding) \nFROM news_vectors \nGROUP BY ticker, date",
                        dbt_logic: "models/marts/physics/mrt_daily_forces.py"
                    }
                });
            }
            setLoading(false);
        } catch (err) {
            console.error("Physics Engine Load Error:", err);
            setLoading(false);
        }
    };
    fetchData();
  }, [onMetaLoaded]);

  // --- FRAME DATA ---
  const currentFrameData = useMemo(() => {
    if (!dates.length) return [];
    return historyData[dates[currentDateIndex]] || [];
  }, [dates, currentDateIndex, historyData]);

  // --- HANDLERS ---
  const handleStepBack = () => {
    setCurrentDateIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleStepForward = () => {
    setCurrentDateIndex(prev => (prev < dates.length - 1 ? prev + 1 : prev));
  };

  const handleReset = () => {
    setCurrentDateIndex(0);
  };

  // --- STYLING LOGIC ---
  const getAttributes = (entry) => {
    // 1. Determine Category
    let category = 'Noise';
    if (MAG_7.includes(entry.ticker)) category = 'Mag 7';
    else if (CHAOS.includes(entry.ticker)) category = 'Chaos';
    else if (entry.sentiment > 0.2) category = 'Positive';
    else if (entry.sentiment < -0.2) category = 'Negative';

    // 2. Determine Size
    const baseRadius = isMobile ? 4 : 5;
    const radius = (category === 'Mag 7' || category === 'Chaos') ? baseRadius * 2 : baseRadius;

    // 3. Determine Opacity
    const opacity = category === 'Noise' ? 0.3 : 0.9;
    const fill = CHART_COLORS[category];

    return { fill, radius, opacity, category };
  };

  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Physics Engine...</div>
     </div>
  );

  const currentDate = dates[currentDateIndex] || "--";
  const progressPercent = dates.length > 1 ? ((currentDateIndex + 1) / dates.length) * 100 : 0;

  return (
    <div className="map-wrapper">
        
        {/* --- CONTROLS (Top Left - Reusing your existing style classes) --- */}
        <div className="map-controls-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            
            <div style={{ display: 'flex', gap: '8px' }}>
                {/* Reset Button */}
                <button 
                    className="map-control-btn" 
                    onClick={handleReset} 
                    title="Reset Timeline"
                >
                    <RotateCcw size={14} />
                </button>
                
                {/* Back Button */}
                <button 
                    className="map-control-btn" 
                    onClick={handleStepBack} 
                    disabled={currentDateIndex === 0}
                    style={{ opacity: currentDateIndex === 0 ? 0.5 : 1 }}
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Date Display (Styled like a button but static) */}
                <div 
                    className="map-control-btn active-focus" 
                    style={{ cursor: 'default', minWidth: '110px', justifyContent: 'center' }}
                >
                   <Calendar size={14} className="mr-2" />
                   <span className="control-text">{currentDate}</span>
                </div>

                {/* Forward Button */}
                <button 
                    className="map-control-btn" 
                    onClick={handleStepForward} 
                    disabled={currentDateIndex === dates.length - 1}
                    style={{ opacity: currentDateIndex === dates.length - 1 ? 0.5 : 1 }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div 
                    style={{ 
                        width: `${progressPercent}%`, 
                        height: '100%', 
                        background: 'var(--accent)', 
                        transition: 'width 0.3s ease' 
                    }} 
                />
            </div>
        </div>

        {/* --- LEGEND (Bottom Right) --- */}
        <div className="map-empty-state-hint" style={{ top: 'auto', bottom: '16px', right: '16px', pointerEvents: 'none', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', background: 'rgba(15, 23, 42, 0.8)', padding: '12px' }}>
            {Object.entries(CHART_COLORS).map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}40` }}></span>
                    <span style={{ color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                </div>
            ))}
        </div>

        {/* --- CHART --- */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* Fixed Domain allows dots to "travel" across the screen without axes resizing */}
            <XAxis type="number" dataKey="x" domain={[-120, 120]} hide />
            <YAxis type="number" dataKey="y" domain={[-120, 120]} hide />
            
            <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="custom-tooltip">
                                <div className="tooltip-header">
                                    <span className="tooltip-ticker">{data.ticker}</span>
                                    <span className="tooltip-date">{data.date}</span>
                                </div>
                                {data.headline && (
                                    <div className="tooltip-title" style={{ marginTop: '8px', fontStyle: 'italic', opacity: 0.9 }}>
                                        "{data.headline}"
                                    </div>
                                )}
                                <div className="tooltip-footer" style={{ marginTop: '8px' }}>
                                    <span className="tooltip-label">Sentiment</span>
                                    <span style={{ 
                                        color: data.sentiment > 0 ? 'var(--green)' : data.sentiment < 0 ? 'var(--red)' : 'var(--text-muted)',
                                        fontWeight: 'bold',
                                        marginLeft: 'auto'
                                    }}>
                                        {data.sentiment > 0 ? '+' : ''}{data.sentiment}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />

            <Scatter 
                data={currentFrameData} 
                isAnimationActive={false} // CRITICAL: Disable Recharts entrance animation to prevent "exploding from center"
            >
              {currentFrameData.map((entry) => {
                  const style = getAttributes(entry);
                  return (
                    <Cell 
                      key={entry.ticker} // Stable key ensures element reuse for CSS transition
                      fill={style.fill}
                      r={style.radius}
                      fillOpacity={style.opacity}
                      stroke={style.category !== 'Noise' ? '#fff' : 'none'}
                      strokeWidth={1}
                      style={{ 
                          // CSS TRANSITION: This is what handles the smooth glide between days
                          transition: 'cx 0.5s cubic-bezier(0.25, 1, 0.5, 1), cy 0.5s cubic-bezier(0.25, 1, 0.5, 1), fill 0.3s ease',
                          cursor: 'pointer'
                      }}
                    />
                  );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
}
