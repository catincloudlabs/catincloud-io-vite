import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Play, Pause, SkipBack, Search, FastForward } from 'lucide-react';

// --- CONFIGURATION ---
// We highlight these specifically to show the "Physics" contrast
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

const THEME = {
  MAG7: '#4ade80',   // Neon Green
  CHAOS: '#e879f9',  // Neon Purple
  NOISE: '#334155',  // Muted Slate
  HOVER: '#ffffff'   // White
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
            // FETCH THE NEW PHYSICS FILE
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
            // Start at the end (Today)
            setCurrentDateIndex(sortedDates.length - 1); 
            
            if (onMetaLoaded) {
                onMetaLoaded({
                    title: "Market Physics Engine",
                    inspector: {
                        tag: "PHYSICS ENGINE",
                        description: "Visualizing semantic drift over time using t-SNE. Stocks move based on changing news narratives, not just price action.",
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
          // Stop if we reach the end
          if (prev >= dates.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800); // 800ms per frame = Smooth drifting
    }
    return () => clearInterval(interval);
  }, [isPlaying, dates.length]);

  // --- CURRENT FRAME DATA ---
  const currentFrameData = useMemo(() => {
    if (!dates.length) return [];
    const dateKey = dates[currentDateIndex];
    return historyData[dateKey] || [];
  }, [dates, currentDateIndex, historyData]);

  // --- STYLING HELPERS ---
  const getColor = (ticker) => {
    if (MAG_7.includes(ticker)) return THEME.MAG7;
    if (CHAOS.includes(ticker)) return THEME.CHAOS;
    return THEME.NOISE;
  };

  const getRadius = (ticker) => {
    if (isMobile) return 4;
    if (MAG_7.includes(ticker)) return 8; // Hero stocks bigger
    if (CHAOS.includes(ticker)) return 6;
    return 3; // Noise smaller
  };

  const getOpacity = (ticker) => {
    if (MAG_7.includes(ticker) || CHAOS.includes(ticker)) return 0.9;
    return 0.3; // Fade the noise
  };

  if (loading) return (
     <div className="map-loading-container">
        <div className="map-loading-text">Initializing Physics Engine...</div>
     </div>
  );

  return (
    <div className="map-wrapper relative flex flex-col h-full bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
        
        {/* --- TIMELINE CONTROLS (Top Left) --- */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 w-64">
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-700 p-2 rounded-lg shadow-xl">
                
                {/* Reset */}
                <button 
                    onClick={() => setCurrentDateIndex(0)} 
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Reset to Start"
                >
                    <SkipBack size={16} />
                </button>
                
                {/* Play/Pause */}
                <button 
                    onClick={() => {
                        if (currentDateIndex >= dates.length - 1) setCurrentDateIndex(0);
                        setIsPlaying(!isPlaying);
                    }}
                    className={`flex-1 p-2 rounded font-bold transition-colors flex items-center justify-center gap-2 ${isPlaying ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    <span className="text-xs font-mono">{isPlaying ? 'HALT' : 'RUN'}</span>
                </button>

                <div className="h-6 w-px bg-slate-700 mx-1"></div>

                {/* Date Display */}
                <div className="flex flex-col px-2 min-w-[80px]">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">T-Date</span>
                    <span className="text-sm font-mono font-bold text-accent">
                        {dates[currentDateIndex] || "--"}
                    </span>
                </div>
            </div>
            
            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                    className="h-full bg-accent transition-all duration-500 ease-out shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                    style={{ width: `${((currentDateIndex + 1) / dates.length) * 100}%` }}
                />
            </div>
        </div>

        {/* --- LEGEND (Bottom Right) --- */}
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs font-mono shadow-xl">
            <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                <span className="text-slate-300 font-bold">Mag 7 (Signal)</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(232,121,249,0.8)]"></span>
                <span className="text-slate-300 font-bold">Chaos (Retail)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span className="text-slate-500">Market Noise</span>
            </div>
        </div>

        {/* --- PHYSICS CHART --- */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            {/* Domain locked to [-100, 100] to prevent axis jumping during animation.
                This creates the "Space" effect where dots drift through a static void.
            */}
            <XAxis type="number" dataKey="x" domain={[-120, 120]} hide />
            <YAxis type="number" dataKey="y" domain={[-120, 120]} hide />
            
            <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-slate-900 border border-slate-600 p-3 rounded shadow-2xl backdrop-blur-md">
                                <div className="flex items-center justify-between gap-4 mb-1">
                                    <span className="text-accent font-bold font-mono text-lg">{data.ticker}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${MAG_7.includes(data.ticker) ? 'bg-green-500/20 text-green-400' : CHAOS.includes(data.ticker) ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {MAG_7.includes(data.ticker) ? 'MAG7' : CHAOS.includes(data.ticker) ? 'CHAOS' : 'EQUITY'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 font-mono">{data.date}</div>
                                <div className="text-[10px] text-slate-500 mt-2 font-mono">
                                    X: {data.x.toFixed(1)} | Y: {data.y.toFixed(1)}
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
                animationDuration={800} // Matches interval for linear drift effect
                animationEasing="ease-in-out"
            >
              {currentFrameData.map((entry, index) => {
                  const color = getColor(entry.ticker);
                  const radius = getRadius(entry.ticker);
                  const opacity = getOpacity(entry.ticker);
                  const isHighlighted = color !== THEME.NOISE;
                  
                  return (
                    <Cell 
                      key={`cell-${entry.ticker}`} // KEY IS CRITICAL: Allows React to animate the *same* dot moving
                      fill={color}
                      r={radius}
                      fillOpacity={opacity}
                      stroke={isHighlighted ? '#fff' : 'none'}
                      strokeWidth={isHighlighted ? 1 : 0}
                    />
                  );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
}
