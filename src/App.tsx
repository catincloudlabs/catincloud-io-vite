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
  // --- MEGA CAP & TECH ---
  "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "BRK.B", "LLY", "AVGO", "JPM",
  
  // --- SEMICONDUCTORS & HARDWARE ---
  "AMD", "QCOM", "TXN", "INTC", "AMAT", "MU", "LRCX", "ADI", "KLAC", "MRVL", "SNPS", 
  "CDNS", "PANW", "CRWD", "PLTR", "SMCI", "ARM", "TSM", "ASML", "ON", "MCHP", "STM",
  
  // --- SOFTWARE & CLOUD ---
  "ORCL", "ADBE", "CRM", "INTU", "IBM", "NOW", "UBER", "SAP", "FI", "ADP", "ACN", 
  "CSCO", "SQ", "SHOP", "WDAY", "SNOW", "TEAM", "ADSK", "DDOG", "ZM", "NET", "TTD",
  "MDB", "ZS", "GIB", "FICO", "ANET", "ESTC",

  // --- FINANCIALS & PAYMENTS ---
  "V", "MA", "BAC", "WFC", "MS", "GS", "C", "BLK", "SPGI", "AXP", "MCO", "PGR", "CB", 
  "MMC", "AON", "USB", "PNC", "TFC", "COF", "DFS", "PYPL", "AFRM", "HOOD", "COIN",
  "KKR", "BX", "APO", "TRV", "ALL", "HIG", "MET",

  // --- HEALTHCARE ---
  "UNH", "JNJ", "ABBV", "MRK", "TMO", "ABT", "DHR", "PFE", "AMGN", "ISRG", "ELV", 
  "VRTX", "REGN", "ZTS", "BSX", "BDX", "GILD", "HCA", "MCK", "CI", "HUM", "CVS", 
  "BMY", "SYK", "EW", "MDT", "DXCM", "ILMN", "ALGN", "BIIB", "MRNA", "BNTX", "NVO",

  // --- CONSUMER & RETAIL ---
  "WMT", "PG", "COST", "HD", "KO", "PEP", "MCD", "DIS", "NKE", "SBUX", "LOW", "PM", 
  "TGT", "TJX", "EL", "CL", "MO", "LULU", "CMG", "MAR", "BKNG", "ABNB", "HLT", "YUM",
  
  // --- INDUSTRIALS & ENERGY ---
  "DE", "CAT", "HON", "GE", "MMM", "ETN", "ITW", "EMR", "PH", "CMI", "PCAR", "TT",
  "XOM", "CVX", "COP", "SLB", "EOG", "MPC", "PSX", "VLO", "OXY", "HES", "KMI", "WMB",
  "LMT", "RTX", "BA", "GD", "NOC", "LHX", "TDG", "WM", "RSG", "UNP", "CSX", "NSC",
  "DAL", "UAL", "AAL", "LUV", "FDX", "UPS",

  // --- SPECIAL THEMES (AI Power, Infra, Crypto, Space) ---
  "VST", "CEG", "NRG", "VRT",           // AI Power
  "EQIX", "DLR", "AMT",                 // Data Center Infra
  "MSTR", "IBIT", "MARA",               // Crypto High Beta
  "RKLB", "ASTS",                       // Space
  "BABA", "PDD",                        // Global Tech

  // --- ETFS ---
  "SPY", "QQQ", "IWM", "DIA", "VTI", "VOO", "VEA", "VWO",
  "XLK", "XLV", "XLF", "XLE", "XLC", "XLY", "XLP", "XLI", "XLU", "XLB", "XLRE",
  "SMH", "SOXX", "XBI", "KRE", "KBE", "JETS", "ITB",
  "TLT", "IEF", "SHY", "LQD", "HYG", "AGG", "BND",
  "GLD", "SLV", "USO", "UNG", "DBC",
  "VIXY", "UVXY", "VXX", "TQQQ", "SQQQ", "SOXL", "SOXS", "SPXU", "UPRO", "LABU", "LABD", "TMF", "TMV"
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
            nodeMap: displayNodeMap,
            // --- Pass sectors from the current frame ---
            sectors: currentFrameData?.sectors || [] 
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
