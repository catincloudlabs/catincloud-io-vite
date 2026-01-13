// src/utils/processData.ts

// --- CONFIGURATION ---
const COORDINATE_SCALAR = 500; // Multiplies positions to fill the screen
// ---------------------

// 1. Define the Types based on YOUR JSON
type RawDataPoint = {
  date: string;
  ticker: string;
  x: number;
  y: number;
  headline: string;
  sentiment: number;
};

// The output format optimized for the Visualizer
export type HydratedNode = {
  ticker: string;
  x: number;
  y: number;
  vx: number;       // Velocity X (Next Day X - Current X)
  vy: number;       // Velocity Y (Next Day Y - Current Y)
  energy: number;   // The Anomaly Metric
  headline: string;
  sentiment: number;
};

export type DailyFrame = {
  date: string;
  nodes: HydratedNode[];
  // Pre-computed map for O(1) lookups during interpolation
  nodeMap: Map<string, HydratedNode>;
};

// 2. The Processing Logic
export function hydrateMarketData(rawData: RawDataPoint[]): DailyFrame[] {
  
  // --- PRE-PROCESSING: SCALING & CENTERING ---
  // A. Determine the global bounds to center the data
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  // First pass: Find bounds
  rawData.forEach(p => {
    // Safety check for bad data (NaN/Null)
    if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
    
    // Scale immediately during the bounds check
    const sx = p.x * COORDINATE_SCALAR;
    const sy = p.y * COORDINATE_SCALAR;
    
    if (sx < minX) minX = sx;
    if (sx > maxX) maxX = sx;
    if (sy < minY) minY = sy;
    if (sy > maxY) maxY = sy;
  });

  // Calculate the offset needed to move the center to (0,0)
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  // -------------------------------------------

  // B. Group data by Date
  const grouped: Record<string, RawDataPoint[]> = {};
  
  rawData.forEach(item => {
    // Safety check again
    if (typeof item.x !== 'number' || typeof item.y !== 'number') return;

    if (!grouped[item.date]) grouped[item.date] = [];
    
    // push a "clean" copy with scaled & centered coordinates
    grouped[item.date].push({
        ...item,
        x: (item.x * COORDINATE_SCALAR) - centerX,
        y: (item.y * COORDINATE_SCALAR) - centerY
    });
  });

  // C. Sort dates chronologically
  const sortedDates = Object.keys(grouped).sort();

  // D. Build the Frames
  const frames: DailyFrame[] = sortedDates.map((date, index) => {
    const currentDayData = grouped[date];
    const nextDate = sortedDates[index + 1];
    const nextDayData = nextDate ? grouped[nextDate] : [];

    // Create a lookup map for the NEXT day
    const nextDayLookup = new Map<string, RawDataPoint>();
    nextDayData.forEach(p => nextDayLookup.set(p.ticker, p));

    const nodes: HydratedNode[] = currentDayData.map(stock => {
      const nextState = nextDayLookup.get(stock.ticker);

      // Calculate Derivatives (Velocity)
      // Since coordinates are already scaled, velocity inherits that scale naturally
      const vx = nextState ? nextState.x - stock.x : 0;
      const vy = nextState ? nextState.y - stock.y : 0;

      // --- THE PHYSICS ENERGY FORMULA ---
      const movementMagnitude = Math.abs(vx) + Math.abs(vy);
      const newsIntensity = 1 + Math.abs(stock.sentiment); 
      
      const energy = movementMagnitude * newsIntensity;

      return {
        ticker: stock.ticker,
        x: stock.x,
        y: stock.y,
        vx: vx,
        vy: vy,
        energy: parseFloat(energy.toFixed(4)), 
        headline: stock.headline,
        sentiment: stock.sentiment
      };
    });

    // Create the nodeMap for this frame immediately
    const nodeMap = new Map<string, HydratedNode>();
    nodes.forEach(node => nodeMap.set(node.ticker, node));

    return {
      date,
      nodes,
      nodeMap 
    };
  });

  return frames;
}
