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
  vx: number;       // Weighted Velocity X
  vy: number;       // Weighted Velocity Y
  energy: number;   // Total Sector Energy (Sum)
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

// --- HELPER: SECTOR MATH (FIXED) ---
function calculateSectorDynamics(nodes: HydratedNode[]): SectorNode[] {
  // Accumulator Structure
  type SectorAccumulator = {
    sumX: number;
    sumY: number;
    sumVx: number;
    sumVy: number;
    totalWeight: number; // The Denominator
    totalEnergy: number; // Pure Energy Sum (for visual sizing)
    count: number;
  };

  const sectors: Record<string, SectorAccumulator> = {};

  nodes.forEach(node => {
    const sectorName = node.sector || "Other";

    if (!sectors[sectorName]) {
      sectors[sectorName] = { 
        sumX: 0, sumY: 0, 
        sumVx: 0, sumVy: 0, 
        totalWeight: 0, 
        totalEnergy: 0,
        count: 0 
      };
    }

    const s = sectors[sectorName];
    
    // 1. Define Weight
    // We clamp minimum weight to 0.2 so even quiet stocks contribute slightly to the center.
    // This prevents the sector from "snapping" wildly to a single active stock.
    const weight = Math.max(node.energy, 0.2);

    // 2. Accumulate Weighted Numerators
    s.sumX += node.x * weight;
    s.sumY += node.y * weight;
    s.sumVx += node.vx * weight;
    s.sumVy += node.vy * weight;

    // 3. Accumulate Denominator
    s.totalWeight += weight;
    
    // 4. Track Raw Stats
    s.totalEnergy += node.energy;
    s.count++;
  });

  // 5. Normalize (Calculate Averages)
  return Object.keys(sectors).map(key => {
    const s = sectors[key];
    
    // Safety check to avoid division by zero
    const normalizationFactor = s.totalWeight > 0 ? s.totalWeight : 1;
    
    return {
      id: key,
      // Weighted Center of Mass
      x: s.sumX / normalizationFactor, 
      y: s.sumY / normalizationFactor,
      // Weighted Average Momentum
      vx: s.sumVx / normalizationFactor, 
      vy: s.sumVy / normalizationFactor,
      // Aggregates
      energy: s.totalEnergy, 
      count: s.count
    };
  });
}

// 2. Main Processing Function
export function hydrateMarketData(rawData: RawDataPoint[]): DailyFrame[] {
  
  // --- A. AUTO-SCALING ---
  // (Identifies the bounds of the raw coordinate system to map it to our canvas size)
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

    // Create a lookup for the next day to calculate velocity
    const nextDayLookup = new Map<string, RawDataPoint>();
    nextDayData.forEach(p => nextDayLookup.set(p.ticker, p));

    const nodes: HydratedNode[] = currentDayData.map(stock => {
      const nextState = nextDayLookup.get(stock.ticker);
      const vx = nextState ? nextState.x - stock.x : 0;
      const vy = nextState ? nextState.y - stock.y : 0;
      
      // Calculate Energy (Kinetic + Sentiment)
      const energy = (Math.abs(vx) + Math.abs(vy)) * (1 + Math.abs(stock.sentiment));
      
      // Look up the sector using utility
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

    // --- NEW: Calculate Sectors using corrected Weighted Centroid Logic ---
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
