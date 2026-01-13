// src/utils/processData.ts
import { getSectorForTicker } from './sectorMap';

// --- CONFIGURATION ---
const TARGET_WORLD_SIZE = 800; 
// ---------------------

// 1. Define Types
export type SectorNode = {
  id: string;       // e.g., "Technology"
  x: number;        // Weighted Center X
  y: number;        // Weighted Center Y
  vx: number;       // Aggregate Velocity X
  vy: number;       // Aggregate Velocity Y
  energy: number;   // Total Sector Energy
  count: number;    // Number of tickers
};

type RawDataPoint = {
  date: string;
  ticker: string;
  x: number;
  y: number;
  headline: string;
  sentiment: number;
  sector?: string;
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
  sector: string;
};

export type DailyFrame = {
  date: string;
  nodes: HydratedNode[];
  sectors: SectorNode[]; 
  nodeMap: Map<string, HydratedNode>;
};

// --- HELPER: SECTOR MATH ---
function calculateSectorDynamics(nodes: HydratedNode[]): SectorNode[] {
  const sectors: Record<string, SectorNode> = {};

  nodes.forEach(node => {
    const sectorName = node.sector || "Other";

    if (!sectors[sectorName]) {
      sectors[sectorName] = { 
        id: sectorName, x: 0, y: 0, vx: 0, vy: 0, energy: 0, count: 0 
      };
    }

    const s = sectors[sectorName];
    
    // Weight position by Energy (Higher energy pulls the center)
    // We use a minimum weight of 0.5 to ensure low-energy stocks still count somewhat
    const weight = node.energy > 0.1 ? node.energy : 0.5;

    s.x += node.x * weight;
    s.y += node.y * weight;
    s.vx += node.vx; 
    s.vy += node.vy;
    s.energy += node.energy;
    s.count++;
  });

  // Normalize
  return Object.values(sectors).map(s => {
    // If total energy is high, we divide by energy to get the weighted center.
    // If energy is near zero, we divide by count to get the geometric center.
    const normalizationFactor = s.energy > 1 ? s.energy : s.count; 
    
    return {
      ...s,
      x: s.x / normalizationFactor, 
      y: s.y / normalizationFactor,
      vx: s.vx / s.count, // Velocity is always averaged by count
      vy: s.vy / s.count,
      energy: s.energy / s.count
    };
  });
}

// 2. Main Processing Function
export function hydrateMarketData(rawData: RawDataPoint[]): DailyFrame[] {
  
  // --- A. AUTO-SCALING ---
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  rawData.forEach(p => {
    if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const maxRange = Math.max(rangeX, rangeY, 1);
  const scaleFactor = TARGET_WORLD_SIZE / maxRange;
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterY = (minY + maxY) / 2;

  // --- B. GROUPING ---
  const grouped: Record<string, RawDataPoint[]> = {};
  rawData.forEach(item => {
    if (typeof item.x !== 'number' || typeof item.y !== 'number') return;
    if (!grouped[item.date]) grouped[item.date] = [];
    
    // Scale & Center here
    grouped[item.date].push({
        ...item,
        x: (item.x - rawCenterX) * scaleFactor,
        y: (item.y - rawCenterY) * scaleFactor
    });
  });

  // --- C. FRAME BUILDING ---
  const sortedDates = Object.keys(grouped).sort();

  return sortedDates.map((date, index) => {
    const currentDayData = grouped[date];
    const nextDate = sortedDates[index + 1];
    const nextDayData = nextDate ? grouped[nextDate] : [];

    const nextDayLookup = new Map<string, RawDataPoint>();
    nextDayData.forEach(p => nextDayLookup.set(p.ticker, p));

    const nodes: HydratedNode[] = currentDayData.map(stock => {
      const nextState = nextDayLookup.get(stock.ticker);
      const vx = nextState ? nextState.x - stock.x : 0;
      const vy = nextState ? nextState.y - stock.y : 0;
      const energy = (Math.abs(vx) + Math.abs(vy)) * (1 + Math.abs(stock.sentiment));
      
      // Look up the sector using our new utility
      const sector = getSectorForTicker(stock.ticker);

      return {
        ticker: stock.ticker,
        x: stock.x,
        y: stock.y,
        vx, vy,
        energy: parseFloat(energy.toFixed(4)), 
        headline: stock.headline,
        sentiment: stock.sentiment,
        sector: sector 
      };
    });

    // --- NEW: Calculate Sectors for this specific day ---
    const sectors = calculateSectorDynamics(nodes);

    const nodeMap = new Map<string, HydratedNode>();
    nodes.forEach(node => nodeMap.set(node.ticker, node));

    return {
      date,
      nodes,
      sectors, 
      nodeMap 
    };
  });
}
