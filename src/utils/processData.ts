// src/utils/processData.ts

// --- CONFIGURATION ---
// We target a "world size" of 800 units (-400 to +400).
// This fits perfectly with your DeckGL camera zoom levels.
const TARGET_WORLD_SIZE = 800; 
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
  
  // --- STEP 1: SCAN FOR BOUNDS ---
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  // First pass: Find raw min/max
  rawData.forEach(p => {
    // Safety check for bad data
    if (typeof p.x !== 'number' || typeof p.y !== 'number') return;
    
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  // --- STEP 2: CALCULATE AUTO-SCALAR ---
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;
  const maxRange = Math.max(rangeX, rangeY);

  // Prevent divide by zero if data is empty or single point
  const safeRange = maxRange === 0 ? 1 : maxRange;

  // This magic number scales YOUR specific data to exactly 800 units wide
  const scaleFactor = TARGET_WORLD_SIZE / safeRange;

  // Calculate center to shift (0,0) to the middle
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterY = (minY + maxY) / 2;

  // Debug log to see what happened (Check your browser console!)
  console.log(`[Data Processing] Auto-Scaled Data: 
    Raw Range: ${safeRange.toFixed(4)} 
    Calculated Scalar: ${scaleFactor.toFixed(2)}`);

  // --- STEP 3: GROUP DATA ---
  const grouped: Record<string, RawDataPoint[]> = {};
  
  rawData.forEach(item => {
    if (typeof item.x !== 'number' || typeof item.y !== 'number') return;

    if (!grouped[item.date]) grouped[item.date] = [];
    
    // NORMALIZE: (Value - Center) * Scalar
    // This moves the cloud to 0,0 and stretches it to fill the screen
    grouped[item.date].push({
        ...item,
        x: (item.x - rawCenterX) * scaleFactor,
        y: (item.y - rawCenterY) * scaleFactor
    });
  });

  // --- STEP 4: BUILD FRAMES ---
  const sortedDates = Object.keys(grouped).sort();

  const frames: DailyFrame[] = sortedDates.map((date, index) => {
    const currentDayData = grouped[date];
    const nextDate = sortedDates[index + 1];
    const nextDayData = nextDate ? grouped[nextDate] : [];

    const nextDayLookup = new Map<string, RawDataPoint>();
    nextDayData.forEach(p => nextDayLookup.set(p.ticker, p));

    const nodes: HydratedNode[] = currentDayData.map(stock => {
      const nextState = nextDayLookup.get(stock.ticker);

      // Velocity inherits the perfect scaling automatically
      const vx = nextState ? nextState.x - stock.x : 0;
      const vy = nextState ? nextState.y - stock.y : 0;

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
