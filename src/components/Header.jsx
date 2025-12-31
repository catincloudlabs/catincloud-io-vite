import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal';
import ManualModal from './ManualModal';
import BioModal from './BioModal';
import { Network, BookOpen, User } from 'lucide-react';

const Header = () => {
  const [isArchOpen, setArchOpen] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        {/* LEFT: BRANDING */}
        <div className="brand-container">
          <h1 className="brand-title">
            CatInCloud<span className="text-accent">.io</span>
          </h1>
          {/* Subtitle removed to save vertical space on mobile */}
        </div>

        {/* RIGHT: NAVIGATION */}
        <nav className="header-nav">
          
          {/* Manual */}
          <button 
            onClick={() => setManualOpen(true)}
            className="nav-link icon-link"
          >
            <BookOpen size={14} className="mr-2" />
            <span>Manual</span>
          </button>

          <span className="nav-separator">/</span>

          {/* Architecture */}
          <button 
            onClick={() => setArchOpen(true)}
            className="nav-link icon-link"
          >
            <Network size={14} className="mr-2" />
            <span>Architecture</span>
          </button>

          <span className="nav-separator">/</span>

          {/* Bio */}
          <button 
            onClick={() => setBioOpen(true)}
            className="nav-link icon-link"
          >
            <User size={14} className="mr-2" />
            <span>CatInCloud Labs</span>
          </button>
        </nav>
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

      <BioModal 
        isOpen={isBioOpen} 
        onClose={() => setBioOpen(false)} 
      />
    </>
  );
};

export default Header;