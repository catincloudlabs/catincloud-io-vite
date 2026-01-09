import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';
import { ChevronLeft, ChevronRight, Play, Pause, Activity, MousePointer2 } from 'lucide-react';

const MarketGalaxy = ({ data, onNodeClick }) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
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

    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;
    return {
      minX: minX - xSpan * 0.15,
      maxX: maxX + xSpan * 0.15,
      minY: minY - ySpan * 0.15,
      maxY: maxY + ySpan * 0.15
    };
  }, [currentFrameData]);

  // --- 2. Robust Resize Logic ---
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      // Wrap in AnimationFrame to prevent loop error
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) return;
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- 3. Render Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // A. Grab Theme Colors (Exact Match)
    const style = getComputedStyle(document.body);
    const cAccent = style.getPropertyValue('--accent').trim();
    const cGreen = style.getPropertyValue('--green').trim();
    const cRed = style.getPropertyValue('--red').trim();
    const cText = style.getPropertyValue('--text-main').trim();
    const cBorder = style.getPropertyValue('--border').trim();

    // B. Setup Canvas (High-DPI)
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = dimensions;
    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, width]); 
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, height]);

    // C. Clear & Grid
    ctx.clearRect(0, 0, width, height);
    
    // Grid Lines (Subtle Tech Look)
    ctx.strokeStyle = cBorder; 
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2; 
    ctx.beginPath();
    for (let i = 0; i <= width; i += 100) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    for (let i = 0; i <= height; i += 100) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // D. Particles
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        let color = cAccent; 
        if (stock.sentiment > 0.15) color = cGreen;
        if (stock.sentiment < -0.15) color = cRed;
        
        const isHovered = hoveredNode?.ticker === stock.ticker;
        const isFast = stock.velocity > 4;
        
        // Dynamic Radius
        const radius = isHovered ? 6 : Math.max(3, Math.min(5, 3 + (stock.velocity || 0))); 

        // Glow
        if (isHovered || isFast) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? '#fff' : color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // E. Labels (Clean)
        if (isHovered || isFast) {
            ctx.fillStyle = cText;
            ctx.font = isHovered ? 'bold 12px "JetBrains Mono"' : '10px "JetBrains Mono"';
            
            // Offset label
            ctx.fillText(stock.ticker, x + 10, y + 4);
            
            // Tech Line
            if (isHovered) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + 8, y + 2);
                ctx.stroke();
            }
        }
    });

  }, [currentFrameData, dimensions, hoveredNode, frameBounds]);

  // Handle Interactions
  const handleInteraction = (e) => {
    if (!onNodeClick || !currentFrameData || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

    if (e.type === 'click' && closest) {
        onNodeClick(closest);
    }
    setHoveredNode(closest);
  };

  return (
    // THE PANEL WRAPPER
    <div className="panel ai-hero-card h-full flex flex-col p-0 overflow-hidden relative">
      
      {/* 1. Header (Strict Theme Compliance) */}
      <div className="panel-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid rgba(192, 132, 252, 0.2)' }}>
        <div className="panel-header-identity">
            <span className="panel-title text-purple-300">MARKET GALAXY</span>
            <span className="tag" style={{ color: '#e879f9', background: 'rgba(192,132,252,0.1)', borderColor: 'rgba(192,132,252,0.3)' }}>
              PHYSICS ENGINE
            </span>
        </div>
        
        {/* Controls */}
        <div className="panel-header-controls gap-3">
            <span className="text-sm font-mono text-[#e879f9]" style={{ textShadow: '0 0 10px rgba(232,121,249,0.3)' }}>
              {currentDate || "SYNC..."}
            </span>

            <div className="flex items-center gap-1">
                <button onClick={controls.stepBack} className="map-control-btn hover:text-[#e879f9] hover:border-[#e879f9]">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => controls.setIsPlaying(!controls.isPlaying)} className={`map-control-btn hover:text-[#e879f9] hover:border-[#e879f9] ${controls.isPlaying ? 'text-[#e879f9] border-[#e879f9]' : ''}`}>
                  {controls.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={controls.stepForward} className="map-control-btn hover:text-[#e879f9] hover:border-[#e879f9]">
                  <ChevronRight size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* 2. Canvas Container (Isolates Layout) */}
      <div className="flex-1 relative min-h-0 bg-[var(--bg-app)]" ref={containerRef}>
        <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block cursor-crosshair"
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
            onMouseLeave={() => setHoveredNode(null)}
        />
        
        {/* Overlay Hint */}
        {!hoveredNode && (
            <div className="absolute bottom-4 left-4 pointer-events-none">
                <div className="flex items-center gap-2 text-[10px] text-muted font-mono opacity-70">
                    <Activity size={12} className="text-[#e879f9]" />
                    <span>SYSTEM READY • SELECT NODE</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MarketGalaxy;
