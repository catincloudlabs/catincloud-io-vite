import React, { useEffect, useState, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

// --- CONFIGURATION ---
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

const THEME = {
  MAG7: '#4ade80',   // Green
  CHAOS: '#e879f9',  // Purple
  NOISE: '#334155',  // Slate
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  // --- STATE ---
  const [historyData, setHistoryData] = useState({}); 
  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // This state controls the "Big Bang" animation on load
  const [hasExploded, setHasExploded] = useState(false);

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
                grouped[row.date].push(row);
                uniqueDates.add(row.date);
            });

            // 2. Sort Dates (Oldest First)
            const sortedDates = Array.from(uniqueDates).sort();
            
            setHistoryData(grouped);
            setDates(sortedDates);
            setCurrentDateIndex(0); // Start at the beginning of the story
            
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
            
            // 3. Trigger "Explosion" animation after a brief delay
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

    // If we haven't exploded yet, force everything to 0,0 (The Big Bang)
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
    setHasExploded(false); // Reset to center
    setCurrentDateIndex(0);
    setTimeout(() => setHasExploded(true), 500); // Re-explode
  };

  // --- STYLES ---
  const getColor = (entry) => {
    if (entry.sentiment > 0.2) return '#22c55e'; 
    if (entry.sentiment < -0.2) return '#ef4444';
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
  // Calculate progress for the bar
  const progressPercent = dates.length > 1 ? ((currentDateIndex + 1) / dates.length) * 100 : 0;

  return (
    <div className="map-wrapper">
        
        {/* 1. TIMELINE CONTROLS */}
        <div className="map-controls-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            
            <div style={{ display: 'flex', gap: '6px' }}>
                {/* Reset Animation */}
                <button 
                    className="map-control-btn"
                    onClick={handleReset}
                    title="Replay Entrance"
                >
                    <RotateCcw size={14} />
                </button>

                <div className="map-control-btn" style={{ 
                    cursor: 'default', 
                    borderColor: 'rgba(56, 189, 248, 0.3)', 
                    background: 'rgba(15, 23, 42, 0.8)',
                    minWidth: '120px',
                    justifyContent: 'center',
                    padding: '6px 16px'
                }}>
                    <span className="control-text" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                        {currentDate}
                    </span>
                </div>

                {/* Navigation */}
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

        {/* 2. LEGEND */}
        <div className="map-empty-state-hint" style={{ top: 'auto', bottom: '16px', right: '16px', pointerEvents: 'none' }}>
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
                    <span className="text-muted">Positive</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                    <span className="text-muted">Negative</span>
                </div>
            </div>
        </div>

        {/* 3. CHART ENGINE */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* LOCKED AXIS: Essential for the "Physics" feel. 
                If the axis scales move, the dots don't look like they are drifting.
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
                                    <div className="tooltip-title">"{data.headline}"</div>
                                )}
                                <div className="tooltip-footer">
                                    <span className="tooltip-label">Sentiment</span>
                                    <span className={data.sentiment > 0 ? "text-green" : data.sentiment < 0 ? "text-red" : "text-muted"}>
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
                isAnimationActive={false} // <--- CRITICAL: Disable Recharts internal animation
            >
              {currentFrameData.map((entry) => {
                  const color = getColor(entry);
                  const radius = getRadius(entry.ticker);
                  const opacity = hasExploded ? 0.8 : 0; // Fade in during explosion
                  const isHighlighted = color !== THEME.NOISE;
                  
                  return (
                    <Cell 
                      key={`cell-${entry.ticker}`} 
                      fill={color}
                      r={radius}
                      fillOpacity={isHighlighted ? 0.9 : 0.4}
                      stroke={isHighlighted ? '#fff' : 'none'}
                      strokeWidth={isHighlighted ? 1 : 0}
                      // CSS TRANSITION: This handles the smooth drift from Day 1 -> Day 2
                      style={{ 
                          transition: 'cx 1s cubic-bezier(0.25, 1, 0.5, 1), cy 1s cubic-bezier(0.25, 1, 0.5, 1), fill 0.5s ease',
                          opacity: hasExploded ? 1 : 0
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
