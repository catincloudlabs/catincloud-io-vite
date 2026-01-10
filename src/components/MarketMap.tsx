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
  selectedTicker?: string | null;         
  graphConnections?: GraphConnection[];   
}

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const INITIAL_VIEW_STATE = {
  target: isMobile ? [0, 40, 0] : [65, 10, 0], 
  zoom: isMobile ? 0.6 : 1.0, 
  minZoom: 0.1,
  maxZoom: 10
};

export function MarketMap({ data, history, onNodeClick, selectedTicker, graphConnections }: MarketMapProps) {
  
  // --- 1. HEARTBEAT SYSTEM ---
  // We toggle this boolean every 2 seconds to trigger the GPU transition
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 2000); // 2-second breath cycle (Inhale... Exhale)
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

  // --- 3. SORTING ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes].sort((a, b) => {
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
    if (!data?.nodes || data.nodes.length < 3) return [];
    const points = data.nodes.map(d => [d.x, d.y] as [number, number]);
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([-400, -400, 400, 400]);
    // @ts-ignore
    const polygons = Array.from(voronoi.cellPolygons());
    return polygons.map((polygon: any, i: number) => ({
      polygon,
      node: data.nodes[i]
    }));
  }, [data]);

  if (!data) return null;

  // --- LAYERS ---
  const cellLayer = new PolygonLayer({
    id: 'voronoi-cells',
    data: voronoiData,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => {
      const s = d.node.sentiment;
      if (s > 0.1) return [0, 255, 100, 5];   
      if (s < -0.1) return [255, 50, 50, 5];  
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
        if (d.sentiment > 0.1) return [0, 255, 100, 100]; 
        if (d.sentiment < -0.1) return [255, 50, 50, 100];
        return [100, 100, 100, 50];
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
    getColor: [255, 215, 0, 255], 
    getWidth: (d: any) => Math.max(2, d.strength * 0.8), 
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
    
    // Size is mostly uniform to prevent clutter
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 5;
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.5;
        return 2.5;
    },

    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [255, 255, 255, 255]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [255, 215, 0, 255]; 

        if (d.sentiment > 0.1) return [0, 255, 100, 255];   
        if (d.sentiment < -0.1) return [255, 50, 50, 255];  
        
        return [60, 70, 80, 150]; 
    },
    
    stroked: true,
    
    // --- ANIMATED HALOS ---
    getLineWidth: (d: HydratedNode) => {
        // SELECTED: Always pulses noticeably
        if (d.ticker === selectedTicker) {
            return pulse ? 3 : 1; 
        }
        
        // SUPER ENERGY: "Heartbeat" pulse
        if (d.energy > superEnergyThreshold) {
            return pulse ? 2 : 0.8; // Expands and contracts
        } 

        // HIGH ENERGY: Subtle shimmer
        if (d.energy > highEnergyThreshold) {
            return pulse ? 1 : 0.5;
        }  
        
        return 0; 
    },
    
    getLineColor: (d: HydratedNode) => {
        // SELECTED: Strong White
        if (d.ticker === selectedTicker) {
             return pulse ? [255, 255, 255, 150] : [255, 255, 255, 255];
        }

        // SUPER ENERGY: Glassy White -> Faint White
        if (d.energy > superEnergyThreshold) {
            return pulse ? [255, 255, 255, 100] : [255, 255, 255, 200]; 
        }

        // HIGH ENERGY: Very faint
        if (d.energy > highEnergyThreshold) {
            return pulse ? [255, 255, 255, 50] : [255, 255, 255, 100];  
        }
        
        return [0, 0, 0, 0];
    },

    lineWidthUnits: 'common',
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    
    // --- CRITICAL: GPU ANIMATION SETTINGS ---
    transitions: {
        getLineWidth: 2000, // 2 seconds to morph width
        getLineColor: 2000, // 2 seconds to morph color
    },
    
    // Tell Deck.GL to recalculate these accessors when 'pulse' changes
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections],
        getFillColor: [selectedTicker, graphConnections],
        getLineWidth: [maxEnergy, pulse, selectedTicker], // <--- PULSE ADDED
        getLineColor: [maxEnergy, pulse, selectedTicker]  // <--- PULSE ADDED
    },

    onClick: (info: any) => {
      if (info.object && onNodeClick) onNodeClick(info.object);
    }
  });

  return (
    <DeckGL
      views={new OrthographicView({ controller: true })}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      layers={[cellLayer, trailLayer, synapseLayer, dotLayer]} 
      style={{ backgroundColor: '#020617' }}
      // @ts-ignore
      getTooltip={({object}) => object && object.ticker && {
        html: `
          <div style="padding: 12px; background: rgba(10,10,10,0.95); color: white; border: 1px solid #444; border-radius: 8px; font-family: 'Inter', sans-serif;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong>$${object.ticker}</strong>
              <span style="font-size:0.7em; opacity:0.7;">VOL: ${object.energy.toFixed(0)}</span>
            </div>
            <div style="font-size:0.8em; opacity:0.8;">${object.headline || "No headline"}</div>
          </div>
        `
      }}
    />
  );
}
