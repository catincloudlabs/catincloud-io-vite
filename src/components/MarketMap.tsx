// @ts-ignore
import React, { useMemo, useState, useEffect } from 'react';
// @ts-ignore
import DeckGL from '@deck.gl/react';
// @ts-ignore
import { ScatterplotLayer, PolygonLayer, PathLayer, LineLayer } from '@deck.gl/layers';
// @ts-ignore
import { PathStyleExtension } from '@deck.gl/extensions'; 
// @ts-ignore
import { OrthographicView } from '@deck.gl/core';
import { Delaunay } from 'd3-delaunay';
import { GraphConnection } from '../hooks/useKnowledgeGraph'; 

export type HydratedNode = {
  ticker: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  headline: string;
  sentiment: number;
};

export type MarketFrame = {
  date: string;
  nodes: HydratedNode[];
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
  glass: [255, 255, 255]
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

  // --- 2. CALCULATE CENTER OF MASS (Fixes 11 o'clock drift) ---
  const initialViewState = useMemo(() => {
    if (!data?.nodes?.length) {
        return { target: [0, 0, 0], zoom: 1 };
    }
    
    // Calculate the average X and Y to find the cluster's center
    const count = data.nodes.length;
    const avgX = data.nodes.reduce((sum, n) => sum + n.x, 0) / count;
    const avgY = data.nodes.reduce((sum, n) => sum + n.y, 0) / count;

    return {
      target: [avgX, avgY, 0], 
      zoom: isMobile ? 1.0 : 2.2, 
      minZoom: isMobile ? 0.5 : 0.8,
      maxZoom: isMobile ? 8 : 15
    };
  }, [data]); // Re-calculates only when data loads

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

  // --- 4. SORTING & FILTERING ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];
    
    const cleanNodes = data.nodes.filter(n => {
        if (n.ticker.includes('.WS')) return false;
        if (n.ticker.includes('p')) return false;
        if (n.ticker === 'XYZ') return false;
        if (n.ticker.length === 5 && n.ticker.endsWith('Y') && !['SONY', 'BAYRY'].includes(n.ticker)) return false; 
        return true;
    });

    return [...cleanNodes].sort((a, b) => {
      if (a.ticker === selectedTicker) return 1;
      if (b.ticker === selectedTicker) return -1;
      const aConn = graphConnections?.some(c => c.target === a.ticker);
      const bConn = graphConnections?.some(c => c.target === b.ticker);
      if (aConn && !bConn) return 1;
      if (!aConn && bConn) return -1;
      return a.energy - b.energy;
    });
  }, [data, selectedTicker, graphConnections]);

  // --- 5. TRAIL LOGIC (HISTORY) ---
  const trailData = useMemo(() => {
    if (!history || !data) return [];
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];

    const LOOKBACK_FRAMES = 8; 
    const lookback = Math.max(0, currentIndex - LOOKBACK_FRAMES);
    const recentHistory = history.slice(lookback, currentIndex + 1);

    const activeTickers = new Set(
      data.nodes
        .filter(n => n.energy > highEnergyThreshold || n.ticker === selectedTicker) 
        .map(n => n.ticker)
    );

    const pathsByTicker: Record<string, number[][]> = {};
    recentHistory.forEach(frame => {
      frame.nodes.forEach(node => {
        if (activeTickers.has(node.ticker)) {
          if (!pathsByTicker[node.ticker]) pathsByTicker[node.ticker] = [];
          pathsByTicker[node.ticker].push([node.x, node.y]);
        }
      });
    });

    return Object.keys(pathsByTicker).map(ticker => ({
      ticker,
      path: pathsByTicker[ticker],
      sentiment: data.nodes.find(n => n.ticker === ticker)?.sentiment || 0
    }));
  }, [data, history, selectedTicker, highEnergyThreshold]); 

  // --- 6. VECTOR LOGIC (PREDICTION) ---
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

  // --- 7. SYNAPSE LOGIC (RELATIONSHIPS) ---
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

  // --- 8. VORONOI LOGIC (TERRITORY) ---
  const voronoiData = useMemo(() => {
    if (!sortedNodes || sortedNodes.length < 3) return [];
    const points = sortedNodes.map(d => [d.x, d.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    // Dynamic bounds based on current view center helps, but fixed is usually fine 
    // if we center the camera. We kept -250/250 but shifted to match the centroid could be better.
    // For now, large static bounds work fine with the new camera target.
    const voronoi = delaunay.voronoi([-400, -400, 400, 400]);
    // @ts-ignore
    const polygons = Array.from(voronoi.cellPolygons());
    return polygons.map((polygon: any, i: number) => ({
      polygon,
      node: sortedNodes[i]
    }));
  }, [sortedNodes]);

  const accessibleSummary = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes]
        .sort((a, b) => b.energy - a.energy)
        .slice(0, 5)
        .map(n => `${n.ticker}: Energy ${n.energy.toFixed(0)}`);
  }, [data]);

  if (!data) return null;

  // --- LAYERS ----------------------------------------------------------------

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

  // 3. GHOST TRAILS
  const trailLayer = new PathLayer({
    id: 'market-trails',
    data: trailData,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
        const isSelected = d.ticker === selectedTicker;
        const alpha = isSelected ? 180 : 40;
        const slateAlpha = isSelected ? 120 : 15;
        if (d.sentiment > 0.1) return [...THEME.mint, alpha]; 
        if (d.sentiment < -0.1) return [...THEME.red, alpha];
        return [...THEME.slate, slateAlpha];
    },
    getWidth: (d: any) => d.ticker === selectedTicker ? 2.0 : 0.8,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: 1,
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

  // 5. GLOW LAYER
  const glowLayer = new ScatterplotLayer({
    id: 'market-glow',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common',
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 18; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 10; 
        if (d.energy > highEnergyThreshold) return 6;
        return 0; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 40]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 40]; 
        if (d.energy > highEnergyThreshold) return [...THEME.slate, 20]; 
        return [0,0,0,0];
    },
    stroked: false,
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections, highEnergyThreshold],
        getFillColor: [selectedTicker, graphConnections, highEnergyThreshold]
    },
    transitions: { getRadius: 3000, getFillColor: 1000 }
  });

  // 6. DOT LAYER
  const dotLayer = new ScatterplotLayer({
    id: 'market-particles',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 6.0; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.0; 
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
        return 0; 
    },
    getLineColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 180];
        return [0, 0, 0, 0];
    },
    lineWidthUnits: 'common',
    pickable: true,
    autoHighlight: true,
    highlightColor: [...THEME.mint, 100],
    transitions: {
        getLineWidth: 3000, 
        getLineColor: 2000,
        getRadius: 1000
    },
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections],
        getFillColor: [selectedTicker, graphConnections],
        getLineWidth: [maxEnergy, pulse, selectedTicker], 
        getLineColor: [maxEnergy, pulse, selectedTicker] 
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
            // CHANGED: Uses calculated center of mass instead of static constant
            initialViewState={initialViewState}
            controller={true}
            layers={[cellLayer, vectorLayer, trailLayer, glowLayer, synapseLayer, dotLayer]} 
            style={{ backgroundColor: 'transparent' }} 
            onClick={(info: any) => {
                if (info.object) {
                    if (onNodeClick) onNodeClick(info.object);
                } else {
                    if (onBackgroundClick) onBackgroundClick();
                }
            }}
            // @ts-ignore
            getTooltip={({object}) => object && object.ticker && {
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
            }}
        />
    </>
  );
}
