import { useEffect, useState, useMemo } from 'react';
import { hydrateMarketData } from './utils/processData';
import { MarketMap, MarketFrame } from './components/MarketMap'; 
import { AgentPanel } from './components/AgentPanel';
import Header from './components/Header';
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';
import Legend from './components/Legend';
import ArchitectureModal from './components/ArchitectureModal';
import BioModal from './components/BioModal';
import { useTimelineAnimation } from './hooks/useTimelineAnimation';
import { Play, Pause } from 'lucide-react'; 
import { FilterState } from './components/FilterMenu'; 
import { catmullRom, catmullRomDerivative } from './utils/splineInterpolation';

/* --- CONFIGURATION: Anchor Assets --- */
const ANCHOR_TICKERS = new Set([
  "SPY", "QQQ", "IWM", "DIA", 
  "AAPL", "MSFT", "NVDA", "GOOGL", 
  "AMZN", "META", "TSLA", 
  "JPM", "V", "UNH", "XOM"
]);

/* --- CONFIGURATION: Watchlist --- */
const WATCHLIST = [
    "A", "AAL", "AAPL", "ABBV", "ABNB", "ABT", "ACGL", "ACN", "ADBE", "ADI", 
    "ADM", "ADP", "ADSK", "AEE", "AEP", "AES", "AFL", "AFRM", "AGG", "AI", 
    "AIG", "AIZ", "AJG", "AKAM", "ALB", "ALGN", "ALL", "ALLE", "AMAT", "AMC", 
    "AMCR", "AMD", "AME", "AMGN", "AMP", "AMT", "AMZN", "ANET", "ANSS", "AON", 
    "AOS", "APA", "APD", "APH", "APP", "APTV", "ARE", "ARES", "ARM", "ASML", 
    "ASTS", "ATO", "AVB", "AVGO", "AVY", "AWK", "AXON", "AXP", "AZO", "BA", 
    "BABA", "BAC", "BALL", "BAX", "BB", "BBWI", "BBY", "BCS", "BDX", "BEN", 
    "BF.B", "BG", "BIIB", "BIO", "BK", "BKNG", "BKR", "BLK", "BMY", "BND", 
    "BR", "BRK.B", "BRO", "BSX", "BWA", "BX", "BXP", "BYND", "C", "CAG", 
    "CAH", "CARR", "CAT", "CB", "CBOE", "CBRE", "CCI", "CCL", "CDAY", "CDNS", 
    "CDW", "CE", "CEG", "CF", "CFG", "CHD", "CHPT", "CHRW", "CHTR", "CHWY", 
    "CI", "CINF", "CL", "CLX", "CMCSA", "CME", "CMG", "CMI", "CMS", "CNC", 
    "CNH", "CNP", "COF", "COIN", "COO", "COP", "COR", "COST", "CPRT", "CPT", 
    "CRL", "CRM", "CRWD", "CSCO", "CSGP", "CSX", "CTAS", "CTLT", "CTRA", "CTSH", 
    "CTVA", "CVNA", "CVS", "CVX", "CZR", "D", "DAL", "DASH", "DBC", "DD", 
    "DE", "DELL", "DFS", "DG", "DGX", "DHI", "DHR", "DIA", "DIS", "DJT", 
    "DKNG", "DLR", "DLTR", "DOV", "DOW", "DPZ", "DRI", "DTE", "DUK", "DVA", 
    "DVN", "DXCM", "EA", "EBAY", "ECL", "ED", "EFX", "EG", "EIX", "EL", 
    "ELV", "EMN", "EMR", "ENPH", "EOG", "EPAM", "EQIX", "EQR", "EQT", "ERIE", 
    "ES", "ESS", "ETN", "ETR", "ETSY", "EVRG", "EW", "EXC", "EXPD", "EXPE", 
    "EXR", "F", "FANG", "FAST", "FCX", "FDS", "FDX", "FE", "FFIV", "FI", 
    "FICO", "FIS", "FITB", "FLT", "FMC", "FOX", "FOXA", "FRT", "FSLR", "FTNT", 
    "FTV", "FUBO", "GD", "GDDY", "GE", "GEHC", "GEV", "GILD", "GIS", "GL", 
    "GLD", "GLW", "GM", "GME", "GNRC", "GOOG", "GOOGL", "GPC", "GPN", "GRMN", 
    "GS", "GWW", "HAL", "HAS", "HBAN", "HCA", "HD", "HES", "HIG", "HII", 
    "HIMS", "HLT", "HOLX", "HON", "HOOD", "HPE", "HPQ", "HRL", "HSIC", "HST", 
    "HSY", "HUBB", "HUM", "HWM", "HYG", "IBM", "IBIT", "ICE", "IDXX", "IEF", 
    "IEX", "IFF", "IGP", "ILMN", "INCY", "INTC", "INTU", "INVH", "IONQ", "IP", 
    "IPG", "IQV", "IR", "IRM", "ISRG", "IT", "ITB", "ITW", "IVZ", "IWM", 
    "J", "JBHT", "JCI", "JD", "JETS", "JKHY", "JNJ", "JNPR", "JPM", "K", 
    "KBE", "KDP", "KEY", "KEYS", "KHC", "KIM", "KKR", "KLAC", "KMB", "KMI", 
    "KMX", "KO", "KR", "KRE", "KVUE", "L", "LABD", "LABU", "LCID", "LDOS", 
    "LEN", "LH", "LHX", "LIN", "LKQ", "LLY", "LMT", "LNT", "LOW", "LQD", 
    "LRCX", "LULU", "LUNR", "LUV", "LVS", "LW", "LYB", "LYV", "MA", "MAA", 
    "MAR", "MARA", "MAS", "MCD", "MCHP", "MCK", "MCO", "MDLZ", "MDT", "MET", 
    "META", "MGM", "MHK", "MKC", "MKTX", "MLM", "MMC", "MMM", "MNST", "MO", 
    "MOH", "MOS", "MPC", "MPWR", "MRK", "MRNA", "MRO", "MRVL", "MS", "MSCI", 
    "MSFT", "MSI", "MSTR", "MTB", "MTCH", "MTD", "MU", "NCLH", "NDAQ", "NDSN", 
    "NEE", "NEM", "NFLX", "NI", "NKLA", "NKE", "NOC", "NOW", "NRG", "NSC", 
    "NTAP", "NTRS", "NUE", "NVDA", "NVR", "NWS", "NWSA", "NXPI", "O", "ODFL", 
    "OGN", "OKE", "OMC", "ON", "OPEN", "ORCL", "ORLY", "OTIS", "OXY", "PANW", 
    "PARA", "PAYC", "PAYX", "PCAR", "PCG", "PDD", "PEAK", "PEG", "PEP", "PFE", 
    "PFG", "PG", "PGR", "PH", "PHM", "PKG", "PLD", "PLTR", "PM", "PNC", 
    "PNR", "PNW", "PODD", "POOL", "PPG", "PPL", "PRU", "PSA", "PSX", "PTC", 
    "PTON", "PWR", "PXD", "PYPL", "QCOM", "QQQ", "QRVO", "QS", "RBLX", "RCL", 
    "RDDT", "REG", "REGN", "RF", "RHI", "RJF", "RKLB", "RL", "RMD", "RIVN", 
    "ROK", "ROL", "ROP", "ROST", "RSG", "RTX", "RVTY", "SBAC", "SBUX", "SCHW", 
    "SEE", "SHW", "SHY", "SJM", "SLB", "SLV", "SMH", "SNA", "SNPS", "SO", 
    "SOFI", "SOLV", "SOUN", "SOXL", "SOXS", "SOXX", "SPCE", "SPG", "SPGI", 
    "SPXU", "SPY", "SQ", "SQQQ", "SRE", "STE", "STLD", "STM", "STT", "STX", 
    "STZ", "SWK", "SWKS", "SYF", "SYK", "SYY", "T", "TAP", "TDG", "TDY", 
    "TECH", "TEL", "TER", "TFC", "TFX", "TGT", "TJX", "TLR", "TLRY", "TLT", 
    "TMF", "TMO", "TMUS", "TMV", "TPR", "TQQQ", "TRGP", "TRMB", "TROW", "TRV", 
    "TSCO", "TSLA", "TSM", "TSN", "TT", "TTD", "TTWO", "TXN", "TXT", "TYL", 
    "U", "UAL", "UDR", "UHS", "ULTA", "UNG", "UNH", "UNP", "UPS", "UPRO", 
    "UPST", "URI", "USB", "USO", "UVXY", "V", "VEA", "VFC", "VICI", "VIXY", 
    "VLO", "VLTO", "VMC", "VNO", "VOO", "VRSK", "VRSN", "VRT", "VRTX", "VTI", 
    "VTR", "VTRS", "VST", "VWO", "VXX", "VZ", "WAB", "WAT", "WBA", "WBD", 
    "WDC", "WDAY", "WEC", "WELL", "WFC", "WHR", "WM", "WMB", "WMT", "WRB", 
    "WRK", "WSM", "WST", "WTW", "WY", "WYNN", "XBI", "XEL", "XLB", "XLC", 
    "XLE", "XLF", "XLI", "XLK", "XLP", "XLRE", "XLU", "XLV", "XLY", "XOM", 
    "XRAY", "XYL", "YUM", "ZBH", "ZBRA", "ZION", "ZTS"
];

