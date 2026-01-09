import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MarketGalaxy from './components/MarketGalaxy';
import AgentPanel from './components/AgentPanel';

function App() {
  const [historyData, setHistoryData] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- Data Loading (Unchanged) ---
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
    // 1. MASTER CONTAINER: Locked to Screen Height (Desktop)
    //    Uses 'app-container' for horizontal constraints but forces vertical locking.
    <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* 2. HEADER: Fixed Height, Pinned to Top */}
      <div className="sticky-header-group" style={{ flexShrink: 0, zIndex: 50, background: 'var(--bg-app)' }}>
        <Header />
      </div>

      {/* 3. MAIN WORKSPACE: The Rigid Grid 
          - flex-1: Fills strictly the remaining height between Header and Footer.
          - min-height: 0: CRITICAL. Allows this container to shrink below its content size, preventing the "explosion" loop.
      */}
      <main className="bento-grid" style={{ 
          flex: 1, 
          minHeight: 0, 
          paddingTop: '8px', 
          paddingBottom: '24px',
          // DESKTOP OVERRIDE: Force single row to stop infinite expansion
          gridTemplateRows: '1fr' 
      }}>
        
        {/* LEFT PANEL: Market Galaxy (75% Width)
            - relative: Keeps absolute children (canvas) contained.
            - overflow: hidden: Ensures nothing spills out.
        */}
        <div className="span-4 lg:col-span-3" style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
          
          {isLoading ? (
             <div className="panel ai-hero-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="scan-line" style={{ width: '33%', marginBottom: '32px' }}></div>
                <div className="text-accent" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.2em' }}>
                  BOOTING PHYSICS ENGINE...
                </div>
             </div>
          ) : (
            // The Galaxy component will expand to fill this rigid container
            <MarketGalaxy 
              data={historyData} 
              onNodeClick={setSelectedNode} 
            />
          )}
        </div>

        {/* RIGHT PANEL: Agent Interface (25% Width) 
            - height: 100%: Locks to the same height as the Galaxy map.
        */}
        <div className="span-4 lg:col-span-1" style={{ height: '100%', minHeight: 0 }}>
           <AgentPanel selectedNode={selectedNode} />
        </div>

      </main>

      {/* 4. FOOTER: Hidden on Mobile to save space, Visible on Desktop */}
      <div className="desktop-only" style={{ flexShrink: 0 }}>
         <Footer />
      </div>

      {/* 5. MOBILE RESPONSIVENESS OVERRIDES 
          We use a style tag to cleanly un-lock the view on phones without polluting the JSX.
      */}
      <style>{`
        @media (max-width: 768px) {
          /* Unlock height so phones scroll naturally */
          .app-container {
            height: auto !important;
            overflow: auto !important;
            min-height: 100vh;
          }
          /* Stack the grid vertically */
          .bento-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
            grid-template-rows: none !important;
          }
          /* Fix map height on mobile so it's usable */
          .span-4.lg\\:col-span-3 {
            height: 450px !important;
          }
          /* Allow agent panel to grow with text */
          .span-4.lg\\:col-span-1 {
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
