import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MarketGalaxy from './components/MarketGalaxy';
import AgentPanel from './components/AgentPanel';

function App() {
  // 1. State for the Physics Engine
  const [historyData, setHistoryData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Load the Data
  useEffect(() => {
    // Fetch the physics history we generated
    fetch('/data/market_physics_history.json') 
      .then(res => {
        if (!res.ok) throw new Error("Failed to load physics data");
        return res.json();
      })
      .then(json => {
        // Handle both structure formats just in case: { data: [...] } or [...]
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
    <div className="app-container">
      
      {/* Top Navigation / Status Bar */}
      <div className="sticky-header-group">
        <Header />
      </div>

      <main className="bento-grid pt-4">
        
        {/* LEFT: The Market Galaxy (Physics Engine) 
            We use col-span-3 to give the visualizer 75% of the screen width on large screens.
        */}
        <div className="col-span-4 lg:col-span-3 h-[700px] panel p-0 overflow-hidden relative">
          {isLoading ? (
             <div className="w-full h-full flex items-center justify-center">
                <div className="text-accent font-mono animate-pulse">
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

        {/* RIGHT: The Agent Panel (Intelligence)
            Takes up the remaining 25% to display context/analysis.
        */}
        <div className="col-span-4 lg:col-span-1 h-[700px]">
           <AgentPanel selectedNode={selectedNode} />
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default App;
