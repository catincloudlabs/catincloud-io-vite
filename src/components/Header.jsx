import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal';
import { Network } from 'lucide-react';

const Header = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        {/* LEFT: BRANDING */}
        <div>
          <h1 className="brand-title">
            CatInCloud<span className="text-accent">.io</span>
          </h1>
          <div className="brand-sub">
            QUANT_PIPELINE :: LIVE_MODE
          </div>
        </div>

        {/* RIGHT: NAVIGATION */}
        <div className="header-nav">
          
          {/* Architecture Trigger */}
          <button 
            onClick={() => setModalOpen(true)}
            className="nav-link icon-link"
          >
            <Network size={14} style={{ marginRight: '6px' }} />
            System Architecture
          </button>

          <span className="nav-separator">/</span>

          {/* Exit Link */}
          <a href="https://catincloudlabs.com" className="nav-link">
            Exit to Main Site &rarr;
          </a>
        </div>
      </header>

      <ArchitectureModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};

export default Header;
