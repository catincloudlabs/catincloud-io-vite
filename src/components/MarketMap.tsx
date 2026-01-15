// src/components/MarketMap.tsx

import React, { useMemo, useState, useEffect, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, PolygonLayer, PathLayer, LineLayer, TextLayer } from '@deck.gl/layers'; 
import { PathStyleExtension } from '@deck.gl/extensions'; 
import { OrthographicView } from '@deck.gl/core';
import { Delaunay } from 'd3-delaunay';
import { GraphConnection } from '../hooks/useKnowledgeGraph'; 
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
  isPlaying?: boolean;   
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const THEME = {
  mint: [52, 211, 153],       
  red: [239, 68, 68],         
  slate: [148, 163, 184],     
  gold: [251, 191, 36],       
  glass: [255, 255, 255],
  darkText: [255, 255, 255, 180] 
};

export function MarketMap({ 
  data, 
  history, 
  onNodeClick, 
  onBackgroundClick, 
  selectedTicker, 
  graphConnections,
  isPlaying = false 
}: MarketMapProps) {
  
  // --- 1. HEARTBEAT SYSTEM ---
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 3000); 
    return () => clearInterval(interval);
  }, []);

  // --- 2. INTERACTION STATE ---
  const [hoverInfo, setHoverInfo] = useState<{
    object?: HydratedNode;
    x: number;
    y: number;
  } | null>(null);

  const selectedNode = useMemo(() => {
    if (!selectedTicker || !data) return null;
    return data.nodes.find(n => n.ticker === selectedTicker) || null;
  }, [selectedTicker, data]);

  const [selectedPos, setSelectedPos] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (selectedTicker && !selectedPos) {
       const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
       const cy = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
       setSelectedPos({ x: cx, y: cy });
    } else if (!selectedTicker) {
       setSelectedPos(null);
    }
  }, [selectedTicker]);

  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const initialOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);

  useEffect(() => {
    setDragOffset({ x: 0, y: 0 });
  }, [selectedTicker]);

  // --- 3. VIEWPORT ---
  const initialViewState = useMemo(() => {
    if (!data?.nodes?.length) return { target: [0, 0, 0], zoom: 1 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let totalEnergy = 0;
    let weightedSumX = 0;
    let weightedSumY = 0;
    data.nodes.forEach(n => {
        if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
        const weight = n.energy + 1; 
        weightedSumX += n.x * weight; weightedSumY += n.y * weight;
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

  // --- 4. METRICS & MEMOS ---
  const { maxEnergy, highEnergyThreshold } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) return { maxEnergy: 0, highEnergyThreshold: 0 };
    const energies = data.nodes.map(n => n.energy);
    const max = Math.max(...energies);
    return { maxEnergy: max, highEnergyThreshold: max * 0.15 };
  }, [data]);

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
    if (isPlaying || !history || !data) return [];
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];
    const LOOKBACK_FRAMES = 5; 
    const lookback = Math.max(0, currentIndex - LOOKBACK_FRAMES);
    const recentHistory = history.slice(lookback, currentIndex + 1);
    const activeTickers = new Set(data.nodes.filter(n => n.energy > highEnergyThreshold || n.ticker === selectedTicker).map(n => n.ticker));
    const pathsByTicker: Record<string, number[][]> = {};
    const dist = (p1: number[], p2: number[]) => Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    recentHistory.forEach(frame => {
      frame.nodes.forEach(node => {
        if (activeTickers.has(node.ticker)) {
          if (!pathsByTicker[node.ticker]) pathsByTicker[node.ticker] = [[node.x, node.y]];
          else {
             const path = pathsByTicker[node.ticker];
             const lastPoint = path[path.length - 1];
             const currentPoint = [node.x, node.y];
             if (dist(lastPoint, currentPoint) > 2) path.push(currentPoint);
          }
        }
      });
    });
    return Object.keys(pathsByTicker).filter(t => pathsByTicker[t].length > 1).map(ticker => ({
            ticker, path: pathsByTicker[ticker],
            sentiment: data.nodes.find(n => n.ticker === ticker)?.sentiment || 0
    }));
  }, [data, history, selectedTicker, highEnergyThreshold, isPlaying]);

  const vectorData = useMemo(() => {
    if (!data?.nodes) return [];
    return data.nodes.filter(n => n.energy > highEnergyThreshold || n.ticker === selectedTicker).map(n => ({
        ticker: n.ticker, path: [[n.x, n.y], [n.x + n.vx, n.y + n.vy]], energy: n.energy, sentiment: n.sentiment
    }));
  }, [data, highEnergyThreshold, selectedTicker]);

  const synapseData = useMemo(() => {
    if (!selectedTicker || !graphConnections || !data) return [];
    const sourceNode = data.nodes.find(n => n.ticker === selectedTicker);
    if (!sourceNode) return [];
    return graphConnections.map(conn => {
      const targetNode = data.nodes.find(n => n.ticker === conn.target);
      if (!targetNode) return null;
      return { from: [sourceNode.x, sourceNode.y], to: [targetNode.x, targetNode.y], strength: conn.strength };
    }).filter(Boolean);
  }, [selectedTicker, graphConnections, data]);

  const voronoiData = useMemo(() => {
    if (isPlaying || !sortedNodes || sortedNodes.length < 3) return [];
    const points = sortedNodes.map(d => [d.x, d.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([-400, -400, 400, 400]);
    const polygons = Array.from(voronoi.cellPolygons());
    return polygons.map((polygon: any, i: number) => ({ polygon, node: sortedNodes[i] }));
  }, [sortedNodes, isPlaying]);

  const sectorLayerData = useMemo(() => {
    if (!data?.sectors) return [];
    return data.sectors.filter(s => s.count > 2); 
  }, [data]);

  const accessibleSummary = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes].sort((a, b) => b.energy - a.energy).slice(0, 5).map(n => `${n.ticker}: Energy ${n.energy.toFixed(0)}`);
  }, [data]);

  if (!data) return null;

  // --- LAYERS ----------------------------------------------------------------

  const sectorTextLayer = new TextLayer({
    id: 'sector-labels',
    data: sectorLayerData,
    getPosition: (d: SectorNode) => [d.x, d.y],
    getText: (d: SectorNode) => getSectorLabel(d.id).toUpperCase(),
    getSize: 11, // Small, discrete size
    getColor: [...THEME.slate, 180], // Low opacity slate (Ghost effect)
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center',
    fontFamily: '"JetBrains Mono", monospace', 
    fontWeight: 700,
    visible: !isPlaying
  });

  const cellLayer = new PolygonLayer({
    id: 'voronoi-cells', data: voronoiData, getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => {
      const s = d.node.sentiment;
      if (s > 0.1) return [...THEME.mint, 10]; if (s < -0.1) return [...THEME.red, 10]; return [0, 0, 0, 0]; 
    },
    stroked: true, getLineColor: [...THEME.slate, 15], getLineWidth: 1, lineWidthUnits: 'pixels',
    pickable: false, getDashArray: [2, 5], dash: true, extensions: [new PathStyleExtension({ dash: true })],
    visible: !isPlaying, updateTriggers: { getFillColor: [isPlaying] }
  });

  const vectorLayer = new PathLayer({
    id: 'momentum-vectors', data: vectorData, getPath: (d: any) => d.path,
    getColor: (d: any) => {
        const isSelected = d.ticker === selectedTicker;
        const isNeutral = Math.abs(d.sentiment) <= 0.1;
        if (isSelected) return d.sentiment >= 0 ? [...THEME.mint, 255] : [...THEME.red, 255];
        if (!isNeutral) return d.sentiment > 0 ? [...THEME.mint, 100] : [...THEME.red, 100];
        return [...THEME.slate, 30]; 
    },
    getWidth: 1.5, widthUnits: 'pixels', capRounded: true, getDashArray: [6, 4], dash: true,           
    extensions: [new PathStyleExtension({ dash: true })], updateTriggers: { getColor: [selectedTicker] }
  });

  const trailLayer = new PathLayer({
    id: 'market-trails', data: trailData, getPath: (d: any) => d.path,
    getColor: (d: any) => {
        const isSelected = d.ticker === selectedTicker;
        const alpha = isSelected ? 180 : 25; const slateAlpha = isSelected ? 120 : 10;
        if (d.sentiment > 0.1) return [...THEME.mint, alpha]; if (d.sentiment < -0.1) return [...THEME.red, alpha];
        return [...THEME.slate, slateAlpha];
    },
    getWidth: (d: any) => d.ticker === selectedTicker ? 2.0 : 0.5, widthUnits: 'pixels',
    jointRounded: true, capRounded: true, opacity: 1, transitions: { getColor: 1000, getWidth: 1000 },
    updateTriggers: { getColor: [selectedTicker], getWidth: [selectedTicker] }, visible: !isPlaying 
  });

  const synapseLayer = new LineLayer({
    id: 'graph-synapses', data: synapseData, getSourcePosition: (d: any) => d.from, getTargetPosition: (d: any) => d.to,
    getColor: [...THEME.gold, 120], getWidth: (d: any) => Math.min(2.5, 1.0 + (d.strength * 0.1)), widthUnits: 'pixels',
    updateTriggers: { getWidth: [graphConnections], getColor: [graphConnections] }
  });

  const glowLayer = new ScatterplotLayer({
    id: 'market-glow', data: sortedNodes, getPosition: (d: HydratedNode) => [d.x, d.y], radiusUnits: 'common',
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 8; if (graphConnections?.some(c => c.target === d.ticker)) return 8; return 0; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 40]; if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 40]; return [0,0,0,0];
    },
    stroked: false, transitions: { getRadius: 500, getFillColor: 500 },
    updateTriggers: { getRadius: [selectedTicker, graphConnections], getFillColor: [selectedTicker, graphConnections] },
  });

  const dotLayer = new ScatterplotLayer({
    id: 'market-particles', data: sortedNodes, getPosition: (d: HydratedNode) => [d.x, d.y], radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 3.0; if (graphConnections?.some(c => c.target === d.ticker)) return 2.0; 
        if (d.energy > highEnergyThreshold) return 1.8; return 1.2; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.glass, 255]; if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 255]; 
        if (d.sentiment > 0.1) return [...THEME.mint, 200]; if (d.sentiment < -0.1) return [...THEME.red, 200]; return [...THEME.slate, 180]; 
    },
    stroked: true,
    getLineWidth: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return pulse ? 2 : 0.5; if (d.energy > highEnergyThreshold) return 0.5; return 0; 
    },
    getLineColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 180]; if (d.energy > highEnergyThreshold) return [...THEME.glass, 200]; return [0, 0, 0, 0];
    },
    lineWidthUnits: 'common', pickable: true, autoHighlight: true, highlightColor: [...THEME.mint, 100],
    transitions: { getLineWidth: 1000, getLineColor: 1000, getRadius: 1000 },
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections, highEnergyThreshold], getFillColor: [selectedTicker, graphConnections],
        getLineWidth: [maxEnergy, pulse, selectedTicker, highEnergyThreshold], getLineColor: [maxEnergy, pulse, selectedTicker, highEnergyThreshold] 
    },
  });

  // --- RENDER CARD COMPONENT ---
  const Card = ({ node, isInteractive, style, onMouseDown, onTouchStart, onTouchMove, onTouchEnd }: any) => (
    <div 
        style={{...style, position: 'absolute'}}
        className={`map-tooltip-container ${isInteractive ? 'locked' : 'hover'}`}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
        {isInteractive && <div className="tooltip-drag-handle" />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', color: `rgb(${THEME.mint.join(',')})` }}>
                ${node.ticker}
            </span>
            <span style={{ fontSize: '0.8rem', color: `rgba(${THEME.slate.join(',')}, 0.8)` }}>
                {getSectorLabel(node.sector || "Other")}
            </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '8px', lineHeight: '1.4' }}>
            {node.headline || "No active headline"}
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: `rgba(${THEME.slate.join(',')}, 0.7)` }}>
                <span>E: <span style={{color: 'white'}}>{node.energy.toFixed(0)}</span></span>
                <span>Sent: <span style={{color: node.sentiment > 0 ? '#34d399' : node.sentiment < 0 ? '#f87171' : 'white'}}>
                {node.sentiment.toFixed(2)}
                </span></span>
        </div>
    </div>
  );

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialOffsetRef.current = { ...dragOffset };
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    setDragOffset({
        x: initialOffsetRef.current.x + (e.clientX - dragStartRef.current.x),
        y: initialOffsetRef.current.y + (e.clientY - dragStartRef.current.y)
    });
  };
  const handleGlobalMouseUp = () => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
  };

  // --- NEW: TOUCH HANDLERS FOR MOBILE DRAG ---
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation(); // Prevents map panning
    isDraggingRef.current = true;
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    initialOffsetRef.current = { ...dragOffset };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;
    e.stopPropagation(); // Prevents scrolling/panning
    const touch = e.touches[0];
    setDragOffset({
        x: initialOffsetRef.current.x + (touch.clientX - dragStartRef.current.x),
        y: initialOffsetRef.current.y + (touch.clientY - dragStartRef.current.y)
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    isDraggingRef.current = false;
    dragStartRef.current = null;
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
            layers={[cellLayer, sectorTextLayer, vectorLayer, trailLayer, glowLayer, synapseLayer, dotLayer]} 
            style={{ backgroundColor: 'transparent' }} 
            
            onHover={(info: any) => setHoverInfo(info)}
            getTooltip={null} 
            
            onClick={(info: any) => {
                if (info.object) {
                     setSelectedPos({ x: info.x, y: info.y });
                     if (onNodeClick) onNodeClick(info.object);
                } else {
                    if (onBackgroundClick) onBackgroundClick();
                    setSelectedPos(null);
                }
            }}
        />

        {/* Persistent Card */}
        {selectedNode && selectedPos && (
            <Card 
                node={selectedNode}
                isInteractive={true} 
                onMouseDown={handleMouseDown}
                // Attached Touch Handlers
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    left: selectedPos.x + dragOffset.x,
                    top: selectedPos.y + dragOffset.y,
                    transform: 'translate(-50%, -120%)' 
                }}
            />
        )}

        {/* Transient Hover Tooltip */}
        {hoverInfo?.object && hoverInfo.object.ticker !== selectedTicker && (
            <Card 
                node={hoverInfo.object}
                isInteractive={false}
                style={{
                    left: hoverInfo.x,
                    top: hoverInfo.y,
                }}
            />
        )}
    </>
  );
}
