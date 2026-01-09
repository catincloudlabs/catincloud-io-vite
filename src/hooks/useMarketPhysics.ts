import { useState, useEffect, useMemo, useRef } from 'react';
import { group } from 'd3-array';

// --- TYPE DEFINITIONS ---
export interface MarketParticle {
  date: string;       // "YYYY-MM-DD"
  ticker: string;     // "AAPL"
  x: number;          // t-SNE coordinate
  y: number;          // t-SNE coordinate
  headline: string;   // "News title..."
  sentiment: number;  // -1.0 to 1.0
  velocity?: number;  // Calculated: speed of movement
}

// Map: Date -> Ticker -> Data
type PhysicsFrameMap = Record<string, Record<string, MarketParticle>>;

// CONFIG
const PLAYBACK_SPEED_MS = 800; // Time per "day" in milliseconds

export const useMarketPhysics = (rawData: MarketParticle[]) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  
  // Use a ref for the interval to ensure clean cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Transform Data: Group by Date & Calculate Velocity
  const { timeline, dateMap, tickerUniverse } = useMemo(() => {
    // Safety check for empty data
    if (!rawData || rawData.length === 0) {
      return { timeline: [], dateMap: {}, tickerUniverse: [] };
    }

    // A. Group by Date using d3-array
    // Returns a Map<string, MarketParticle[]>
    const grouped = group(rawData, (d) => d.date);
    
    // Sort dates chronologically
    const sortedDates = Array.from(grouped.keys()).sort();
    
    // Extract unique tickers
    const tickers = Array.from(new Set(rawData.map((d) => d.ticker)));

    // B. Build Lookup Map & Calculate Velocity
    const map: PhysicsFrameMap = {};
    
    sortedDates.forEach((date, i) => {
      map[date] = {};
      const dayData = grouped.get(date) || [];
      
      dayData.forEach((item) => {
        let velocity = 0;
        
        // If not the first day, compare with previous day's position
        if (i > 0) {
          const prevDate = sortedDates[i - 1];
          const prevItem = map[prevDate]?.[item.ticker];
          
          if (prevItem) {
            const dx = item.x - prevItem.x;
            const dy = item.y - prevItem.y;
            velocity = Math.sqrt(dx * dx + dy * dy);
          }
        }

        // Store enhanced particle
        map[date][item.ticker] = {
          ...item,
          velocity,
        };
      });
    });

    return { timeline: sortedDates, dateMap: map, tickerUniverse: tickers };
  }, [rawData]);

  // 2. Animation Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentDateIndex((prev) => {
          // Stop if we reach the end
          if (prev >= timeline.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, PLAYBACK_SPEED_MS);
    } else {
      // Clear timer if paused
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeline.length]);

  // 3. Current Frame Helpers
  // Safe access in case data hasn't loaded yet
  const currentDate = timeline[currentDateIndex] || "";
  const currentFrameData = dateMap[currentDate] || {};

  // Controls
  const stepForward = () => setCurrentDateIndex((i) => Math.min(i + 1, timeline.length - 1));
  const stepBack = () => setCurrentDateIndex((i) => Math.max(0, i - 1));
  const seek = (index: number) => setCurrentDateIndex(index);

  return {
    currentDate,
    currentDateIndex,
    timeline,
    currentFrameData, // The actual data for the current day
    tickerUniverse,
    controls: { isPlaying, setIsPlaying, stepForward, stepBack, seek }
  };
};
