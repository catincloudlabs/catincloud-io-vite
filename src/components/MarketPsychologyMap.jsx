import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar } from 'lucide-react';

// --- CONFIGURATION ---
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

const CHART_COLORS = {
  'Mag 7': '#4ade80',    // Green
  'Chaos': '#e879f9',    // Purple
  'Positive': '#38bdf8', // Blue
  'Negative': '#ef4444', // Red
  'Noise': '#334155'     // Slate
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  // --- STATE ---
  const [historyData, setHistoryData] = useState({}); 
  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // RESTORED: Control Recharts animation state
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // --- DATA LOADING ---
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
                // Assign a category label for coloring
                let label = 'Noise';
                if (MAG_7.includes(row.ticker)) label = 'Mag 7';
                else if (CHAOS.includes(row.ticker)) label = 'Chaos';
                else if (row.sentiment > 0.2) label = 'Positive';
                else if (row.sentiment < -0.2) label = 'Negative';
                
                grouped[row.date].push({ ...row, label });
                uniqueDates.add(row.date);
            });

            // 2. Sort Dates
            const sortedDates = Array.from(uniqueDates).sort();
            
            setHistoryData(grouped);
            setDates(sortedDates);
            setCurrentDateIndex(0); 
            
            if (onMetaLoaded) {
                onMetaLoaded({
                    title: "Market Physics Engine",
                    inspector: {
                        tag: "PHYSICS ENGINE",
                        description: "Visualizing semantic drift over 30 days. Use the arrows to step through time and observe how news narratives push and pull stocks into different 'gravity wells'.",
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
    setShouldAnimate(true); // Ensure animation is active for the move
    setCurrentDateIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleStepForward = () => {
    setShouldAnimate(true); // Ensure animation is active for the move
    setCurrentDateIndex(prev => (prev < dates.length - 1 ? prev + 1 : prev));
  };

  const handleReset = () => {
    setShouldAnimate(false); // Snap back without animation (optional preference)
    setCurrentDateIndex(0);
    // Re-enable animation for subsequent moves
    setTimeout(() => setShouldAnimate(true), 100);
  };

  // --- STYLING HELPERS ---
  const getAttributes = (entry) => {
    const isNoise = entry.label === 'Noise';
    const radius = isMobile ? (isNoise ? 4 : 8) : (isNoise ? 3 : 6);
    const opacity = isNoise ? 0.4 : 0.9;
    const fill = CHART_COLORS[entry.label] || CHART_COLORS['Noise'];
    return { fill, radius, opacity, isNoise };
  };

  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Physics Engine...</div>
     </div>
  );

  const currentDate = dates[currentDateIndex] || "--";
  const progressPercent = dates.length > 1 ? ((currentDateIndex + 1) / dates.length) * 100 : 0;
  
  const chartMargins = isMobile 
    ? { top: 10, right: 10, bottom: 60, left: 10 } 
    : { top: 20, right: 20, bottom: 20, left: 20 };

  return (
    <div className="map-wrapper">
        
        {/* --- CONTROLS --- */}
        <div className="map-controls-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    className="map-control-btn" 
                    onClick={handleReset} 
                    title="Reset Timeline"
                >
                    <RotateCcw size={14} />
                </button>
                
                <button 
                    className="map-control-btn" 
                    onClick={handleStepBack} 
                    disabled={currentDateIndex === 0}
                    style={{ opacity: currentDateIndex === 0 ? 0.5 : 1 }}
                >
                    <ChevronLeft size={16} />
                </button>

                <div 
                    className="map-control-btn active-focus" 
                    style={{ cursor: 'default', minWidth: '110px', justifyContent: 'center', borderColor: 'var(--accent)' }}
                >
                   <Calendar size={14} className="mr-2 text-accent" />
                   <span className="control-text desktop-only-text text-accent">{currentDate}</span>
                </div>

                <button 
                    className="map-control-btn" 
                    onClick={handleStepForward} 
                    disabled={currentDateIndex === dates.length - 1}
                    style={{ opacity: currentDateIndex === dates.length - 1 ? 0.5 : 1 }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
            
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

        {/* --- LEGEND --- */}
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
          <ScatterChart margin={chartMargins}>
            {/* We maintain a fixed domain. This is critical for animation.
               If the domain changes every frame, Recharts can't interpolate the position correctly.
            */}
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
                                        {data.sentiment}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                    return null;
                }}
            />

            <Scatter 
                name="Physics" 
                data={currentFrameData} 
                isAnimationActive={shouldAnimate} // <--- RESTORED AS REQUESTED
                animationDuration={800} 
                animationEasing="ease-in-out"
            >
              {currentFrameData.map((entry) => {
                  const style = getAttributes(entry);
                  return (
                    <Cell 
                      key={entry.ticker} // Stable key ensures smooth transition between dates
                      fill={style.fill}
                      r={style.radius}
                      opacity={style.opacity}
                      stroke={!style.isNoise ? '#fff' : 'none'}
                      strokeWidth={1}
                      className={!style.isNoise ? 'node-standard cursor-pointer' : 'node-noise'}
                    />
                  );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
}
