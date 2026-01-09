import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MarketGalaxy from './components/MarketGalaxy';
import AgentPanel from './components/AgentPanel';

function App() {
  const [historyData, setHistoryData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load Data
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
    // Desktop: Locked Viewport (h-screen). Mobile: Scrollable (min-h-screen).
    <div className="app-container flex flex-col h-auto md:h-screen md:overflow-hidden min-h-screen">
      
      {/* Fixed Header */}
      <div className="sticky-header-group flex-shrink-0 z-50 bg-[var(--bg-app)]">
        <Header />
      </div>

      {/* Main Grid Content */}
      <main className="bento-grid flex-1 min-h-0 pb-4 pt-2">
        
        {/* LEFT: VISUALIZATION ENGINE (3/4 Width on Desktop) 
            - Mobile: Fixed height (450px)
            - Desktop: Fills available vertical space
        */}
        <div className="col-span-4 md:col-span-3 h-[450px] md:h-full"> 
          <div className="h-full w-full"> 
            {isLoading ? (
               <div className="panel h-full flex flex-col items-center justify-center">
                  <div className="scan-line mb-8 w-1/2"></div>
                  <div className="text-accent font-mono text-sm tracking-widest animate-pulse">
                    INITIALIZING PHYSICS ENGINE...
                  </div>
               </div>
            ) : (
              <MarketGalaxy 
                data={historyData} 
                onNodeClick={setSelectedNode} 
              />
            )}
          </div>
        </div>

        {/* RIGHT: AGENT PANEL (1/4 Width on Desktop) 
            - Mobile: Auto height
            - Desktop: Fills vertical space
        */}
        <div className="col-span-4 md:col-span-1 h-auto md:h-full min-h-[400px]">
           <AgentPanel selectedNode={selectedNode} />
        </div>

      </main>

      {/* Footer (Desktop Only to save space) */}
      <div className="flex-shrink-0 hidden md:block">
         <Footer />
      </div>
    </div>
  );
}

export default App;
