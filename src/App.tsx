// src/App.tsx
import { useEffect, useState, useMemo } from 'react';
import { hydrateMarketData } from './utils/processData';
import { MarketMap, MarketFrame } from './components/MarketMap'; 
import { AgentPanel } from './components/AgentPanel';
import Header from './components/Header';
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';
import Legend from './components/Legend';
import ArchitectureModal from './components/ArchitectureModal';
import BioModal from './components/BioModal';

// Import the spline math
import { catmullRom, catmullRomDerivative } from './utils/splineInterpolation';

const WATCHLIST = [
  "NVDA", "TSLA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", 
  "SPY", "QQQ", "IWM"
];

function App() {
  const [frames, setFrames] = useState<MarketFrame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Timeline State (Manual scrubbing only)
  const [timelineProgress, setTimelineProgress] = useState(0);
  
  // Interaction State
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isArchOpen, setArchOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);

  const { connections, loading } = useKnowledgeGraph(selectedTicker);

  // 1. DATA LOADING
  useEffect(() => {
    setError(null);
    fetch('/data/market_physics_history.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load data: ${response.status}`);
        const text = await response.text();
        try { return JSON.parse(text); } 
        catch (e) { throw new Error("Invalid JSON format"); }
      })
      .then((jsonPayload) => {
        if (!jsonPayload?.data) throw new Error("JSON missing 'data' field");
        // @ts-ignore - hydrateMarketData returns the enhanced DailyFrame with nodeMap
        const hydratedFrames = hydrateMarketData(jsonPayload.data);
        setFrames(hydratedFrames);
        if (hydratedFrames.length > 0) {
            setTimelineProgress(hydratedFrames.length - 1);
        }
      })
      .catch((err) => {
        console.error("Critical Data Error:", err);
        setError(err.message);
      });
  }, []);

  // 2. INTERPOLATION ENGINE (Optimized)
  const { displayNodes, displayNodeMap, currentDateLabel, currentFrameData } = useMemo(() => {
    if (!frames || frames.length === 0) {
        return { 
          displayNodes: [], 
          displayNodeMap: new Map(), 
          currentDateLabel: "INITIALIZING...", 
          currentFrameData: null 
        };
    }

    // A. Calculate Indices
    const maxIndex = frames.length - 1;
    const safeProgress = Math.max(0, Math.min(timelineProgress, maxIndex - 0.0001));
    const currentIndex = Math.floor(safeProgress);
    const t = safeProgress % 1; // Time t (0 to 1) between frames

    // B. Grab the 4 frames needed for Cubic Spline (P0, P1, P2, P3)
    // We clamp boundaries: if P0 doesn't exist, reuse P1.
    const i0 = Math.max(0, currentIndex - 1);
    const i1 = currentIndex;
    const i2 = Math.min(maxIndex, currentIndex + 1);
    const i3 = Math.min(maxIndex, currentIndex + 2);

    const f0 = frames[i0];
    const f1 = frames[i1]; // Current (Start of segment)
    const f2 = frames[i2]; // Next (End of segment)
    const f3 = frames[i3]; // Lookahead

    if (!f1) return { 
      displayNodes: [], 
      displayNodeMap: new Map(), 
      currentDateLabel: "ERROR", 
      currentFrameData: null 
    };

    // C. Interpolate every node
    const nodes = f1.nodes.map(node => {
      const ticker = node.ticker;

      // Use the Pre-Calculated Maps (O(1) Lookup)
      const p0 = f0.nodeMap.get(ticker) || node;
      const p1 = node;
      const p2 = f2.nodeMap.get(ticker) || node; 
      const p3 = f3.nodeMap.get(ticker) || p2; 

      // Apply Catmull-Rom Spline
      const smoothX = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
      const smoothY = catmullRom(p0.y, p1.y, p2.y, p3.y, t);

      // Apply Spline Derivative for smooth Velocity vectors
      const smoothVx = catmullRomDerivative(p0.x, p1.x, p2.x, p3.x, t);
      const smoothVy = catmullRomDerivative(p0.y, p1.y, p2.y, p3.y, t);

      return {
        ...node,
        x: smoothX,
        y: smoothY,
        vx: smoothVx, 
        vy: smoothVy 
      };
    });

    return { 
      displayNodes: nodes,
      displayNodeMap: f1.nodeMap, // Pass the original map to satisfy Type requirements
      currentDateLabel: f1.date, 
      currentFrameData: f1 
    };
  }, [frames, timelineProgress]);

  // 3. ERROR & LOADING STATES
  if (error) return (
    <div className="app-error-container">
      <h1 className="app-error-title">System Error</h1>
      <p className="app-error-msg">{error}</p>
      <button onClick={() => window.location.reload()} className="app-retry-btn">Retry</button>
    </div>
  );

  if (!frames) return (
    <div className="app-loading-container">
      <h1 className="app-loading-text">INITIALIZING ENGINE...</h1>
    </div>
  );

  // 4. RENDER
  return (
    <div className="app-root">
      <MarketMap 
        data={{ 
            date: currentDateLabel, 
            nodes: displayNodes, 
            nodeMap: displayNodeMap 
        }} 
        // @ts-ignore - MarketFrame vs DailyFrame type compatibility
        history={frames || []}
        onNodeClick={(node) => setSelectedTicker(node.ticker)}
        onBackgroundClick={() => setSelectedTicker(null)}
        selectedTicker={selectedTicker}      
        graphConnections={connections}       
      />

      <Header 
        dateLabel={currentDateLabel} 
        onOpenArch={() => setArchOpen(true)}
        onOpenBio={() => setBioOpen(true)}
        selectedTicker={selectedTicker}
        onSelectTicker={setSelectedTicker}
        watchlist={WATCHLIST}
      />

      <Legend />

      <div className="agent-panel-wrapper">
        <AgentPanel 
          currentFrame={currentFrameData} 
          selectedTicker={selectedTicker}
          graphConnections={connections}
          isLoading={loading}
        />
      </div>

      <div className="timeline-slider-container">
        <div className="slider-label-row">
          <span>HISTORY</span>
          <span>SIMULATION PROGRESS</span>
          <span>TODAY</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max={Math.max(0, frames.length - 1)} 
          step="0.01" // High resolution for smooth sliding
          value={timelineProgress}
          onChange={(e) => setTimelineProgress(parseFloat(e.target.value))}
          aria-label="Simulation Timeline"
          className="slider-input"
        />
      </div>

      <ArchitectureModal isOpen={isArchOpen} onClose={() => setArchOpen(false)} />
      <BioModal isOpen={isBioOpen} onClose={() => setBioOpen(false)} />
    </div>
  );
}

export default App;
