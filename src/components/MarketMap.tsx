// src/components/MarketMap.tsx

import React, { useMemo, useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, PolygonLayer, PathLayer, LineLayer, TextLayer } from '@deck.gl/layers'; 
import { PathStyleExtension } from '@deck.gl/extensions'; 
import { OrthographicView } from '@deck.gl/core';
import { Delaunay } from 'd3-delaunay';
import { GraphConnection } from '../hooks/useKnowledgeGraph'; 
// Import sector labels for the tooltip
import { getSectorLabel } from '../utils/sectorMap';

export type SectorNode = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  count: number;
};

export type HydratedNode = {
  ticker: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  headline: string;
  sentiment: number;
  sector?: string; 
};

export type MarketFrame = {
  date: string;
  nodes: HydratedNode[];
  sectors: SectorNode[]; 
  nodeMap: Map<string, HydratedNode>;
};

interface MarketMapProps {
  data: MarketFrame;
  history?: MarketFrame[];
  onNodeClick?: (node: HydratedNode) => void;
  onBackgroundClick?: () => void;
  selectedTicker?: string | null;         
  graphConnections?: GraphConnection[];   
}

// Mobile Detection
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

// --- VISUAL IDENTITY SYSTEM ---
const THEME = {
  mint: [52, 211, 153],       
  red: [239, 68, 68],         
  slate: [148, 163, 184],     
  gold: [251, 191, 36],       
  glass: [255, 255, 255],
  darkText: [255, 255, 255, 180] 
};

