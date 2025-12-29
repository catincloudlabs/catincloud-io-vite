import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal';
import ManualModal from './ManualModal';
import { Network, BookOpen } from 'lucide-react';

const Header = () => {
  const [isArchOpen, setArchOpen] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);

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
          
          {/* Operator Manual Trigger */}
          <button 
            onClick={() => setManualOpen(true)}
            className="nav-link icon-link"
          >
            <BookOpen size={14} style={{ marginRight: '6px' }} />
            Operator Manual
          </button>

          <span className="nav-separator">/</span>

          {/* Architecture Trigger */}
          <button 
            onClick={() => setArchOpen(true)}
            className="nav-link icon-link"
          >
            <Network size={14} style={{ marginRight: '6px' }} />
            Architecture
          </button>

          <span className="nav-separator">/</span>

          {/* Exit Link */}
          <a href="https://catincloudlabs.com" className="nav-link">
            Built by CatInCloud Labs &rarr;
          </a>
        </div>
      </header>

      {/* MODALS */}
      <ArchitectureModal 
        isOpen={isArchOpen} 
        onClose={() => setArchOpen(false)} 
      />
      
      <ManualModal 
        isOpen={isManualOpen} 
        onClose={() => setManualOpen(false)} 
      />
    </>
  );
};

export default Header;
