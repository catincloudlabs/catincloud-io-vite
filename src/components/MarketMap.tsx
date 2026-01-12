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

// Mobile Detection (Static for initial load)
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const INITIAL_VIEW_STATE = {
  // Mobile: Center at 0,0 but slightly zoomed out compared to desktop
  target: [0, 0, 0], 
  zoom: isMobile ? 0.5 : 1.0, 
  // Stricter zoom limits on mobile to prevent "lost in void"
  minZoom: isMobile ? 0.3 : 0.5,
  maxZoom: isMobile ? 5 : 10
};

// --- THEME CONSTANTS (Synced with index.css) ---
const THEME = {
  mint: [52, 211, 153],       // #34d399 (Matches --accent-green)
  red: [239, 68, 68],         // #ef4444
  slate: [148, 163, 184],     // #94a3b8 (Matches --text-muted)
  gold: [251, 191, 36],       // #fbbf24 (Matches --accent-ai)
  glass: [255, 255, 255]
};

export function MarketMap({ data, history, onNodeClick, onBackgroundClick, selectedTicker, graphConnections }: MarketMapProps) {
  
  // --- 1. HEARTBEAT SYSTEM ---
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  // --- 2. METRICS ---
  const { maxEnergy, highEnergyThreshold, superEnergyThreshold } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) return { maxEnergy: 0, highEnergyThreshold: 0, superEnergyThreshold: 0 };
    
    const energies = data.nodes.map(n => n.energy);
    const max = Math.max(...energies);
    
    return { 
        maxEnergy: max, 
        highEnergyThreshold: max * 0.5, 
        superEnergyThreshold: max * 0.8 
    };
  }, [data]);

  // --- 3. SORTING & FILTERING ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];

    // FILTER OUT NOISE
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

  // --- 4. TRAIL LOGIC ---
  const trailData = useMemo(() => {
    if (!history || !data) return [];
    
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];

    const LOOKBACK_FRAMES = 10; 
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

  // --- ACCESSIBILITY SUMMARY ---
  const accessibleSummary = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes]
        .sort((a, b) => b.energy - a.energy)
        .slice(0, 5)
        .map(n => `${n.ticker}: Energy ${n.energy.toFixed(0)}, Sentiment ${n.sentiment.toFixed(2)}`);
  }, [data]);

  if (!data) return null;

  // --- LAYERS ---
  const cellLayer = new PolygonLayer({
    id: 'voronoi-cells',
    data: voronoiData,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => {
      const s = d.node.sentiment;
      // Updated to Mint/Red with very low opacity
      if (s > 0.1) return [...THEME.mint, 5];   
      if (s < -0.1) return [...THEME.red, 5];  
      return [0, 0, 0, 0]; 
    },
    stroked: true,
    getLineColor: [255, 255, 255, 5],
    getLineWidth: 0.5,
    lineWidthUnits: 'pixels',
    pickable: false 
  });

  const trailLayer = new PathLayer({
    id: 'market-trails',
    data: trailData,
    getPath: (d: any) => d.path,
    getColor: (d: any) => {
        if (d.sentiment > 0.1) return [...THEME.mint, 100]; 
        if (d.sentiment < -0.1) return [...THEME.red, 100];
        return [...THEME.slate, 50];
    },
    getWidth: 1.5,
    widthUnits: 'pixels',
    jointRounded: true,
    capRounded: true,
    opacity: 0.6
  });

  const synapseLayer = new LineLayer({
    id: 'graph-synapses',
    data: synapseData,
    getSourcePosition: (d: any) => d.from,
    getTargetPosition: (d: any) => d.to,
    getColor: [...THEME.gold, 200], 
    
    // UPDATED WIDTH: Thinner, more elegant lines (0.5px to ~1.5px)
    getWidth: (d: any) => Math.max(0.5, d.strength * 0.5), 
    
    widthUnits: 'pixels',
    updateTriggers: {
        getWidth: [graphConnections],
        getColor: [graphConnections]
    }
  });

  const dotLayer = new ScatterplotLayer({
    id: 'market-particles',
    data: sortedNodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 5;
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.5;
        return 2.5;
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [...THEME.glass, 255]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [...THEME.gold, 255]; 
        if (d.sentiment > 0.1) return [...THEME.mint, 255];   
        if (d.sentiment < -0.1) return [...THEME.red, 255];  
        return [...THEME.slate, 150]; // Muted slate for neutral nodes
    },
    stroked: true,
    getLineWidth: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return pulse ? 3 : 1; 
        if (d.energy > superEnergyThreshold) return pulse ? 2 : 0.8; 
        if (d.energy > highEnergyThreshold) return pulse ? 1 : 0.5;
        return 0; 
    },
    getLineColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return pulse ? [...THEME.mint, 150] : [...THEME.glass, 255];
        if (d.energy > superEnergyThreshold) return pulse ? [...THEME.glass, 100] : [...THEME.glass, 200]; 
        if (d.energy > highEnergyThreshold) return pulse ? [...THEME.glass, 50] : [...THEME.glass, 100];  
        return [0, 0, 0, 0];
    },
    lineWidthUnits: 'common',
    pickable: true,
    autoHighlight: true,
    highlightColor: [...THEME.mint, 100],
    transitions: {
        getLineWidth: 2000,
        getLineColor: 2000,
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
            <p>Current Simulation Date: {data.date}</p>
            <ul>
                {accessibleSummary.map((str, i) => <li key={i}>{str}</li>)}
            </ul>
        </div>

        <DeckGL
            views={new OrthographicView({ controller: true })}
            initialViewState={INITIAL_VIEW_STATE}
            controller={true}
            layers={[cellLayer, trailLayer, synapseLayer, dotLayer]} 
            
            // KEY FIX: Transparent background allows the CSS Slate theme to show through
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
                <div style="padding: 12px; background: rgba(15, 23, 42, 0.95); color: #f8fafc; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; font-family: 'Inter', sans-serif;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <strong>$${object.ticker}</strong>
                    <span style="font-size:0.7em; color: #94a3b8; margin-left: 12px;">VOL: ${object.energy.toFixed(0)}</span>
                    </div>
                    <div style="font-size:0.8em; color: #cbd5e1;">${object.headline || "No headline"}</div>
                </div>
                `
            }}
        />
    </>
  );
}
