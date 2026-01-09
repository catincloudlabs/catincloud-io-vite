import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';
import { ChevronLeft, ChevronRight, Play, Pause, Activity, Maximize2 } from 'lucide-react';

const MarketGalaxy = ({ data, onNodeClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);

  const { 
    currentDate, 
    currentFrameData, 
    controls 
  } = useMarketPhysics(data);

  // --- 1. Bounds Calculation ---
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

    // 20% Padding for "Breathing Room"
    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;
    return {
      minX: minX - xSpan * 0.2,
      maxX: maxX + xSpan * 0.2,
      minY: minY - ySpan * 0.2,
      maxY: maxY + ySpan * 0.2
    };
  }, [currentFrameData]);

  // --- 2. Resize Observer (Responsive Canvas) ---
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- 3. HIGH-DPI RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual canvas size to handle High DPI (Retina)
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    
    // Scale context to match
    ctx.scale(dpr, dpr);
    
    // Get Theme Colors from CSS Variables for perfect match
    const style = getComputedStyle(document.body);
    const cAccent = style.getPropertyValue('--accent').trim() || '#38bdf8';
    const cGreen = style.getPropertyValue('--green').trim() || '#22c55e';
    const cRed = style.getPropertyValue('--red').trim() || '#ef4444';
    const cText = style.getPropertyValue('--text-main').trim() || '#f8fafc';
    const cMuted = style.getPropertyValue('--text-muted').trim() || '#94a3b8';

    const { width, height } = dimensions;

    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, width]); 
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, height]);

    // A. Clear & Grid
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.15)'; // Very subtle grid
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Dynamic Grid based on width
    const step = width > 600 ? 100 : 50; 
    for (let i = 0; i <= width; i += step) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    for (let i = 0; i <= height; i += step) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // B. Draw Particles
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        let color = cAccent; 
        if (stock.sentiment > 0.15) color = cGreen;
        if (stock.sentiment < -0.15) color = cRed;
        
        // Base radius
        const radius = 3.5; 
        
        // Interaction State
        const isHovered = hoveredNode?.ticker === stock.ticker;
        
        // Glow/Shadow for active nodes
        if (isHovered) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
          ctx.fillStyle = '#ffffff'; // White center highlight
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = color;
        }

        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 6 : radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // RESET SHADOW for text
        ctx.shadowBlur = 0;

        // C. Draw Labels (Clean: Only on Hover or High Velocity)
        // This prevents the "wall of text" issue.
        if (isHovered) {
            ctx.font = 'bold 12px "JetBrains Mono", monospace';
            ctx.fillStyle = cText;
            ctx.fillText(stock.ticker, x + 10, y + 4);
            
            // Draw connector line
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.moveTo(x, y);
            ctx.lineTo(x + 8, y);
            ctx.stroke();
        }
    });

  }, [currentFrameData, dimensions, hoveredNode, frameBounds]);

  // Handle Clicks
  const handleInteraction = (clientX, clientY) => {
    if (!onNodeClick || !currentFrameData || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, dimensions.width]);
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, dimensions.height]);

    let closest = null;
    let minDist = 20; 

    Object.values(currentFrameData).forEach(stock => {
        const sx = xScale(stock.x);
        const sy = yScale(stock.y);
        const dist = Math.hypot(x - sx, y - sy);
        if (dist < minDist) {
            closest = stock;
            minDist = dist;
        }
    });

    if (closest) {
        onNodeClick(closest);
        setHoveredNode(closest);
    } else {
        setHoveredNode(null);
    }
  };

  return (
    <div className="panel h-full flex flex-col p-0 overflow-hidden relative">
      
      {/* 1. Header (Integrated with styles.css) */}
      <div className="panel-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="panel-header-identity">
            <span className="panel-title">MARKET GALAXY</span>
            <span className="tag tag-blue">PHYSICS ENGINE</span>
        </div>
        
        <div className="panel-header-controls gap-4">
            <span className="text-sm font-mono text-accent" style={{ letterSpacing: '0.05em' }}>
              {currentDate || "INITIALIZING"}
            </span>

            {/* Controls using your CSS utility classes */}
            <div className="flex items-center gap-1 bg-[var(--bg-app)] border border-[var(--border)] rounded-md p-1">
                <button onClick={controls.stepBack} className="panel-toggle-btn hover:text-white" title="Prev Day">
                  <ChevronLeft size={16} />
                </button>
                <div className="vertical-divider h-3 mx-1"></div>
                <button onClick={() => controls.setIsPlaying(!controls.isPlaying)} className={`panel-toggle-btn ${controls.isPlaying ? 'text-accent' : 'text-muted'}`} title="Play/Pause">
                  {controls.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <div className="vertical-divider h-3 mx-1"></div>
                <button onClick={controls.stepForward} className="panel-toggle-btn hover:text-white" title="Next Day">
                  <ChevronRight size={16} />
                </button>
            </div>
        </div>
      </div>

      {/* 2. Canvas Area */}
      <div 
        ref={containerRef} 
        className="flex-1 relative cursor-crosshair bg-[var(--bg-app)]"
        style={{ minHeight: 0 }} // Flexbox safety
      >
        <canvas 
            ref={canvasRef}
            // CSS width/height must be 100% to fill container
            style={{ width: '100%', height: '100%', display: 'block' }}
            onMouseMove={(e) => handleInteraction(e.clientX, e.clientY)}
            onClick={(e) => handleInteraction(e.clientX, e.clientY)}
        />
        
        {/* Subtle Hint */}
        {!hoveredNode && (
            <div className="absolute bottom-6 left-6 pointer-events-none opacity-60">
                <div className="flex items-center gap-2 text-[10px] text-muted font-mono bg-[var(--bg-panel)] border border-[var(--border)] px-3 py-1.5 rounded-full">
                    <Activity size={12} className="text-accent" />
                    <span>HOVER TO INSPECT • CLICK TO LOCK</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MarketGalaxy;
