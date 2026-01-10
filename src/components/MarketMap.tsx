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

// ... [Keep Types] ...
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

// --- RESPONSIVE CONFIG ---
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const INITIAL_VIEW_STATE = {
  // Mobile: Target [0, -40, 0] -> Looks at a lower point, pushing data UP
  // Desktop: Target [65, 10, 0] -> Shifts focus right
  target: isMobile ? [0, -40, 0] : [65, 10, 0], 
  zoom: isMobile ? 0.6 : 1.0, 
  minZoom: 0.1,
  maxZoom: 10
};

export function MarketMap({ data, history, onNodeClick, selectedTicker, graphConnections }: MarketMapProps) {
  
  // ... [Keep trailData logic] ...
  const trailData = useMemo(() => {
    if (!history || !data) return [];
    const currentIndex = history.findIndex(f => f.date === data.date);
    if (currentIndex <= 0) return [];

    const lookback = Math.max(0, currentIndex - 5);
    const recentHistory = history.slice(lookback, currentIndex + 1);
    const pathsByTicker: Record<string, number[][]> = {};
    
    recentHistory.forEach(frame => {
      frame.nodes.forEach(node => {
        if (!pathsByTicker[node.ticker]) pathsByTicker[node.ticker] = [];
        pathsByTicker[node.ticker].push([node.x, node.y]);
      });
    });

    return Object.keys(pathsByTicker).map(ticker => ({
      ticker,
      path: pathsByTicker[ticker],
      sentiment: data.nodes.find(n => n.ticker === ticker)?.sentiment || 0
    }));

  }, [data, history]); 

  // ... [Keep synapseData logic] ...
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


  // ... [Keep voronoiData logic] ...
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

  // ... [Keep Layers] ...
  const cellLayer = new PolygonLayer({
    id: 'voronoi-cells',
    data: voronoiData,
    getPolygon: (d: any) => d.polygon,
    getFillColor: (d: any) => {
      const s = d.node.sentiment;
      if (s > 0.1) return [0, 255, 100, 10];   
      if (s < -0.1) return [255, 50, 50, 10];  
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
    getColor: [255, 215, 0, 200], // Gold
    getWidth: (d: any) => Math.max(1, d.strength * 0.5), 
    widthUnits: 'pixels'
  });

  const dotLayer = new ScatterplotLayer({
    id: 'market-particles',
    data: data.nodes,
    getPosition: (d: HydratedNode) => [d.x, d.y],
    radiusUnits: 'common', 
    getRadius: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return 4; 
        const isConnected = graphConnections?.some(c => c.target === d.ticker);
        if (isConnected) return 3; 
        return 1.5 + (d.energy || 0) / 20; 
    },
    getFillColor: (d: HydratedNode) => {
        if (d.ticker === selectedTicker) return [255, 255, 255, 255]; 
        if (graphConnections?.some(c => c.target === d.ticker)) return [255, 215, 0, 255]; 

        if (d.sentiment > 0.1) return [0, 255, 100, 255];   
        if (d.sentiment < -0.1) return [255, 50, 50, 255];  
        return [200, 200, 200, 150]; 
    },
    stroked: true,
    getLineColor: [0, 0, 0, 200], 
    getLineWidth: 0.5, 
    lineWidthUnits: 'common',
    pickable: true,
    autoHighlight: true,
    highlightColor: [255, 255, 255, 100],
    onClick: (info: any) => {
      if (info.object && onNodeClick) onNodeClick(info.object);
    },
    updateTriggers: {
        getRadius: [selectedTicker, graphConnections],
        getFillColor: [selectedTicker, graphConnections]
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
            <strong>${object.ticker}</strong>
          </div>
        `
      }}
    />
  );
}
