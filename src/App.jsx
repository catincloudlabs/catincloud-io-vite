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
    // MD: Desktop (Locked Screen), Base: Mobile (Scrollable)
    <div className="app-container flex flex-col h-auto md:h-screen md:overflow-hidden min-h-screen">
      
      {/* Header stays fixed at top */}
      <div className="sticky-header-group flex-shrink-0">
        <Header />
      </div>

      {/* Main Grid 
          - Mobile: Flex Column (Scrollable)
          - Desktop: Bento Grid (Locked)
      */}
      <main className="bento-grid flex-1 min-h-0 pt-2 pb-4">
        
        {/* LEFT: VISUALIZATION ENGINE 
            - Mobile: Fixed height (400px) to ensure map is usable but leaves room
            - Desktop: Full height of the grid area
        */}
        <div className="col-span-4 md:col-span-3 h-[450px] md:h-full"> 
          <div className="panel ai-hero-card p-0 overflow-hidden relative h-full w-full">
            {isLoading ? (
               <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="scan-line mb-8 w-1/2"></div>
                  <div className="text-[#e879f9] font-mono text-sm tracking-widest animate-pulse">
                    INITIALIZING PHYSICS...
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

        {/* RIGHT: AGENT PANEL 
            - Mobile: Auto height (grows with content)
            - Desktop: Full height (scrolls internally)
        */}
        <div className="col-span-4 md:col-span-1 h-auto md:h-full min-h-[400px]">
           <AgentPanel selectedNode={selectedNode} />
        </div>

      </main>

      {/* Footer pinned only on Desktop */}
      <div className="flex-shrink-0 hidden md:block">
         <Footer />
      </div>
    </div>
  );
}

export default App;