function App() {
  const [frames, setFrames] = useState<MarketFrame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State: Filters
  const [filters, setFilters] = useState<FilterState>({
    minEnergy: 0,
    visibleSectors: new Set(),
    showPositive: true,
    showNeutral: false,
    showNegative: true
  });

  // State: Timeline & Interaction
  const { 
    progress: timelineProgress, 
    setProgress: setTimelineProgress, 
    isPlaying, 
    togglePlay 
  } = useTimelineAnimation({ 
    totalFrames: frames ? frames.length : 100,
    durationInSeconds: 150
  });
  
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isArchOpen, setArchOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);

  const { connections, loading } = useKnowledgeGraph(selectedTicker);

  // Memo: Derived Sector List
  const availableSectors = useMemo(() => {
    if (!frames || frames.length === 0) return [];
    const sectors = new Set<string>();
    frames[frames.length - 1].nodes.forEach(n => {
        if (n.sector) sectors.add(n.sector);
    });
    return Array.from(sectors).sort();
  }, [frames]);

  /* --- DATA PIPELINE --- */
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

  /* --- INTERPOLATION ENGINE --- */
  const { displayNodes, displayNodeMap, currentDateLabel, currentFrameData } = useMemo(() => {
    if (!frames || frames.length === 0) {
        return { 
          displayNodes: [], 
          displayNodeMap: new Map(), 
          currentDateLabel: "INITIALIZING...", 
          currentFrameData: null 
        };
    }

    const maxIndex = frames.length - 1;
    const safeProgress = Math.max(0, Math.min(timelineProgress, maxIndex - 0.0001));
    const currentIndex = Math.floor(safeProgress);
    const t = safeProgress % 1; 

    // Spline Control Points
    const i0 = Math.max(0, currentIndex - 1);
    const i1 = currentIndex;
    const i2 = Math.min(maxIndex, currentIndex + 1);
    const i3 = Math.min(maxIndex, currentIndex + 2);

    const f0 = frames[i0];
    const f1 = frames[i1]; 
    const f2 = frames[i2]; 
    const f3 = frames[i3]; 

    if (!f1) return { displayNodes: [], displayNodeMap: new Map(), currentDateLabel: "ERROR", currentFrameData: null };

    const frameMaxEnergy = Math.max(...f1.nodes.map(n => n.energy), 1); 

    const nodes = f1.nodes
      .map(node => {
        // FILTER: Anchors bypass filters
        const isAnchor = ANCHOR_TICKERS.has(node.ticker);

        if (!isAnchor) {
            // SECTOR
            if (filters.visibleSectors.size > 0 && node.sector && !filters.visibleSectors.has(node.sector)) {
                return null; 
            }

            // SENTIMENT
            const s = node.sentiment;
            const isPos = s > 0.1;
            const isNeg = s < -0.1;
            const isNeu = !isPos && !isNeg;

            if (isPos && !filters.showPositive) return null;
            if (isNeg && !filters.showNegative) return null;
            if (isNeu && !filters.showNeutral) return null;

            // ENERGY (Signal Strength)
            const energyPercent = (node.energy / frameMaxEnergy) * 100;
            if (energyPercent < filters.minEnergy) return null;
        }

        // PHYSICS: Catmull-Rom Spline
        const ticker = node.ticker;
        const p0 = f0.nodeMap.get(ticker) || node;
        const p1 = node;
        const p2 = f2.nodeMap.get(ticker) || node; 
        const p3 = f3.nodeMap.get(ticker) || p2; 

        const smoothX = catmullRom(p0.x, p1.x, p2.x, p3.x, t);
        const smoothY = catmullRom(p0.y, p1.y, p2.y, p3.y, t);
        const smoothVx = catmullRomDerivative(p0.x, p1.x, p2.x, p3.x, t);
        const smoothVy = catmullRomDerivative(p0.y, p1.y, p2.y, p3.y, t);

        return {
          ...node,
          x: smoothX,
          y: smoothY,
          vx: smoothVx, 
          vy: smoothVy 
        };
      })
      .filter(Boolean);

    // @ts-ignore
    const finalNodes = nodes as import('./components/MarketMap').HydratedNode[];

    return { 
      displayNodes: finalNodes,
      displayNodeMap: f1.nodeMap, 
      currentDateLabel: f1.date, 
      currentFrameData: f1 
    };
  }, [frames, timelineProgress, filters]); 

  // RENDER: Error & Loading
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

  // RENDER: Main App
  return (
    <div className="app-root">
      <MarketMap 
        data={{ 
            date: currentDateLabel, 
            nodes: displayNodes, 
            nodeMap: displayNodeMap,
            sectors: currentFrameData?.sectors || [] 
        }} 
        // @ts-ignore
        history={frames || []}
        onNodeClick={(node) => setSelectedTicker(node.ticker)}
        onBackgroundClick={() => setSelectedTicker(null)}
        selectedTicker={selectedTicker}      
        graphConnections={connections}
        isPlaying={isPlaying}       
      />

      <Header 
        dateLabel={currentDateLabel} 
        onOpenArch={() => setArchOpen(true)}
        onOpenBio={() => setBioOpen(true)}
        selectedTicker={selectedTicker}
        onSelectTicker={setSelectedTicker}
        watchlist={WATCHLIST}
        availableSectors={availableSectors}
        filters={filters}
        setFilters={setFilters}
      />

      <Legend />
      
      <button 
          onClick={togglePlay} 
          className={`floating-play-btn ${isPlaying ? 'playing' : ''}`}
          title={isPlaying ? "Pause Simulation" : "Play History"}
      >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
      </button>

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
            <span>{isPlaying ? "SIMULATING..." : "SIMULATION PROGRESS"}</span>
            <span>TODAY</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max={Math.max(0, frames.length - 1)} 
          step="0.01"
          value={timelineProgress}
          onChange={(e) => {
              if (isPlaying) togglePlay();
              setTimelineProgress(parseFloat(e.target.value));
          }}
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
