import React, { useRef, useEffect, useState } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';

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

  // Handle Resize
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
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    // 1. Setup Scales (Fit t-SNE coordinates to Canvas)
    // Adjust domain based on your actual t-SNE output range (e.g., -50 to 50)
    const xScale = scaleLinear().domain([-150, 150]).range([50, width - 50]);
    const yScale = scaleLinear().domain([-150, 150]).range([50, height - 50]);

    // 2. Clear Canvas
    ctx.clearRect(0, 0, width, height);
    
    // 3. Draw "Space" Background (Grid)
    ctx.strokeStyle = '#334155'; // var(--border)
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    // Simple Grid
    for (let i = 0; i < width; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    for (let i = 0; i < height; i += 50) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // 4. Draw Particles (Stocks)
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        // Color based on Sentiment (Red/Green/Blue)
        let color = '#38bdf8'; // Default Blue (Neutral)
        if (stock.sentiment > 0.2) color = '#22c55e'; // Green
        if (stock.sentiment < -0.2) color = '#ef4444'; // Red

        // Velocity Effect: High velocity = Larger Halo
        const radius = Math.max(3, Math.min(8, stock.velocity * 2)); 
        
        // Draw Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // Draw Label if Hovered or High Momentum
        if (stock.velocity > 5 || hoveredNode?.ticker === stock.ticker) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = '10px "JetBrains Mono"';
            ctx.fillText(stock.ticker, x + 8, y + 3);
        }
    });

  }, [currentFrameData, dimensions, hoveredNode]);

  // Interaction Handler
  const handleCanvasClick = (e) => {
    if (!onNodeClick || !currentFrameData) return;
    
    // Simple hit detection (find closest node)
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Use same scales as render
    const xScale = scaleLinear().domain([-150, 150]).range([50, dimensions.width - 50]);
    const yScale = scaleLinear().domain([-150, 150]).range([50, dimensions.height - 50]);

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
    <div className="panel h-tall relative flex flex-col" ref={containerRef}>
      
      {/* Header / Controls */}
      <div className="panel-header">
        <div className="panel-header-identity">
            <span className="panel-title">MARKET GALAXY</span>
            <span className="tag tag-blue">PHYSICS ENGINE</span>
        </div>
        <div className="flex gap-4 items-center">
            <span className="text-sm font-mono text-accent">{currentDate}</span>
            <button 
                onClick={() => controls.setIsPlaying(!controls.isPlaying)}
                className="map-control-btn"
            >
                {controls.isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
        </div>
      </div>

      {/* The Canvas */}
      <div className="flex-1 relative cursor-crosshair">
        <canvas 
            ref={canvasRef}
            width={dimensions.width}
            height={dimensions.height}
            onClick={handleCanvasClick}
            className="w-full h-full block"
        />
      </div>

      {/* Timeline Slider */}
      <div className="p-4 border-t border-[var(--border)]">
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
