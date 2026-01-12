// @ts-ignore
import React, { useMemo, useState, useEffect } from 'react';
// @ts-ignore
import DeckGL from '@deck.gl/react';
// @ts-ignore
import { ScatterplotLayer, PolygonLayer, PathLayer, LineLayer } from '@deck.gl/layers';
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

const INITIAL_VIEW_STATE = {
  target: [0, 0, 0], 
  zoom: isMobile ? 0.9 : 1.8, 
  minZoom: isMobile ? 0.5 : 0.8,
  maxZoom: isMobile ? 8 : 15
};

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

  // --- 2. METRICS (ADJUSTED) ---
  const { maxEnergy, highEnergyThreshold } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) return { maxEnergy: 0, highEnergyThreshold: 0 };
    
    const energies = data.nodes.map(n => n.energy);
    // Use the 98th percentile instead of absolute Max to avoid one crazy outlier
    // skewing the entire map? For now, we'll just lower the threshold multiplier.
    const max = Math.max(...energies);
    
    return { 
        maxEnergy: max, 
        // CHANGED: 0.5 -> 0.2 
        // Loosened "Noise" filter. Now top 20% of energy gets trails/glow.
        // This ensures MSFT/NVDA stay "Active" even on days with huge outliers.
        highEnergyThreshold: max * 0.2
    };
  }, [data]);

  // --- 3. SORTING & FILTERING ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];
    
    // FILTER OUT NOISE (Hardcoded Junk)
    const cleanNodes = data.nodes.filter(n => {
        if (n.ticker.includes('.WS')) return false;
        if (n.ticker.includes('p')) return false; // Careful: Ensure raw data is Uppercase
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

  // --- 4. TRAIL LOGIC ---
  const trailData = useMemo(() => {
    if (!history || !data) return [];
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];

    const LOOKBACK_FRAMES = 12;
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

  // --- 5. SYNAPSE LOGIC ---
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

  // --- 6. VORONOI LOGIC ---
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

  const accessibleSummary = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes]
        .sort((a, b) => b.energy - a.energy)
        .slice(0, 5)
        .map(n => `${n.ticker}: Energy ${n.energy.toFixed(0)}`);
  }, [data]);

  if (!data) return null;

  // --- LAYERS ----------------------------------------------------------------

  const cellLayer = new PolygonLayer({
    id: 'voronoi-cells',
    data: voronoiData,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => {
      const s = d.node.sentiment;
      if (s > 0.1) return [...THEME.mint, 3]; 
      if (s < -0.1) return [...THEME.red, 3];  
      return [0, 0, 0, 0]; 
    },
    stroked: true,
    getLineColor: [255, 255, 255, 3],
    getLineWidth: 0.5,
    lineWidthUnits: 'pixels',
    pickable: false 
  });

  const trailLayer = new PathLayer({
    id: 'market-trails',
    data: trailData,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
        if (d.sentiment > 0.1) return [...THEME.mint, 80]; 
        if (d.sentiment < -0.1) return [...THEME.red, 80];
        return [...THEME.slate, 40];
    },
    getWidth: 0.8,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: 1 
  });

  const synapseLayer = new LineLayer({
    id: 'graph-synapses',
    data: synapseData,
    getSourcePosition: (d: any) => d.from,
    getTargetPosition: (d: any) => d.to,
    getColor: [...THEME.gold, 120], 
    getWidth: (d: any) => Math.max(0.5, d.strength * 0.5), 
    widthUnits: 'pixels',
    updateTriggers: {
        getWidth: [graphConnections],
        getColor: [graphConnections]
    }
  });

  const glowLayer = new ScatterplotLayer({
    id: 'market-glow',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common',
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 18; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 10; 
        // ADDED: Small glow for "Active" tickers that have trails
        if (d.energy > highEnergyThreshold) return 6;
        return 0; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.mint, 40]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 40]; 
        if (d.energy > highEnergyThreshold) return [...THEME.slate, 20]; // Subtle ambient glow for majors
        return [0,0,0,0];
    },
    stroked: false,
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections, highEnergyThreshold],
        getFillColor: [selectedTicker, graphConnections, highEnergyThreshold]
    },
    transitions: {
        getRadius: 3000, 
        getFillColor: 1000
    }
  });

  const dotLayer = new ScatterplotLayer({
    id: 'market-particles',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 6.0; 
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.0; 
        return 1.5; 
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
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[cellLayer, glowLayer, trailLayer, synapseLayer, dotLayer]} 
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
                <div style="
                    padding: 12px; 
                    background: var(--glass-bg); 
                    color: var(--text-primary); 
                    border: 1px solid var(--glass-border); 
                    border-radius: 8px; 
                    font-family: var(--font-sans);
                    backdrop-filter: blur(12px);
                    box-shadow: var(--shadow-soft);
                    min-width: 160px;
                ">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="font-family: var(--font-mono); letter-spacing: 0.05em;">$${object.ticker}</strong>
                        <span style="font-size:0.7rem; color: var(--accent-green); font-family: var(--font-mono);">
                            E: ${object.energy.toFixed(0)}
                        </span>
                    </div>
                    <div style="font-size:0.75rem; color: var(--text-muted); line-height: 1.4;">
                        ${object.headline || "Awaiting signal..."}
                    </div>
                </div>
                `
            }}
        />
    </>
  );
}
