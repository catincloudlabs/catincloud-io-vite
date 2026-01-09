import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MarketGalaxy = ({ data, onNodeClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState(null);

  // Initialize the Physics Engine
  const { 
    currentDate, 
    currentFrameData, 
    timeline,
    currentDateIndex,
    controls 
  } = useMarketPhysics(data);

  // --- 1. DYNAMIC SCALING (Fixes Clustering) ---
  // We calculate the global min/max X and Y across the ENTIRE dataset
  // so the "camera" doesn't jitter around as days change.
  const bounds = useMemo(() => {
    if (!data || data.length === 0) return { minX: -50, maxX: 50, minY: -50, maxY: 50 };
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    for (const p of data) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    // Add 10% padding so dots don't touch the edges
    const padX = (maxX - minX) * 0.1;
    const padY = (maxY - minY) * 0.1;

    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY
    };
  }, [data]);

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
    updateSize(); // Initial sizing
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // --- THE RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    // A. Create Scales based on Dynamic Bounds
    const xScale = scaleLinear()
      .domain([bounds.minX, bounds.maxX])
      .range([20, width - 20]); // Keep 20px edge padding

    // Flip Y axis so "up" is positive (standard cartesian) if needed, 
    // or keep standard canvas Y (down is positive). 
    // Usually t-SNE doesn't care about up/down orientation.
    const yScale = scaleLinear()
      .domain([bounds.minY, bounds.maxY])
      .range([20, height - 20]);

    // B. Clear Canvas
    ctx.clearRect(0, 0, width, height);
    
    // C. Draw "Space" Grid (Subtle)
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)'; // Slate-700 low opacity
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Vertical lines
    for (let i = 50; i < width; i += 100) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    // Horizontal lines
    for (let i = 50; i < height; i += 100) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // D. Draw Particles (Stocks)
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        // Color based on Sentiment
        let color = '#38bdf8'; // Default Blue
        if (stock.sentiment > 0.15) color = '#22c55e'; // Green
        if (stock.sentiment < -0.15) color = '#ef4444'; // Red

        // Velocity Effect: High velocity = Larger Radius
        // We dampen the velocity factor to keep dots readable
        const radius = Math.max(3, Math.min(12, 3 + (stock.velocity || 0) * 1.5)); 
        
        // Draw Glow for high velocity items
        if (stock.velocity > 2) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset for text

        // Draw Label if Hovered or High Momentum
        // Also draw label if it's the selected node (optional logic)
        if (stock.velocity > 3 || hoveredNode?.ticker === stock.ticker) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = '10px "JetBrains Mono"';
            ctx.fillText(stock.ticker, x + 10, y + 4);
        }
    });

  }, [currentFrameData, dimensions, hoveredNode, bounds]);

  // Interaction Handler (Click)
  const handleCanvasClick = (e) => {
    if (!onNodeClick || !currentFrameData) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xScale = scaleLinear().domain([bounds.minX, bounds.maxX]).range([20, dimensions.width - 20]);
    const yScale = scaleLinear().domain([bounds.minY, bounds.maxY]).range([20, dimensions.height - 20]);

    let closest = null;
    let minDist = 20; // 20px hit radius

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
      
      {/* Header / Controls */}
      <div className="panel-header p-4 border-b border-[var(--border)] bg-[rgba(15,23,42,0.6)] backdrop-blur-md z-10 flex justify-between items-center">
        
        {/* Left: Identity */}
        <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-100 tracking-wider">MARKET GALAXY</span>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">PHYSICS ENGINE</span>
        </div>

        {/* Right: Date & Navigation */}
        <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-accent font-bold tracking-widest">
              {currentDate || "LOADING..."}
            </span>

            <div className="flex items-center gap-1 bg-slate-800 rounded p-1 border border-slate-700">
                <button 
                  onClick={controls.stepBack}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="w-[1px] h-4 bg-slate-700 mx-1"></div>
                <button 
                  onClick={controls.stepForward}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                  title="Next Day"
                >
                  <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* The Canvas */}
      <div className="flex-1 relative cursor-crosshair bg-[var(--bg-app)]">
        <canvas 
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onClick={handleCanvasClick}
            className="block w-full h-full"
        />
      </div>

      {/* Timeline Slider (Optional but good for context) */}
      <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg-panel)]">
        <input 
            type="range" 
            min="0" 
            max={Math.max(0, timeline.length - 1)} 
            value={currentDateIndex} 
            onChange={(e) => controls.seek(Number(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
        />
      </div>
    </div>
  );
};

export default MarketGalaxy;