export function MarketMap({ data, history, onNodeClick, onBackgroundClick, selectedTicker, graphConnections }: MarketMapProps) {
  
  // --- 1. HEARTBEAT SYSTEM ---
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 3000); 
    return () => clearInterval(interval);
  }, []);

  // --- 2. INTERACTION STATE ---
  const [hoverInfo, setHoverInfo] = useState<{
    object?: HydratedNode;
    x: number;
    y: number;
  } | null>(null);

  // --- NEW: DRAG STATE FOR MOBILE TOOLTIP ---
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  // Reset drag when the target object changes
  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [hoverInfo?.object?.ticker]);

  // --- 3. SMART VIEWPORT CALCULATION (Auto-Fit) ---
  const initialViewState = useMemo(() => {
    if (!data?.nodes?.length) return { target: [0, 0, 0], zoom: 1 };

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let totalEnergy = 0;
    let weightedSumX = 0;
    let weightedSumY = 0;

    data.nodes.forEach(n => {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;

        const weight = n.energy + 1; 
        weightedSumX += n.x * weight;
        weightedSumY += n.y * weight;
        totalEnergy += weight;
    });

    const centerX = totalEnergy > 0 ? weightedSumX / totalEnergy : 0;
    const centerY = totalEnergy > 0 ? weightedSumY / totalEnergy : 0;

    const PADDING = 100; 
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const dataWidth = Math.max(maxX - minX, 100); 
    const dataHeight = Math.max(maxY - minY, 100);

    const scaleX = (screenWidth - PADDING) / dataWidth;
    const scaleY = (screenHeight - PADDING) / dataHeight;
    const fitScale = Math.min(scaleX, scaleY);
    const autoZoom = Math.log2(fitScale);

    return {
      target: [centerX, centerY, 0],
      zoom: Math.max(isMobile ? 0.2 : 0.5, Math.min(autoZoom, 4)),
      minZoom: isMobile ? 0.2 : 0.5,
      maxZoom: 15
    };
  }, [data]); 

  // --- 4. METRICS ---
  const { maxEnergy, highEnergyThreshold } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) return { maxEnergy: 0, highEnergyThreshold: 0 };
    const energies = data.nodes.map(n => n.energy);
    const max = Math.max(...energies);
    
    return { 
        maxEnergy: max, 
        highEnergyThreshold: max * 0.15
    };
  }, [data]);

  // --- 5. DATA MEMOS ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];
    
    const cleanNodes = data.nodes.filter(n => {
        if (n.ticker.includes('.WS')) return false;
        if (n.ticker.includes('p')) return false;
        return true;
    });

    return [...cleanNodes].sort((a, b) => {
      if (a.ticker === selectedTicker) return 1;
      const aConn = graphConnections?.some(c => c.target === a.ticker);
      const bConn = graphConnections?.some(c => c.target === b.ticker);
      if (aConn && !bConn) return 1;
      if (!aConn && bConn) return -1;
      return a.energy - b.energy;
    });
  }, [data, selectedTicker, graphConnections]);

  const trailData = useMemo(() => {
    if (!history || !data) return [];
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];

    const LOOKBACK_FRAMES = 5; 
    const lookback = Math.max(0, currentIndex - LOOKBACK_FRAMES);
    const recentHistory = history.slice(lookback, currentIndex + 1);

    const activeTickers = new Set(
      data.nodes
        .filter(n => n.energy > highEnergyThreshold || n.ticker === selectedTicker) 
        .map(n => n.ticker)
    );

    const pathsByTicker: Record<string, number[][]> = {};
    const dist = (p1: number[], p2: number[]) => 
       Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));

    recentHistory.forEach(frame => {
      frame.nodes.forEach(node => {
        if (activeTickers.has(node.ticker)) {
          if (!pathsByTicker[node.ticker]) {
             pathsByTicker[node.ticker] = [[node.x, node.y]];
          } else {
             const path = pathsByTicker[node.ticker];
             const lastPoint = path[path.length - 1];
             const currentPoint = [node.x, node.y];
             if (dist(lastPoint, currentPoint) > 2) {
                 path.push(currentPoint);
             }
          }
        }
      });
    });

    return Object.keys(pathsByTicker)
        .filter(t => pathsByTicker[t].length > 1)
        .map(ticker => ({
            ticker,
            path: pathsByTicker[ticker],
            sentiment: data.nodes.find(n => n.ticker === ticker)?.sentiment || 0
        }));
  }, [data, history, selectedTicker, highEnergyThreshold]);

  const vectorData = useMemo(() => {
    if (!data?.nodes) return [];
    return data.nodes
      .filter(n => n.energy > highEnergyThreshold || n.ticker === selectedTicker)
      .map(n => ({
        ticker: n.ticker,
        path: [[n.x, n.y], [n.x + n.vx, n.y + n.vy]], 
        energy: n.energy,
        sentiment: n.sentiment
      }));
  }, [data, highEnergyThreshold, selectedTicker]);

  const synapseData = useMemo(() => {
    if (!selectedTicker || !graphConnections || !data) return [];
    const sourceNode = data.nodes.find(n => n.ticker === selectedTicker);
    if (!sourceNode) return [];

    return graphConnections.map(conn => {
      const targetNode = data.nodes.find(n => n.ticker === conn.target);
      if (!targetNode) return null;
      return {
        from: [sourceNode.x, sourceNode.y],
        to: [targetNode.x, targetNode.y],
        strength: conn.strength
      };
    }).filter(Boolean);
  }, [selectedTicker, graphConnections, data]);

  const voronoiData = useMemo(() => {
    if (!sortedNodes || sortedNodes.length < 3) return [];
    const points = sortedNodes.map(d => [d.x, d.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([-400, -400, 400, 400]);
    
    const polygons = Array.from(voronoi.cellPolygons());
    return polygons.map((polygon: any, i: number) => ({
      polygon,
      node: sortedNodes[i]
    }));
  }, [sortedNodes]);

  const sectorLayerData = useMemo(() => {
    if (!data?.sectors) return [];
    return data.sectors.filter(s => s.count > 2); 
  }, [data]);

  const accessibleSummary = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes]
        .sort((a, b) => b.energy - a.energy)
        .slice(0, 5)
        .map(n => `${n.ticker}: Energy ${n.energy.toFixed(0)}`);
  }, [data]);

  if (!data) return null;

  // --- LAYERS ----------------------------------------------------------------

  const sectorBgLayer = new ScatterplotLayer({
    id: 'sector-centers',
    data: sectorLayerData,
    getPosition: (d: SectorNode) => [d.x, d.y],
    getRadius: (d: SectorNode) => Math.sqrt(d.energy) * 10 + 20, 
    getFillColor: [0, 0, 0, 0], 
    stroked: true,
    getLineColor: [...THEME.slate, 40], 
    getLineWidth: 1,
    lineWidthUnits: 'pixels',
  });

  const sectorTextLayer = new TextLayer({
    id: 'sector-labels',
    data: sectorLayerData,
    getPosition: (d: SectorNode) => [d.x, d.y],
    getText: (d: SectorNode) => d.id,
    getSize: 14,
    getColor: [...THEME.slate, 120],
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    fontFamily: '"Geist Mono", monospace',
    fontWeight: 600
  });

  const cellLayer = new PolygonLayer({
    id: 'voronoi-cells',
    data: voronoiData,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => {
      const s = d.node.sentiment;
      if (s > 0.1) return [...THEME.mint, 10]; 
      if (s < -0.1) return [...THEME.red, 10];  
      return [0, 0, 0, 0]; 
    },
    stroked: true,
    getLineColor: [...THEME.slate, 15], 
    getLineWidth: 1,
    lineWidthUnits: 'pixels',
    pickable: false,
    getDashArray: [2, 5], 
    dash: true,
    extensions: [new PathStyleExtension({ dash: true })]
  });

  const vectorLayer = new PathLayer({
    id: 'momentum-vectors',
    data: vectorData,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
        const isSelected = d.ticker === selectedTicker;
        const isNeutral = Math.abs(d.sentiment) <= 0.1;

        if (isSelected) {
            return d.sentiment >= 0 ? [...THEME.mint, 255] : [...THEME.red, 255];
        }
        if (!isNeutral) {
            return d.sentiment > 0 ? [...THEME.mint, 100] : [...THEME.red, 100];
        }
        return [...THEME.slate, 30]; 
    },
    getWidth: 1.5,
    widthUnits: 'pixels',
    capRounded: true,
    getDashArray: [6, 4], 
    dash: true,           
    extensions: [new PathStyleExtension({ dash: true })],
    updateTriggers: { getColor: [selectedTicker] }
  });

  const trailLayer = new PathLayer({
    id: 'market-trails',
    data: trailData,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
        const isSelected = d.ticker === selectedTicker;
        const alpha = isSelected ? 180 : 25;
        const slateAlpha = isSelected ? 120 : 10;
        if (d.sentiment > 0.1) return [...THEME.mint, alpha]; 
        if (d.sentiment < -0.1) return [...THEME.red, alpha];
        return [...THEME.slate, slateAlpha];
    },
    getWidth: (d: any) => d.ticker === selectedTicker ? 2.0 : 0.5,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: 1,
    transitions: { getColor: 1000, getWidth: 1000 },
    updateTriggers: { getColor: [selectedTicker], getWidth: [selectedTicker] }
  });

  const synapseLayer = new LineLayer({
    id: 'graph-synapses',
    data: synapseData,
    getSourcePosition: (d: any) => d.from,
    getTargetPosition: (d: any) => d.to,
    getColor: [...THEME.gold, 120], 
    getWidth: (d: any) => Math.min(2.5, 1.0 + (d.strength * 0.1)), 
    widthUnits: 'pixels',
    updateTriggers: { getWidth: [graphConnections], getColor: [graphConnections] }
  });

  const glowLayer = new ScatterplotLayer({
    id: 'market-glow',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common',
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 18; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 10; 
        return 0; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 40]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 40]; 
        return [0,0,0,0];
    },
    stroked: false,
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections],
        getFillColor: [selectedTicker, graphConnections]
    },
    transitions: { getRadius: 500, getFillColor: 500 }
  });

  const dotLayer = new ScatterplotLayer({
    id: 'market-particles',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 6.0; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.0; 
        if (d.energy > highEnergyThreshold) return 1.8; 
        return 1.2; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.glass, 255]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 255]; 
        if (d.sentiment > 0.1) return [...THEME.mint, 200];   
        if (d.sentiment < -0.1) return [...THEME.red, 200];  
        return [...THEME.slate, 180]; 
    },
    stroked: true,
    getLineWidth: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return pulse ? 2 : 0.5; 
        if (d.energy > highEnergyThreshold) return 1.0; 
        return 0; 
    },
    getLineColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 180];
        if (d.energy > highEnergyThreshold) return [...THEME.glass, 200];
        return [0, 0, 0, 0];
    },
    lineWidthUnits: 'common',
    pickable: true,
    autoHighlight: true,
    highlightColor: [...THEME.mint, 100],
    transitions: {
        getLineWidth: 1000, 
        getLineColor: 1000,
        getRadius: 1000
    },
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections, highEnergyThreshold],
        getFillColor: [selectedTicker, graphConnections],
        getLineWidth: [maxEnergy, pulse, selectedTicker, highEnergyThreshold], 
        getLineColor: [maxEnergy, pulse, selectedTicker, highEnergyThreshold] 
    },
  });

  // --- RENDER TOOLTIP (SMART POSITIONING + DRAGGABLE ON MOBILE) ---
  const renderTooltip = () => {
    if (!hoverInfo || !hoverInfo.object) return null;

    const { object, x, y } = hoverInfo;
    
    // Desktop smart positioning logic
    const isRightSide = typeof window !== 'undefined' && x > window.innerWidth * 0.7;
    
    // Mobile logic: Use dragged position or initial click
    const mobileX = x + dragOffset.x;
    const mobileY = y + dragOffset.y;

    const tooltipStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 9999, // Ensure it's on top of AgentPanel
        // If mobile, allow pointer events for dragging
        pointerEvents: isMobile ? 'auto' : 'none',
        
        // Conditional Positioning
        left: isMobile ? mobileX : (isRightSide ? 'auto' : x + 20),
        right: isMobile ? 'auto' : (isRightSide ? (window.innerWidth - x) + 20 : 'auto'),
        top: isMobile ? mobileY : y,
        
        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(148, 163, 184, 0.2)', 
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        color: 'white',
        minWidth: '200px',
        maxWidth: '300px',
        // Smoother transform for dragging
        transform: isMobile ? 'translate(-50%, -100%)' : 'none', 
        marginTop: isMobile ? -20 : 0 // Lift finger clearance
    };

    // Touch handlers for dragging
    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        dragStartRef.current = { x: touch.clientX, y: touch.clientY };
        initialOffsetRef.current = { ...dragOffset };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!dragStartRef.current) return;
        const touch = e.touches[0];
        const deltaX = touch.clientX - dragStartRef.current.x;
        const deltaY = touch.clientY - dragStartRef.current.y;
        
        setDragOffset({
            x: initialOffsetRef.current.x + deltaX,
            y: initialOffsetRef.current.y + deltaY
        });
        e.stopPropagation(); // Prevent map pan
    };

    const handleTouchEnd = () => {
        dragStartRef.current = null;
    };

    return (
        <div 
            style={tooltipStyle} 
            className="map-tooltip-container"
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchMove={isMobile ? handleTouchMove : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
        >
            {/* Mobile Drag Handle */}
            {isMobile && (
                <div style={{
                    width: '40px', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', 
                    borderRadius: '2px', margin: '0 auto 12px auto' 
                }} />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', color: `rgb(${THEME.mint.join(',')})` }}>
                    ${object.ticker}
                </span>
                <span style={{ fontSize: '0.8rem', color: `rgba(${THEME.slate.join(',')}, 0.8)` }}>
                    {getSectorLabel(object.sector || "Other")}
                </span>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '8px', lineHeight: '1.4' }}>
                {object.headline || "No active headline"}
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: `rgba(${THEME.slate.join(',')}, 0.7)` }}>
                 <span>E: <span style={{color: 'white'}}>{object.energy.toFixed(0)}</span></span>
                 <span>Sent: <span style={{color: object.sentiment > 0 ? '#34d399' : object.sentiment < 0 ? '#f87171' : 'white'}}>
                    {object.sentiment.toFixed(2)}
                 </span></span>
            </div>
        </div>
    );
  };

  return (
    <>
        <div className="sr-only" aria-live="polite">
            <h3>Market Physics Summary</h3>
            <ul>{accessibleSummary.map((str, i) => <li key={i}>{str}</li>)}</ul>
        </div>

        <DeckGL
            views={new OrthographicView({ controller: true })}
            initialViewState={initialViewState}
            controller={true}
            layers={[
                cellLayer, sectorBgLayer, sectorTextLayer, 
                vectorLayer, trailLayer, glowLayer, synapseLayer, dotLayer
            ]} 
            style={{ backgroundColor: 'transparent' }} 
            onHover={setHoverInfo}
            // Disable default tooltip
            getTooltip={null} 
            onClick={(info: any) => {
                if (info.object) {
                    if (info.object.ticker && onNodeClick) {
                         onNodeClick(info.object);
                    }
                } else {
                    if (onBackgroundClick) onBackgroundClick();
                }
            }}
        />
        {/* Render Custom Tooltip */}
        {renderTooltip()}
    </>
  );
}
