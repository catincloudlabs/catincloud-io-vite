import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Play, Pause, SkipBack, Info } from 'lucide-react';

// --- CONFIGURATION ---
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

// Theme Colors (Matching CSS Variables)
const THEME = {
  MAG7: '#4ade80',   // var(--green)
  CHAOS: '#e879f9',  // Purple (Custom)
  NOISE: '#334155',  // var(--border) / Slate
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  // --- STATE ---
  const [historyData, setHistoryData] = useState({}); // { "2025-12-10": [...] }
  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

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

            // 2. Sort Dates (Oldest to Newest)
            const sortedDates = Array.from(uniqueDates).sort();
            
            setHistoryData(grouped);
            setDates(sortedDates);
            setCurrentDateIndex(sortedDates.length - 1); // Start at most recent
            
            // 3. Inject Metadata for Parent Card
            if (onMetaLoaded) {
                onMetaLoaded({
                    title: "Market Physics Engine",
                    inspector: {
                        tag: "PHYSICS ENGINE",
                        description: "Visualizing semantic drift over time. Stocks move based on changing news narratives, creating 'gravity wells' of sentiment.",
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

  // --- ANIMATION LOOP ---
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentDateIndex(prev => {
          if (prev >= dates.length - 1) {
            setIsPlaying(false); // Stop at end
            return prev;
          }
          return prev + 1;
        });
      }, 800); // 800ms per frame
    }
    return () => clearInterval(interval);
  }, [isPlaying, dates.length]);

  // --- MEMOIZED FRAME ---
  const currentFrameData = useMemo(() => {
    if (!dates.length) return [];
    const dateKey = dates[currentDateIndex];
    return historyData[dateKey] || [];
  }, [dates, currentDateIndex, historyData]);

  // --- STYLES ---
  const getColor = (entry) => {
    // Sentiment Override (Bright Green/Red)
    if (entry.sentiment > 0.2) return '#22c55e'; 
    if (entry.sentiment < -0.2) return '#ef4444';

    // Sector Fallback
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

  const getOpacity = (ticker) => {
    if (MAG_7.includes(ticker) || CHAOS.includes(ticker)) return 0.9;
    return 0.4; 
  };

  // --- RENDER ---
  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Physics Engine...</div>
     </div>
  );

  const currentDate = dates[currentDateIndex] || "--";
  const progressPercent = dates.length > 1 ? (currentDateIndex / (dates.length - 1)) * 100 : 0;

  return (
    <div className="map-wrapper">
        
        {/* 1. TIMELINE CONTROLS (Top Left) */}
        <div className="map-controls-group" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            
            <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                    className="map-control-btn"
                    onClick={() => setCurrentDateIndex(0)}
                    title="Reset to Start"
                >
                    <SkipBack size={14} />
                </button>

                <button 
                    className={`map-control-btn ${isPlaying ? 'active' : ''}`}
                    onClick={() => {
                        if (currentDateIndex >= dates.length - 1) setCurrentDateIndex(0);
                        setIsPlaying(!isPlaying);
                    }}
                >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                    <span className="control-text desktop-only-text">
                        {isPlaying ? 'PAUSE' : 'PLAY'}
                    </span>
                </button>

                <div className="map-control-btn" style={{ cursor: 'default', borderColor: 'transparent', background: 'rgba(30, 41, 59, 0.4)' }}>
                    <span className="control-text" style={{ color: 'var(--accent)' }}>
                        {currentDate}
                    </span>
                </div>
            </div>

            {/* Progress Bar (Custom Style using Theme Vars) */}
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
                    transition: 'width 0.8s linear'
                }} />
            </div>
        </div>

        {/* 2. LEGEND (Bottom Right - Mimicking .dock-sentiment-box style) */}
        <div className="map-empty-state-hint" style={{ top: 'auto', bottom: '16px', right: '16px', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: THEME.MAG7 }}></span>
                    <span className="text-muted">Mag 7 (Signal)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: THEME.CHAOS }}></span>
                    <span className="text-muted">Chaos (Retail)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: THEME.NOISE }}></span>
                    <span className="text-muted">Market Noise</span>
                </div>
            </div>
        </div>

        {/* 3. CHART ENGINE */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* Lock Domain to prevent axis jumping. 
               The t-SNE logic usually outputs coords between -100 and 100.
            */}
            <XAxis type="number" dataKey="x" domain={[-120, 120]} hide />
            <YAxis type="number" dataKey="y" domain={[-120, 120]} hide />
            
            {/* Using the CSS .custom-tooltip class structure */}
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
                                    <div className="tooltip-title">
                                        "{data.headline}"
                                    </div>
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
                animationDuration={800} 
                animationEasing="linear"
            >
              {currentFrameData.map((entry, index) => {
                  const color = getColor(entry);
                  const radius = getRadius(entry.ticker);
                  const opacity = getOpacity(entry.ticker);
                  const isHighlighted = color !== THEME.NOISE;
                  
                  return (
                    <Cell 
                      key={`cell-${entry.ticker}`} 
                      fill={color}
                      r={radius}
                      fillOpacity={opacity}
                      stroke={isHighlighted ? '#fff' : 'none'}
                      strokeWidth={isHighlighted ? 1 : 0}
                      // Apply CSS transition class if highlighted for smoother color shifts
                      className={isHighlighted ? 'node-standard' : 'node-noise'}
                    />
                  );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
}
