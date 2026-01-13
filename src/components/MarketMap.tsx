// src/components/MarketMap.tsx

// @ts-ignore
import React, { useMemo, useState, useEffect } from 'react';
// @ts-ignore
import DeckGL from '@deck.gl/react';
// @ts-ignore
import { ScatterplotLayer, PolygonLayer, PathLayer, LineLayer, TextLayer } from '@deck.gl/layers'; 
// @ts-ignore
import { PathStyleExtension } from '@deck.gl/extensions'; 
// @ts-ignore
import { OrthographicView } from '@deck.gl/core';
import { Delaunay } from 'd3-delaunay';
import { GraphConnection } from '../hooks/useKnowledgeGraph'; 

// --- UPDATED TYPE DEFINITIONS ---
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

  // --- 2. SMART VIEWPORT CALCULATION (Auto-Fit) ---
  const initialViewState = useMemo(() => {
    // Default fallback
    if (!data?.nodes?.length) return { target: [0, 0, 0], zoom: 1 };

    // A. Calculate Bounds & Weighted Center
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let totalEnergy = 0;
    let weightedSumX = 0;
    let weightedSumY = 0;

    data.nodes.forEach(n => {
        // Bounds
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;

        // Weighted Center (Bias towards high energy nodes)
        // We add 1 to ensure even 0 energy nodes have a tiny bit of gravity
        const weight = n.energy + 1; 
        weightedSumX += n.x * weight;
        weightedSumY += n.y * weight;
        totalEnergy += weight;
    });

    const centerX = totalEnergy > 0 ? weightedSumX / totalEnergy : 0;
    const centerY = totalEnergy > 0 ? weightedSumY / totalEnergy : 0;

    // B. Dynamic Zoom Calculation
    // Fit the data bounds into the screen with padding
    const PADDING = 100; // Pixels of breathing room
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const dataWidth = Math.max(maxX - minX, 100); // Prevent divide by zero
    const dataHeight = Math.max(maxY - minY, 100);

    const scaleX = (screenWidth - PADDING) / dataWidth;
    const scaleY = (screenHeight - PADDING) / dataHeight;
    const fitScale = Math.min(scaleX, scaleY);

    // Convert Scale to DeckGL Zoom Level (log2)
    const autoZoom = Math.log2(fitScale);

    return {
      target: [centerX, centerY, 0],
      // Clamp zoom to reasonable limits so we don't zoom in to atomic levels or out to infinity
      zoom: Math.max(isMobile ? 0.2 : 0.5, Math.min(autoZoom, 4)),
      minZoom: isMobile ? 0.2 : 0.5,
      maxZoom: 15
    };
  }, [data]); 

  // --- 3. METRICS ---
  const { maxEnergy, highEnergyThreshold } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) return { maxEnergy: 0, highEnergyThreshold: 0 };
    const energies = data.nodes.map(n => n.energy);
    const max = Math.max(...energies);
    
    return { 
        maxEnergy: max, 
        highEnergyThreshold: max * 0.15
    };
  }, [data]);

  // --- 4. DATA MEMOS ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];
    
    // Quick filter for clutter
    const cleanNodes = data.nodes.filter(n => {
        if (n.ticker.includes('.WS')) return false;
        if (n.ticker.includes('p')) return false;
        return true;
    });

    return [...cleanNodes].sort((a, b) => {
      if (a.ticker === selectedTicker) return 1;
      // prioritize graph connections
      const aConn = graphConnections?.some(c => c.target === a.ticker);
      const bConn = graphConnections?.some(c => c.target === b.ticker);
      if (aConn && !bConn) return 1;
      if (!aConn && bConn) return -1;
      return a.energy - b.energy;
    });
  }, [data, selectedTicker, graphConnections]);

  // Trail Logic (Vapor Trail Version - Tuned)
  const trailData = useMemo(() => {
    if (!history || !data) return [];
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];

    // TUNED: Reduced from 14 to 5 for cleaner "immediate history" only
    const LOOKBACK_FRAMES = 5; 
    const lookback = Math.max(0, currentIndex - LOOKBACK_FRAMES);
    const recentHistory = history.slice(lookback, currentIndex + 1);

    const activeTickers = new Set(
      data.nodes
        .filter(n => n.energy > highEnergyThreshold || n.ticker === selectedTicker) 
        .map(n => n.ticker)
    );

    const pathsByTicker: Record<string, number[][]> = {};
    
    // Helper to calculate distance
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
             
             // TUNED: Only add point if moved > 2 pixels (Prevents "scribbles" in place)
             if (dist(lastPoint, currentPoint) > 2) {
                 path.push(currentPoint);
             }
          }
        }
      });
    });

    // Filter out paths that are too short (single points)
    return Object.keys(pathsByTicker)
        .filter(t => pathsByTicker[t].length > 1)
        .map(ticker => ({
            ticker,
            path: pathsByTicker[ticker],
            sentiment: data.nodes.find(n => n.ticker === ticker)?.sentiment || 0
        }));
  }, [data, history, selectedTicker, highEnergyThreshold]);

  // Vector Logic
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

  // Synapse Logic
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

  // Voronoi Logic
  const voronoiData = useMemo(() => {
    if (!sortedNodes || sortedNodes.length < 3) return [];
    const points = sortedNodes.map(d => [d.x, d.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([-400, -400, 400, 400]);
    // @ts-ignore
    const polygons = Array.from(voronoi.cellPolygons());
    return polygons.map((polygon: any, i: number) => ({
      polygon,
      node: sortedNodes[i]
    }));
  }, [sortedNodes]);

  // Sector Data Memo
  const sectorLayerData = useMemo(() => {
    if (!data?.sectors) return [];
    // Filter out "Other" or tiny sectors if you want less clutter
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

  // 0. SECTOR BACKGROUND (Wireframe Circles)
  const sectorBgLayer = new ScatterplotLayer({
    id: 'sector-centers',
    data: sectorLayerData,
    getPosition: (d: SectorNode) => [d.x, d.y],
    getRadius: (d: SectorNode) => Math.sqrt(d.energy) * 10 + 20, 
    getFillColor: [0, 0, 0, 0], // Transparent fill to prevent washout
    stroked: true,
    getLineColor: [...THEME.slate, 40], 
    getLineWidth: 1,
    lineWidthUnits: 'pixels',
  });

  // 0.5 SECTOR LABELS
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

  // 1. BACKGROUND CELLS (Grid)
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

  // 2. VECTOR LAYER
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

  // 3. GHOST TRAILS (Vapor Style - Tuned)
  const trailLayer = new PathLayer({
    id: 'market-trails',
    data: trailData,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
        const isSelected = d.ticker === selectedTicker;
        // TUNED: Drastically reduced opacity (was 40 -> 25)
        const alpha = isSelected ? 180 : 25;
        const slateAlpha = isSelected ? 120 : 10;
        if (d.sentiment > 0.1) return [...THEME.mint, alpha]; 
        if (d.sentiment < -0.1) return [...THEME.red, alpha];
        return [...THEME.slate, slateAlpha];
    },
    // TUNED: Thinner lines (was 0.8 -> 0.5)
    getWidth: (d: any) => d.ticker === selectedTicker ? 2.0 : 0.5,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: 1,
    transitions: { getColor: 1000, getWidth: 1000 },
    updateTriggers: { getColor: [selectedTicker], getWidth: [selectedTicker] }
  });

  // 4. SYNAPSES
  const synapseLayer = new LineLayer({
    id: 'graph-synapses',
    data: synapseData,
    getSourcePosition: (d: any) => d.from,
    getTargetPosition: (d: any) => d.to,
    getColor: [...THEME.gold, 120], 
    getWidth: (d: any) => Math.max(0.5, d.strength * 0.5), 
    widthUnits: 'pixels',
    updateTriggers: { getWidth: [graphConnections], getColor: [graphConnections] }
  });

  // 5. GLOW LAYER (Cleaned: Selection Only)
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

  // 6. DOT LAYER (The Stocks - Tuned Size)
  const dotLayer = new ScatterplotLayer({
    id: 'market-particles',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 6.0; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.0; 
        
        // TUNED: Reduced from 2.5 to 1.8 (Subtle prominence)
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
        
        // TUNED: Reduced from 1.5 to 1.0 (Crisper hairline ring)
        if (d.energy > highEnergyThreshold) return 1.0; 
        
        return 0; 
    },
    getLineColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 180];
        
        // High Energy Ring - Bright White/Glass
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
            // ORDER MATTERS: Bottom Layers -> Top Layers
            layers={[
                cellLayer,      // 1. Voronoi Grid (Faintest)
                sectorBgLayer,  // 2. Sector Circles
                sectorTextLayer,// 3. Sector Labels
                vectorLayer,    // 4. Momentum Arrows
                trailLayer,     // 5. History Trails (Vapor)
                glowLayer,      // 6. Highlight Glows (Selection Only)
                synapseLayer,   // 7. Connections
                dotLayer        // 8. Stocks (Top - with Rings)
            ]} 
            style={{ backgroundColor: 'transparent' }} 
            onClick={(info: any) => {
                if (info.object) {
                    // Only trigger click for Stocks, not Sector Labels
                    if (info.object.ticker && onNodeClick) {
                         onNodeClick(info.object);
                    }
                } else {
                    if (onBackgroundClick) onBackgroundClick();
                }
            }}
            // @ts-ignore
            getTooltip={({object}) => {
                // Handle Stock Tooltips
                if (object && object.ticker) {
                    return {
                        html: `
                        <div class="map-tooltip">
                            <div class="map-tooltip-header">
                                <strong class="map-tooltip-ticker">$${object.ticker}</strong>
                                <span class="map-tooltip-metric">
                                    E: ${object.energy.toFixed(0)}
                                </span>
                            </div>
                            <div class="map-tooltip-desc">
                                ${object.headline || "Awaiting signal..."}
                            </div>
                        </div>
                        `
                    };
                }
                return null;
            }}
        />
    </>
  );
}
