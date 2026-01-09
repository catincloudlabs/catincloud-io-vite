import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MarketGalaxy from './components/MarketGalaxy';
import AgentPanel from './components/AgentPanel';

function App() {
  const [historyData, setHistoryData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/data/market_physics_history.json') 
      .then(res => {
        if (!res.ok) throw new Error("Failed to load physics data");
        return res.json();
      })
      .then(json => {
        const cleanData = Array.isArray(json) ? json : (json.data || []);
        setHistoryData(cleanData);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Physics Engine Error:", err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="app-container h-screen flex flex-col overflow-hidden">
      
      {/* 1. Header (Fixed Height) */}
      <div className="sticky-header-group flex-shrink-0 z-20 bg-[var(--bg-app)]">
        <Header />
      </div>

      {/* 2. Main Grid (Fills remaining height) 
          - Desktop Update: Added 'md:grid-rows-1' to lock row height to 1fr.
            This prevents the 'auto' rows from growing infinitely.
      */}
      <main className="bento-grid flex-1 min-h-0 pb-6 pt-2 md:grid-rows-1">
        
        {/* LEFT: VISUALIZATION (75%) */}
        <div className="col-span-4 md:col-span-3 h-[500px] md:h-full relative min-h-0"> 
          {isLoading ? (
             <div className="panel ai-hero-card h-full flex flex-col items-center justify-center">
                <div className="scan-line mb-8 w-1/3"></div>
                <div className="text-accent font-mono text-xs tracking-[0.2em] animate-pulse">
                  BOOTING PHYSICS ENGINE...
                </div>
             </div>
          ) : (
            <MarketGalaxy 
              data={historyData} 
              onNodeClick={setSelectedNode} 
            />
          )}
        </div>

        {/* RIGHT: AGENT PANEL (25%) */}
        <div className="col-span-4 md:col-span-1 h-auto md:h-full min-h-0 relative overflow-hidden">
           <AgentPanel selectedNode={selectedNode} />
        </div>

      </main>

      {/* 3. Footer (Desktop Only) */}
      <div className="flex-shrink-0 hidden md:block">
         <Footer />
      </div>

      {/* Mobile Scroll Override */}
      <style>{`
        @media (max-width: 768px) {
          .app-container {
            height: auto !important;
            overflow: auto !important;
          }
          .bento-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
