import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useMarketPhysics } from '../hooks/useMarketPhysics';
import { scaleLinear } from 'd3-scale';
import { ChevronLeft, ChevronRight, Play, Pause, Activity } from 'lucide-react';

const MarketGalaxy = ({ data, onNodeClick }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredNode, setHoveredNode] = useState(null);

  const { 
    currentDate, 
    currentFrameData, 
    controls 
  } = useMarketPhysics(data);

  // --- Dynamic Scaling ---
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
    const paddingX = xSpan * 0.15;
    const paddingY = ySpan * 0.15;

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY
    };
  }, [currentFrameData]);

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

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;
    const pixelRatio = window.devicePixelRatio || 1;

    // Theme Colors (Hardcoded to match styles.css)
    const colorBlue = '#38bdf8';   
    const colorGreen = '#22c55e';
    const colorRed = '#ef4444';
    const colorTextMain = '#f8fafc';
    const colorGrid = 'rgba(192, 132, 252, 0.15)'; // Purple Grid

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, width]); 
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, height]);

    // Clear
    ctx.clearRect(0, 0, width, height);
    
    // Grid
    ctx.strokeStyle = colorGrid; 
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i < width; i += 100) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
    for (let i = 0; i < height; i += 100) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
    ctx.stroke();

    // Particles
    Object.values(currentFrameData).forEach(stock => {
        const x = xScale(stock.x);
        const y = yScale(stock.y);
        
        let color = colorBlue;
        if (stock.sentiment > 0.15) color = colorGreen;
        if (stock.sentiment < -0.15) color = colorRed;
        
        const radius = Math.max(3, Math.min(8, 3 + (stock.velocity || 0))); 

        if (stock.velocity > 2 || hoveredNode?.ticker === stock.ticker) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0; 

        if (hoveredNode?.ticker === stock.ticker || stock.velocity > 2) {
            ctx.fillStyle = colorTextMain;
            ctx.font = '700 11px "JetBrains Mono"';
            ctx.fillText(stock.ticker, x + 12, y + 4);
        }
    });

  }, [currentFrameData, dimensions, hoveredNode, frameBounds]);

  const handleCanvasClick = (e) => {
    if (!onNodeClick || !currentFrameData) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xScale = scaleLinear().domain([frameBounds.minX, frameBounds.maxX]).range([0, dimensions.width]);
    const yScale = scaleLinear().domain([frameBounds.minY, frameBounds.maxY]).range([0, dimensions.height]);

    let closest = null;
    let minDist = 30; 

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
    <div className="panel h-full flex flex-col p-0" ref={containerRef} style={{ borderRadius: 'inherit' }}>
      
      {/* HEADER: Flex-wrap allows controls to drop below title on very small phones */}
      <div className="panel-header flex flex-wrap gap-2" style={{ margin: 0, padding: '12px 16px', borderBottom: '1px solid rgba(192, 132, 252, 0.2)' }}>
        <div className="panel-header-identity">
            <span className="panel-title text-purple-300">MARKET GALAXY</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(192,132,252,0.15)] text-[#e879f9] border border-[rgba(192,132,252,0.3)]">
              PHYSICS
            </span>
        </div>
        
        {/* Controls: Always aligned right or spread on mobile */}
        <div className="panel-header-controls ml-auto gap-3">
            <span className="text-xs md:text-sm font-mono text-[#e879f9] shadow-purple-500/50 drop-shadow-sm">
              {currentDate || "LOADING..."}
            </span>

            <div className="map-controls-group" style={{ position: 'static' }}>
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

      <div className="chart-content-area relative cursor-crosshair bg-app">
        <canvas 
            ref={canvasRef}
            style={{ width: '100%', height: '100%' }}
            onClick={handleCanvasClick}
            className="block"
        />
        {!hoveredNode && (
            <div className="map-empty-state-hint" style={{ bottom: '16px', top: 'auto', right: 'auto', left: '16px', borderColor: 'rgba(192, 132, 252, 0.3)' }}>
                <div className="hint-text text-purple-200">
                    <Activity size={12} className="text-[#e879f9]" />
                    <span>SELECT A PARTICLE</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default MarketGalaxy;
