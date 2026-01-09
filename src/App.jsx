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
    <div className="app-container">
      
      <div className="sticky-header-group">
        <Header />
      </div>

      <main className="bento-grid pt-4">
        
        {/* LEFT: VISUALIZATION ENGINE (Span 3 on Desktop) */}
        <div className="span-4 lg:col-span-3">
            {isLoading ? (
               <div className="panel h-tall flex flex-col items-center justify-center">
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

        {/* RIGHT: AGENT PANEL (Span 1 on Desktop) */}
        <div className="span-4 lg:col-span-1">
           <AgentPanel selectedNode={selectedNode} />
        </div>

      </main>

      <Footer />
    </div>
  );
}

export default App;
