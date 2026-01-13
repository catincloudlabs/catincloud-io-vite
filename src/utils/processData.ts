// src/utils/processData.ts

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
  // NEW: Pre-computed map for O(1) lookups during interpolation
  nodeMap: Map<string, HydratedNode>;
};

// 2. The Processing Logic
export function hydrateMarketData(rawData: RawDataPoint[]): DailyFrame[] {
  // A. Group data by Date
  const grouped: Record<string, RawDataPoint[]> = {};
  
  rawData.forEach(item => {
    if (!grouped[item.date]) grouped[item.date] = [];
    grouped[item.date].push(item);
  });

  // B. Sort dates chronologically to ensure flow direction is correct
  const sortedDates = Object.keys(grouped).sort();

  // C. Build the Frames
  const frames: DailyFrame[] = sortedDates.map((date, index) => {
    const currentDayData = grouped[date];
    const nextDate = sortedDates[index + 1];
    const nextDayData = nextDate ? grouped[nextDate] : [];

    // Create a lookup map for the NEXT day for O(1) velocity calculation
    const nextDayLookup = new Map<string, RawDataPoint>();
    nextDayData.forEach(p => nextDayLookup.set(p.ticker, p));

    const nodes: HydratedNode[] = currentDayData.map(stock => {
      const nextState = nextDayLookup.get(stock.ticker);

      // Calculate Derivatives (Velocity)
      // If there is no data for tomorrow (delisted or end of dataset), velocity is 0
      const vx = nextState ? nextState.x - stock.x : 0;
      const vy = nextState ? nextState.y - stock.y : 0;

      // --- THE PHYSICS ENERGY FORMULA ---
      // Concept: Distance Moved * (News Intensity)
      // High movement + High News Volume = High Energy (Anomaly)
      const movementMagnitude = Math.abs(vx) + Math.abs(vy);
      const newsIntensity = 1 + Math.abs(stock.sentiment); // Scale 1.0 to 2.0
      
      const energy = movementMagnitude * newsIntensity;

      return {
        ticker: stock.ticker,
        x: stock.x,
        y: stock.y,
        vx: vx,
        vy: vy,
        energy: parseFloat(energy.toFixed(4)), // Keep file size manageable
        headline: stock.headline,
        sentiment: stock.sentiment
      };
    });

    // NEW: Create the nodeMap for this frame immediately
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
