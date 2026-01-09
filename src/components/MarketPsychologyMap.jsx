import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Play, Pause, SkipBack, Target, Activity } from 'lucide-react';

// --- CONFIGURATION ---
const MAG_7 = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD'];
const CHAOS = ['GME', 'AMC', 'DJT', 'PLTR', 'SOUN', 'BTDR', 'MSTR'];

const THEME = {
  MAG7: '#4ade80',   // Green
  CHAOS: '#e879f9',  // Pink/Purple
  NOISE: '#334155'   // Slate
};

export default function MarketPsychologyMap({ onMetaLoaded, isMobile }) {
  // --- STATE ---
  const [historyData, setHistoryData] = useState({}); // { "2025-12-10": [...] }
  const [dates, setDates] = useState([]);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Interaction
  const [hoveredTicker, setHoveredTicker] = useState(null);

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

            // 2. Sort Dates
            const sortedDates = Array.from(uniqueDates).sort();
            
            setHistoryData(grouped);
            setDates(sortedDates);
            setCurrentDateIndex(sortedDates.length - 1); // Start at end
            
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
          if (prev >= dates.length - 1) {
            setIsPlaying(false); // Stop at end
            return prev;
          }
          return prev + 1;
        });
      }, 800); // 800ms per frame for smooth drift
    }
    return () => clearInterval(interval);
  }, [isPlaying, dates.length]);

  // --- CURRENT FRAME DATA ---
  const currentFrameData = useMemo(() => {
    if (!dates.length) return [];
    const dateKey = dates[currentDateIndex];
    return historyData[dateKey] || [];
  }, [dates, currentDateIndex, historyData]);

  // --- HANDLERS ---
  const handlePlayPause = () => {
    if (currentDateIndex >= dates.length - 1) setCurrentDateIndex(0); // Restart if at end
    setIsPlaying(!isPlaying);
  };

  const getColor = (ticker) => {
    if (MAG_7.includes(ticker)) return THEME.MAG7;
    if (CHAOS.includes(ticker)) return THEME.CHAOS;
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

  return (
    <div className="map-wrapper relative flex flex-col h-full">
        
        {/* --- OVERLAY: TIMELINE CONTROLS --- */}
        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 p-2 rounded-lg shadow-xl">
                <button 
                    onClick={() => setCurrentDateIndex(0)} 
                    className="p-2 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                    title="Reset Timeline"
                >
                    <SkipBack size={16} />
                </button>
                
                <button 
                    onClick={handlePlayPause}
                    className={`p-2 rounded font-bold transition-colors flex items-center gap-2 ${isPlaying ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}
                >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    <span className="text-xs font-mono">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <div className="h-6 w-px bg-slate-700 mx-1"></div>

                <div className="flex flex-col px-2">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Simulation Date</span>
                    <span className="text-sm font-mono font-bold text-accent">
                        {dates[currentDateIndex] || "--"}
                    </span>
                </div>
            </div>
            
            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-accent transition-all duration-500 ease-out"
                    style={{ width: `${((currentDateIndex + 1) / dates.length) * 100}%` }}
                />
            </div>
        </div>

        {/* --- OVERLAY: LEGEND --- */}
        <div className="absolute bottom-4 right-4 z-20 bg-slate-900/80 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs font-mono">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></span>
                <span className="text-slate-300">Mag 7 (Rational)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(232,121,249,0.5)]"></span>
                <span className="text-slate-300">Chaos (Retail)</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span className="text-slate-500">Market Noise</span>
            </div>
        </div>

        {/* --- CHART --- */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            {/* Hide Axis for clean "Space" look */}
            <XAxis type="number" dataKey="x" domain={[-100, 100]} hide />
            <YAxis type="number" dataKey="y" domain={[-100, 100]} hide />
            
            <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-slate-800 border border-slate-600 p-3 rounded shadow-xl">
                                <div className="text-accent font-bold font-mono">{data.ticker}</div>
                                <div className="text-xs text-slate-400">{data.date}</div>
                                <div className="text-[10px] text-slate-500 mt-1">Coordinates: {data.x.toFixed(1)}, {data.y.toFixed(1)}</div>
                            </div>
                        );
                    }
                    return null;
                }}
            />

            <Scatter 
                name="Physics" 
                data={currentFrameData} 
                fill="#8884d8"
                animationDuration={800} // Matches interval for smooth transition
            >
              {currentFrameData.map((entry, index) => {
                  const color = getColor(entry.ticker);
                  const radius = getRadius(entry.ticker);
                  const isHighlighted = color !== THEME.NOISE;
                  
                  return (
                    <Cell 
                      key={`cell-${entry.ticker}`} // Key by Ticker to allow Recharts to animate positions
                      fill={color}
                      r={radius}
                      stroke={isHighlighted ? '#fff' : 'none'}
                      strokeWidth={1}
                      fillOpacity={isHighlighted ? 0.9 : 0.3}
                      className={isHighlighted ? 'transition-all duration-700 ease-in-out' : ''}
                    />
                  );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
    </div>
  );
}
