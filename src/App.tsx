import { useEffect, useState, useMemo } from 'react';
import { hydrateMarketData } from './utils/processData';
import { MarketMap, HydratedNode, MarketFrame } from './components/MarketMap';
import { AgentPanel } from './components/AgentPanel';
import Header from './components/Header';
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';
import Legend from './components/Legend';
import ArchitectureModal from './components/ArchitectureModal';
import BioModal from './components/BioModal';

// NEW: Import the spline math
import { catmullRom, catmullRomDerivative } from './utils/splineInterpolation';

export type { MarketFrame, HydratedNode };

const WATCHLIST = [
  "NVDA", "TSLA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", 
  "SPY", "QQQ", "IWM"
];

function App() {
  const [frames, setFrames] = useState<MarketFrame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timelineProgress, setTimelineProgress] = useState(0);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const [isArchOpen, setArchOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);

  const { connections, loading } = useKnowledgeGraph(selectedTicker);

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
        // @ts-ignore
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

  // --- UPDATED INTERPOLATION ENGINE ---
  const { displayNodes, currentDateLabel, currentFrameData } = useMemo(() => {
    if (!frames || frames.length === 0) {
        return { displayNodes: [], currentDateLabel: "INITIALIZING...", currentFrameData: null };
    }

    // 1. Calculate Indices
    const maxIndex = frames.length - 1;
    const safeProgress = Math.max(0, Math.min(timelineProgress, maxIndex - 0.0001));
    const currentIndex = Math.floor(safeProgress);
    const t = safeProgress % 1; // Time t (0 to 1) between frames

    // 2. Grab the 4 frames needed for Cubic Spline (P0, P1, P2, P3)
    // We clamp boundaries: if P0 doesn't exist, reuse P1.
    const f0 = frames[Math.max(0, currentIndex - 1)];       // Previous
    const f1 = frames[currentIndex];                        // Current (Start of segment)
    const f2 = frames[Math.min(maxIndex, currentIndex + 1)];// Next (End of segment)
    const f3 = frames[Math.min(maxIndex, currentIndex + 2)];// Lookahead

    if (!f1) return { displayNodes: [], currentDateLabel: "ERROR", currentFrameData: null };

    // 3. Create Lookups for O(1) access to neighbors
    // Performance Note: creating Maps every frame is okay for <1000 nodes.
    const map0 = new Map(f0.nodes.map(n => [n.ticker, n]));
    const map2 = new Map(f2.nodes.map(n => [n.ticker, n]));
    const map3 = new Map(f3.nodes.map(n => [n.ticker, n]));

    // 4. Interpolate every node
    const nodes = f1.nodes.map(node => {
      const ticker = node.ticker;

      // Get neighbors. Fallback to current node if neighbor is missing (e.g. IPOs or delistings)
      const p0 = map0.get(ticker) || node;
      const p1 = node;
      const p2 = map2.get(ticker) || node;
      const p3 = map3.get(ticker) || p2; // Fallback to p2 if p3 missing

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
        // Overwrite linear velocity with instantaneous curve velocity
        // This makes the arrows in MarketMap point exactly along the curve path
        vx: smoothVx, 
        vy: smoothVy 
      };
    });

    return { 
      displayNodes: nodes, 
      currentDateLabel: f1.date, 
      currentFrameData: f1 
    };
  }, [frames, timelineProgress]);

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

  return (
    <div className="app-root">
      <MarketMap 
        data={{ date: currentDateLabel, nodes: displayNodes }} 
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
