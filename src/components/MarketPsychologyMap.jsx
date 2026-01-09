import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause } from 'lucide-react';

// --- CONFIGURATION ---
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

const THEME = {
  MAG7: '#4ade80',   // Green (Matches var(--green))
  CHAOS: '#e879f9',  // Purple
  NOISE: '#334155',  // Slate (Matches var(--border))
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  // --- STATE ---
  const [historyData, setHistoryData] = useState({}); 
  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Controls the "Big Bang" entrance animation
  const [hasExploded, setHasExploded] = useState(false);

  // --- DATA LOADING ---
  useEffect(() => {
    const fetchData = async () => {
        try {
            // Load the Physics History
            const res = await fetch('/data/market_physics_history.json');
            const json = await res.json();
            
            // 1. Group flat list by Date
            const grouped = {};
            const uniqueDates = new Set();
            
            json.data.forEach(row => {
                if (!grouped[row.date]) grouped[row.date] = [];
                grouped[row.date].push(row);
                uniqueDates.add(row.date);
            });

            // 2. Sort Dates
            const sortedDates = Array.from(uniqueDates).sort();
            
            setHistoryData(grouped);
            setDates(sortedDates);
            setCurrentDateIndex(0); // Start at the beginning
            
            // 3. Update Parent Meta
            if (onMetaLoaded) {
                onMetaLoaded({
                    title: "Market Physics Engine",
                    inspector: {
                        tag: "PHYSICS ENGINE",
                        description: "Visualizing semantic drift. Dots start at the center and expand to their semantic coordinates. Use the arrow keys to step through time.",
                        sql_logic: "-- VECTOR AGGREGATION\nSELECT ticker, AVG(embedding) \nFROM news_vectors \nGROUP BY ticker, date",
                        dbt_logic: "models/marts/physics/mrt_daily_forces.py"
                    }
                });
            }
            setLoading(false);
            
            // 4. Trigger Entrance Animation
            setTimeout(() => setHasExploded(true), 500);

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
    
    const dateKey = dates[currentDateIndex];
    const rawData = historyData[dateKey] || [];

    // If we haven't exploded yet, force everything to 0,0
    if (!hasExploded) {
        return rawData.map(d => ({ ...d, x: 0, y: 0 }));
    }

    return rawData;
  }, [dates, currentDateIndex, historyData, hasExploded]);

  // --- HANDLERS ---
  const handleStepBack = () => {
    setCurrentDateIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleStepForward = () => {
    setCurrentDateIndex(prev => (prev < dates.length - 1 ? prev + 1 : prev));
  };

  const handleReset = () => {
    setHasExploded(false); // Collapse to center
    setCurrentDateIndex(0);
    setTimeout(() => setHasExploded(true), 500); // Re-explode
  };

  // --- STYLES ---
  const getColor = (entry) => {
    if (entry.sentiment > 0.2) return '#22c55e'; // Green
    if (entry.sentiment < -0.2) return '#ef4444'; // Red
    if (MAG_7.includes(entry.ticker)) return THEME.MAG7;
    if (CHAOS.includes(entry.ticker)) return THEME.CHAOS;
    return THEME.NOISE;
  };

  const getRadius = (ticker) => {
    if (isMobile) return 4;
    if (MAG_7.includes(ticker)) return 8; 
    if (CHAOS.includes(ticker)) return 6;
    return 3; 
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
        
        {/* 1. CONTROLS (Top Left - Matching your existing styles) */}
        <div className="map-controls-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            
            <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                    className="map-control-btn"
                    onClick={handleReset}
                    title="Reset Animation"
                >
                    <RotateCcw size={14} />
                </button>

                <div className="map-control-btn" style={{ 
                    cursor: 'default', 
                    borderColor: 'rgba(56, 189, 248, 0.3)', 
                    background: 'rgba(15, 23, 42, 0.8)',
                    minWidth: '100px',
                    justifyContent: 'center'
                }}>
                    <span className="control-text" style={{ color: 'var(--accent)' }}>
                        {currentDate}
                    </span>
                </div>

                <button 
                    className="map-control-btn"
                    onClick={handleStepBack}
                    disabled={currentDateIndex === 0}
                    style={{ opacity: currentDateIndex === 0 ? 0.5 : 1 }}
                >
                    <ChevronLeft size={16} />
                </button>

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
            <div style={{ 
                width: '100%', 
                height: '4px', 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '2px',
                overflow: 'hidden'
            }}>
                <div style={{ 
                    width: `${progressPercent}%`, 
                    height: '100%', 
                    background: 'var(--accent)',
                    transition: 'width 0.3s ease-out' 
                }} />
            </div>
        </div>

        {/* 2. LEGEND (Bottom Right) */}
        <div className="map-empty-state-hint" style={{ top: 'auto', bottom: '16px', right: '16px', pointerEvents: 'none', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(4px)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: THEME.MAG7 }}></span>
                    <span className="text-muted">Mag 7</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: THEME.CHAOS }}></span>
                    <span className="text-muted">Chaos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                    <span className="text-muted">Positive News</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                    <span className="text-muted">Negative News</span>
                </div>
            </div>
        </div>

        {/* 3. CHART */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* We lock the axis domain to fixed values [-120, 120]. 
                This ensures the "camera" doesn't zoom in/out, creating the 
                illusion that the dots are moving through a fixed space.
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
                                    <div className="tooltip-title" style={{ fontStyle: 'italic', marginBottom: '8px' }}>
                                        "{data.headline}"
                                    </div>
                                )}
                                <div className="tooltip-footer">
                                    <span className="tooltip-label">Sentiment</span>
                                    <span style={{ color: data.sentiment > 0 ? '#22c55e' : data.sentiment < 0 ? '#ef4444' : '#94a3b8', fontWeight: 'bold' }}>
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
                name="Physics" 
                data={currentFrameData} 
                isAnimationActive={false} // Disable Recharts default animation to prevent "exploding from center"
            >
              {currentFrameData.map((entry, index) => {
                  const color = getColor(entry);
                  const radius = getRadius(entry.ticker);
                  // Only show dots after the "Big Bang" flag is true
                  const opacity = hasExploded ? (color !== THEME.NOISE ? 0.9 : 0.4) : 0; 
                  const isHighlighted = color !== THEME.NOISE;
                  
                  return (
                    <Cell 
                      key={`cell-${entry.ticker}`} // Keying by Ticker is vital for the CSS transition to work
                      fill={color}
                      r={radius}
                      fillOpacity={opacity}
                      stroke={isHighlighted ? '#fff' : 'none'}
                      strokeWidth={isHighlighted ? 1 : 0}
                      // CSS Transition handles the smooth drift between dates
                      style={{ 
                          transition: 'cx 0.5s ease-in-out, cy 0.5s ease-in-out, fill 0.5s ease',
                          opacity: opacity // Fade in
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
