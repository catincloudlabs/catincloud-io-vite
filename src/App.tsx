// src/App.tsx
import React, { useEffect, useState } from 'react';
import MarketMap from './components/MarketMap';
import { processMarketData, MarketFrame, RawDataPoint } from './utils/processData';
import { useTimelineAnimation } from './hooks/useTimelineAnimation';

const parseCSV = (csvText: string): RawDataPoint[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',');
  const parsedData: RawDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].trim();
      });
      
      parsedData.push({
        date: row.date,
        time: row.time,
        symbol: row.symbol,
        xi: parseFloat(row.xi),
        h_eff: parseFloat(row.h_eff),
        h_c: parseFloat(row.h_c),
        merton_distance: parseFloat(row.merton_distance),
        phase: row.phase as 'ELASTIC' | 'SUPERCRITICAL' | 'BALLISTIC',
      });
    }
  }
  return parsedData;
};

function App() {
  const [marketFrames, setMarketFrames] = useState<MarketFrame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch and Process Data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetching the newly uploaded CSV instead of JSON
        const response = await fetch('/data/systemic_stress_results_final.csv');
        const csvText = await response.text();
        
        // Parse CSV text into heavily typed RawDataPoint objects
        const rawData: RawDataPoint[] = parseCSV(csvText);

        // Pipe into our Phase Space topological topology mapper
        const processed = processMarketData(rawData);
        setMarketFrames(processed);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load market physics CSV:", error);
      }
    };

    loadData();
  }, []);

  // Initialize Timeline Physics
  const {
    currentFrameIndex,
    setProgress,
    isPlaying,
    togglePlay
  } = useTimelineAnimation({
    totalFrames: marketFrames.length,
    durationInSeconds: 45 // Adjust playback speed here
  });

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <h2 style={styles.loadingText}>INITIALIZING THERMODYNAMIC MANIFOLD...</h2>
      </div>
    );
  }

  const currentFrame = marketFrames[currentFrameIndex];

  return (
    <div style={styles.container}>
      {/* WebGL Phase Space Background */}
      <MarketMap data={currentFrame} />

      {/* UI Overlay */}
      <div style={styles.uiOverlay}>
        
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>CatInCloud Labs: Protocol #1</h1>
          <p style={styles.subtitle}>Endogenous Phase Transitions in Market Microstructure</p>
        </div>

        {/* Playback Controls */}
        <div style={styles.controlsContainer}>
          <div style={styles.timeDisplay}>
            <span style={styles.dateText}>
              {currentFrame?.date.split(' ')[0]} {/* YYYY-MM-DD */}
            </span>
            <span style={styles.timeText}>
              {currentFrame?.date.split(' ')[1]} ET {/* 09:30 or 10:30 */}
            </span>
          </div>

          <div style={styles.sliderRow}>
            <button style={styles.playButton} onClick={togglePlay}>
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>
            
            <input 
              type="range" 
              min="0" 
              max={marketFrames.length - 1} 
              step="1"
              value={currentFrameIndex}
              onChange={(e) => setProgress(Number(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0f172a', // Deep slate background for WebGL to pop against
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'monospace',
  },
  loadingContainer: {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    color: '#34d399',
  },
  loadingText: {
    letterSpacing: '0.1em',
    animation: 'pulse 2s infinite',
  },
  uiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none', // Lets mouse clicks pass through to WebGL map
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px',
    boxSizing: 'border-box',
  },
  header: {
    pointerEvents: 'auto',
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    padding: '16px 24px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'inline-block',
    alignSelf: 'flex-start',
  },
  title: {
    color: '#f8fafc',
    margin: 0,
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94a3b8',
    margin: '4px 0 0 0',
    fontSize: '0.85rem',
  },
  controlsContainer: {
    pointerEvents: 'auto',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(12px)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    width: '100%',
    maxWidth: '600px',
    alignSelf: 'center',
    marginBottom: '20px',
  },
  timeDisplay: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: '12px',
  },
  dateText: {
    color: '#f8fafc',
    fontSize: '1.4rem',
    fontWeight: 'bold',
  },
  timeText: {
    color: '#fbbf24', // Amber to highlight the Inhale/Exhale frame
    fontSize: '1.4rem',
    fontWeight: 'bold',
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  playButton: {
    background: '#34d399',
    color: '#0f172a',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '4px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
  },
  slider: {
    flex: 1,
    cursor: 'pointer',
  }
};

export default App;
