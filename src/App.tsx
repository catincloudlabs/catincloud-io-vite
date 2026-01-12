import { useEffect, useState, useMemo } from 'react';
import { hydrateMarketData } from './utils/processData';
import { MarketMap, HydratedNode, MarketFrame } from './components/MarketMap';
import { AgentPanel } from './components/AgentPanel';
import Header from './components/Header';
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';

// NEW: Legend Component
import Legend from './components/Legend';

import ArchitectureModal from './components/ArchitectureModal';
import BioModal from './components/BioModal';

export type { MarketFrame, HydratedNode };

// MAG 7 + KEY INDICES
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

  // The brain hook
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
        
        // 1. Set Data
        setFrames(hydratedFrames);
        
        // 2. Set Default Time to "NOW" (The end of the dataset)
        if (hydratedFrames.length > 0) {
            setTimelineProgress(hydratedFrames.length - 1);
        }
      })
      .catch((err) => {
        console.error("Critical Data Error:", err);
        setError(err.message);
      });
  }, []);

  const { displayNodes, currentDateLabel, currentFrameData } = useMemo(() => {
    if (!frames || frames.length === 0) {
        return { displayNodes: [], currentDateLabel: "INITIALIZING...", currentFrameData: null };
    }
    const safeProgress = Math.min(timelineProgress, frames.length - 1.0001);
    const frameIndex = Math.floor(safeProgress);
    const dayProgress = safeProgress % 1; 
    const currentFrame = frames[frameIndex] || frames[frames.length - 1];

    if (!currentFrame) return { displayNodes: [], currentDateLabel: "ERROR", currentFrameData: null };

    const nodes = currentFrame.nodes.map(node => ({
      ...node,
      x: node.x + (node.vx * dayProgress),
      y: node.y + (node.vy * dayProgress),
    }));

    return { displayNodes: nodes, currentDateLabel: currentFrame.date, currentFrameData: currentFrame };
  }, [frames, timelineProgress]);

  // ERROR STATE
  if (error) return (
    <div className="app-error-container">
      <h1 className="app-error-title">System Error</h1>
      <p className="app-error-msg">{error}</p>
      <button onClick={() => window.location.reload()} className="app-retry-btn">Retry</button>
    </div>
  );

  // LOADING STATE
  if (!frames) return (
    <div className="app-loading-container">
      <h1 className="app-loading-text">INITIALIZING ENGINE...</h1>
    </div>
  );

  return (
    <div className="app-root">
      
      {/* Map Layer */}
      <MarketMap 
        data={{ date: currentDateLabel, nodes: displayNodes }} 
        history={frames || []}
        onNodeClick={(node) => setSelectedTicker(node.ticker)}
        onBackgroundClick={() => setSelectedTicker(null)}
        selectedTicker={selectedTicker}      
        graphConnections={connections}       
      />

      {/* Header */}
      <Header 
        dateLabel={currentDateLabel} 
        onOpenArch={() => setArchOpen(true)}
        onOpenBio={() => setBioOpen(true)}
        selectedTicker={selectedTicker}
        onSelectTicker={setSelectedTicker}
        watchlist={WATCHLIST}
      />

      {/* Legend (Bottom Left) */}
      <Legend />

      {/* Agent Panel (Bottom Right) */}
      <div className="agent-panel-wrapper">
        <AgentPanel 
          currentFrame={currentFrameData} 
          selectedTicker={selectedTicker}
          graphConnections={connections}
          isLoading={loading}
        />
      </div>

      {/* Slider */}
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
          step="0.01" 
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
