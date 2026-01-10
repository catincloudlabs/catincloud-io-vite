// @ts-ignore
import React, { useMemo } from 'react';
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
  
  // --- 0. METRICS ---
  // Calculate dynamic thresholds so the visual works on quiet days AND crazy days
  const { maxEnergy, highEnergyThreshold, superEnergyThreshold } = useMemo(() => {
    if (!data?.nodes || data.nodes.length === 0) return { maxEnergy: 0, highEnergyThreshold: 0, superEnergyThreshold: 0 };
    
    const energies = data.nodes.map(n => n.energy);
    const max = Math.max(...energies);
    
    // "High Energy" = Top 25% of the current range
    // "Super Energy" = Top 10% (The market movers)
    return { 
        maxEnergy: max, 
        highEnergyThreshold: max * 0.5, 
        superEnergyThreshold: max * 0.8 
    };
  }, [data]);

  // --- 1. SORTING ---
  const sortedNodes = useMemo(() => {
    if (!data?.nodes) return [];
    return [...data.nodes].sort((a, b) => {
      // 1. Selected is ALWAYS top
      if (a.ticker === selectedTicker) return 1;
      if (b.ticker === selectedTicker) return -1;
      
      // 2. Connected nodes next
      const aConn = graphConnections?.some(c => c.target === a.ticker);
      const bConn = graphConnections?.some(c => c.target === b.ticker);
      if (aConn && !bConn) return 1;
      if (!aConn && bConn) return -1;

      // 3. High Energy nodes pop to top (so halos aren't covered)
      return a.energy - b.energy;
    });
  }, [data, selectedTicker, graphConnections]);

  // --- 2. TRAIL LOGIC ---
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

  // --- 3. SYNAPSE LOGIC ---
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

  // --- 4. VORONOI LOGIC ---
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
    
    // --- SIZE: The Great Equalizer ---
    // Instead of scaling with Energy, we keep it tight.
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 5; // User Selection = Big
        if (graphConnections?.some(c => c.target === d.ticker)) return 3.5; // Linked = Medium
        
        return 2.5; // Everyone else = Small uniform dots
    },

    getFillColor: (d: HydratedNode) => {
        // Selected/Connected = Gold/White Highlight
        if (d.ticker === selectedTicker) return [255, 255, 255, 255]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [255, 215, 0, 255]; 

        // Sentiment = Green/Red
        if (d.sentiment > 0.1) return [0, 255, 100, 255];   
        if (d.sentiment < -0.1) return [255, 50, 50, 255];  
        
        // Neutral = Ghostly Grey
        return [60, 70, 80, 150]; 
    },
    
    stroked: true,
    
    // --- ENERGY: The "Voltage" Ring ---
    // If Energy is high, we give it a thick white border (Halo)
    getLineWidth: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 1;
        if (d.energy > superEnergyThreshold) return 1.2; // Massive Energy = Thick Ring
        if (d.energy > highEnergyThreshold) return 0.6;  // High Energy = Visible Ring
        return 0; // Low Energy = No Ring (Clean look)
    },
    
    getLineColor: (d: HydratedNode) => {
        if (d.energy > superEnergyThreshold) return [255, 255, 255, 180]; // Pure White Halo
        if (d.energy > highEnergyThreshold) return [255, 255, 255, 80];  // Soft White Halo
        return [0, 0, 0, 0];
    },

    lineWidthUnits: 'common', // Scales with zoom naturally
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    onClick: (info: any) => {
      if (info.object && onNodeClick) onNodeClick(info.object);
    },
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections],
        getFillColor: [selectedTicker, graphConnections],
        getLineWidth: [maxEnergy],
        getLineColor: [maxEnergy]
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
