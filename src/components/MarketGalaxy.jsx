import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';
import { ChevronLeft, ChevronRight, Play, Pause, Activity, MousePointer2 } from 'lucide-react';

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

  // --- 1. Dynamic Camera Bounds ---
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

    // 15% Padding to keep particles away from edges
    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;
    return {
      minX: minX - xSpan * 0.15,
      maxX: maxX + xSpan * 0.15,
      minY: minY - ySpan * 0.15,
      maxY: maxY + ySpan * 0.15
    };
  }, [currentFrameData]);

  // --- 2. Robust Resize Observer ---
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use contentRect for precise sub-pixel measurements
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- 3. The "Engine Room" Render Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    // Don't render if dimensions are zero (initial load)
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // A. Grab Theme Colors directly from CSS Variables
    const style = getComputedStyle(document.body);
    const cAccent = style.getPropertyValue('--accent').trim();
    const cGreen = style.getPropertyValue('--green').trim();
    const cRed = style.getPropertyValue('--red').trim();
    const cText = style.getPropertyValue('--text-main').trim();
    const cBorder = style.getPropertyValue('--border').trim();
    // Darker BG for the "void" effect, matching .panel
    const cBg = style.getPropertyValue('--bg-panel').trim(); 

    // B. High-DPI Scaling (Sharpness Fix)
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const { width, height } = dimensions;
    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, width]); 
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, height]);

    // C. Clear & Background
    ctx.clearRect(0, 0, width, height);
    
    // D. Draw Technical Grid
    ctx.strokeStyle = cBorder; 
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3; 
    ctx.beginPath();
    // Vertical Lines
    for (let i = 0; i <= width; i += 100) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    // Horizontal Lines
    for (let i = 0; i <= height; i += 100) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // E. Draw Particles
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        let color = cAccent;
        if (stock.sentiment > 0.15) color = cGreen;
        if (stock.sentiment < -0.15) color = cRed;
        
        // Dynamic Size based on velocity (Momentum)
        const radius = Math.max(3, Math.min(6, 3 + (stock.velocity || 0))); 
        const isHovered = hoveredNode?.ticker === stock.ticker;
        const isOutlier = stock.velocity > 4; // Only label fast movers

        // Glow Effect
        if (isHovered || isOutlier) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 5 : radius, 0, 2 * Math.PI);
        ctx.fillStyle = isHovered ? '#ffffff' : color;
        ctx.fill();
        
        // Reset Shadow for Text
        ctx.shadowBlur = 0;

        // F. Minimalist Labels
        if (isHovered || isOutlier) {
            ctx.fillStyle = cText;
            // Use system mono font stack
            ctx.font = isHovered ? 'bold 11px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
            
            const labelX = x + 10;
            const labelY = y + 4;
            
            ctx.fillText(stock.ticker, labelX, labelY);
            
            // Tech connector line
            if (isHovered) {
              ctx.beginPath();
              ctx.strokeStyle = color;
              ctx.lineWidth = 1;
              ctx.moveTo(x, y);
              ctx.lineTo(labelX - 2, y);
              ctx.stroke();
            }
        }
    });

  }, [currentFrameData, dimensions, hoveredNode, frameBounds]);

  // Interaction Logic
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
    // Always update hover state
    setHoveredNode(closest);
  };

  return (
    <div className="panel h-full flex flex-col p-0 overflow-hidden relative">
      
      {/* HEADER: Strictly follows styles.css .panel-header */}
      <div className="panel-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="panel-header-identity">
            <span className="panel-title">MARKET GALAXY</span>
            <span className="tag tag-blue">PHYSICS ENGINE</span>
        </div>
        
        <div className="panel-header-controls">
            {/* Playback Controls */}
            <div className="flex items-center gap-2 mr-4">
                <span className="text-xs font-mono text-accent">
                  {currentDate || "SYNCING..."}
                </span>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={controls.stepBack} className="panel-toggle-btn" title="Rewind">
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => controls.setIsPlaying(!controls.isPlaying)} className={`panel-toggle-btn ${controls.isPlaying ? 'text-accent' : ''}`} title="Play/Pause">
                  {controls.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button onClick={controls.stepForward} className="panel-toggle-btn" title="Advance">
                  <ChevronRight size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* CANVAS CONTAINER: Isolate from Flexbox Loop */}
      <div className="flex-1 relative min-h-0 bg-app" ref={containerRef}>
        <canvas 
            ref={canvasRef}
            className="absolute inset-0 w-full h-full block cursor-crosshair"
            onMouseMove={handleInteraction}
            onClick={handleInteraction}
            onMouseLeave={() => setHoveredNode(null)}
        />
        
        {/* Subtle Overlay Hint */}
        {!hoveredNode && (
            <div className="absolute bottom-4 left-4 pointer-events-none">
                <div className="flex items-center gap-2 text-[10px] text-muted font-mono opacity-60">
                    <MousePointer2 size={12} />
                    <span>INTERACT TO INSPECT</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MarketGalaxy;
