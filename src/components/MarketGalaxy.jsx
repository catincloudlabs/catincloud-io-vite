import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

const MarketGalaxy = ({ data, onNodeClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Initialize Physics Engine
  const { 
    currentDate, 
    currentFrameData, 
    controls 
  } = useMarketPhysics(data);

  // --- 1. FRAME-BASED SCALING (The Fix) ---
  // Calculates bounds *only for the current day*. 
  // This ensures nodes always fill the screen, preventing the "middle cluster" issue.
  const frameBounds = useMemo(() => {
    const points = Object.values(currentFrameData);
    if (points.length === 0) return { minX: -10, maxX: 10, minY: -10, maxY: 10 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // Add 15% Padding so nodes don't touch the edges
    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;
    const paddingX = xSpan * 0.15;
    const paddingY = ySpan * 0.15;

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY
    };
  }, [currentFrameData]);

  // Handle Window Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    window.addEventListener('resize', updateSize);
    updateSize(); 
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // --- THE RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    const pixelRatio = window.devicePixelRatio || 1;

    // High-DPI Scaling for crisp text
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    // Create Scales based on CURRENT FRAME bounds
    const xScale = scaleLinear()
      .domain([frameBounds.minX, frameBounds.maxX])
      .range([0, width]); 

    const yScale = scaleLinear()
      .domain([frameBounds.minY, frameBounds.maxY])
      .range([0, height]);

    // Clear Screen
    ctx.clearRect(0, 0, width, height);
    
    // Draw Subtle Grid (Optional, helps visualize space)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)'; 
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < width; i += 100) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    for (let i = 0; i < height; i += 100) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // Draw Particles
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        // Sentiment Color
        let color = '#38bdf8'; // Default Blue
        if (stock.sentiment > 0.15) color = '#22c55e'; // Green
        if (stock.sentiment < -0.15) color = '#ef4444'; // Red
        
        // Dynamic Radius based on Velocity
        const radius = Math.max(4, Math.min(14, 4 + (stock.velocity || 0))); 

        // Draw Node
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Draw Label (Always show if high velocity OR hovered)
        const isHovered = hoveredNode?.ticker === stock.ticker;
        if (isHovered || stock.velocity > 2) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = isHovered ? '#fff' : 'rgba(248, 250, 252, 0.7)';
            ctx.font = isHovered ? 'bold 12px "JetBrains Mono"' : '10px "JetBrains Mono"';
            ctx.fillText(stock.ticker, x + radius + 4, y + 4);
        }
    });

  }, [currentFrameData, dimensions, hoveredNode, frameBounds]);

  // Click Handler (Synced to dynamic scales)
  const handleCanvasClick = (e) => {
    if (!onNodeClick || !currentFrameData) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, dimensions.width]);
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, dimensions.height]);

    let closest = null;
    let minDist = 30; // Hit radius

    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        const dist = Math.hypot(clickX - x, clickY - y);
        if (dist < minDist) {
            closest = stock;
            minDist = dist;
        }
    });

    if (closest) {
        onNodeClick(closest);
        setHoveredNode(closest);
    }
  };

  return (
    <div className="panel h-full relative flex flex-col" ref={containerRef}>
      
      {/* HEADER: Identity + Controls */}
      <div className="panel-header p-4 border-b border-[var(--border)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md z-10 flex justify-between items-center">
        
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-100 tracking-wider">MARKET GALAXY</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono">
              PHYSICS ENGINE
            </span>
        </div>

        <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-accent font-bold tracking-widest">
              {currentDate || "LOADING..."}
            </span>

            {/* BUTTONS ONLY (No Slider) */}
            <div className="flex items-center gap-1 bg-slate-800 rounded p-1 border border-slate-700">
                <button 
                  onClick={controls.stepBack}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
                
                {/* Play/Pause Toggle embedded in controls */}
                <button 
                  onClick={() => controls.setIsPlaying(!controls.isPlaying)}
                  className={`p-1.5 rounded transition-colors ${controls.isPlaying ? 'text-accent bg-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                  title={controls.isPlaying ? "Pause Simulation" : "Auto-Play"}
                >
                  {controls.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>

                <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>

                <button 
                  onClick={controls.stepForward}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* CANVAS LAYER */}
      <div className="flex-1 relative cursor-crosshair bg-[var(--bg-app)]">
        <canvas 
            ref={canvasRef}
            style={{ width: '100%', height: '100%' }}
            onClick={handleCanvasClick}
            className="block"
        />
        
        {/* Helper Hint */}
        {!hoveredNode && (
            <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 font-mono pointer-events-none">
                // CLICK NODES TO INSPECT AGENT DATA
            </div>
        )}
      </div>

    </div>
  );
};

export default MarketGalaxy;
