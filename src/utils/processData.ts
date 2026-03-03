// src/utils/processData.ts
import { getSectorForTicker } from './sectorMap';

// --- CONFIGURATION ---
// We scale the raw physics coordinates up so they fit nicely in the WebGL viewport
const VISUAL_SCALAR_X = 100; // Merton distance is ~1 to 6. Multiplied by 100 = 100 to 600.
const VISUAL_SCALAR_Y = 30;  // Log10(H_eff) is ~-6 to 11. Multiplied by 30 = -180 to 330.
const X_OFFSET = -300;       // Center the diagram

export type RawDataPoint = {
  date: string;
  time: string;
  symbol: string;
  xi: number;
  h_eff: number;
  h_c: number;
  merton_distance: number;
  phase: 'ELASTIC' | 'SUPERCRITICAL' | 'BALLISTIC';
  // Other CSV fields can be added here as needed
};

export type HydratedNode = {
  ticker: string;
  x: number;         // WebGL Render X
  y: number;         // WebGL Render Y
  merton: number;    // True Physics X
  h_eff: number;     // True Physics Y
  xi: number;        // Criticality Index
  phase: 'ELASTIC' | 'SUPERCRITICAL' | 'BALLISTIC';
  sector: string;
};

export type MarketFrame = {
  date: string;       // Formatted as "YYYY-MM-DD HH:MM" to handle the snapshots
  timestamp: number;  // For sorting
  nodes: HydratedNode[];
  nodeMap: Map<string, HydratedNode>;
};

export function processMarketData(rawData: RawDataPoint[]): MarketFrame[] {
  // 1. Group by exact temporal snapshot (Date + Time)
  const grouped: Record<string, RawDataPoint[]> = {};
  
  rawData.forEach(item => {
    // Treat the 09:30 and 10:30 snapshots as completely distinct frames
    const frameKey = `${item.date} ${item.time}`; 
    if (!grouped[frameKey]) grouped[frameKey] = [];
    grouped[frameKey].push(item);
  });

  const sortedKeys = Object.keys(grouped).sort();

  // 2. Hydrate Nodes with Logarithmic Spatial Topology
  return sortedKeys.map((frameKey) => {
    const currentFrameData = grouped[frameKey];

    const nodes: HydratedNode[] = currentFrameData.map(stock => {
      // Safely calculate Log10 of H_eff. Prevent -Infinity if H_eff is exactly 0.
      const logHeff = stock.h_eff > 0 ? Math.log10(stock.h_eff) : -6;

      // Apply Topology Mapping
      const x = (stock.merton_distance * VISUAL_SCALAR_X) + X_OFFSET;
      const y = (logHeff * VISUAL_SCALAR_Y);

      return {
        ticker: stock.symbol,
        x,
        y,
        merton: stock.merton_distance,
        h_eff: stock.h_eff,
        xi: stock.xi,
        phase: stock.phase,
        sector: getSectorForTicker(stock.symbol),
      };
    });

    const nodeMap = new Map<string, HydratedNode>();
    nodes.forEach(n => nodeMap.set(n.ticker, n));

    return {
      date: frameKey,
      timestamp: new Date(frameKey.replace(' ', 'T')).getTime(),
      nodes,
      nodeMap
    };
  });
}
