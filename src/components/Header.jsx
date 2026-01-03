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
        <div className="brand-section">
          <h1 className="brand-title">
            CatInCloud<span className="text-accent">.io</span>
          </h1>
          <span className="brand-sub desktop-only">QUANTITATIVE INTELLIGENCE</span>
        </div>

        {/* RIGHT: NAVIGATION PILL */}
        <nav className="header-nav-pill">
          <button onClick={() => setManualOpen(true)} className="nav-link icon-link">
            <BookOpen size={14} className="mr-2" />
            <span className="desktop-only">Manual</span>
          </button>

          <div className="nav-separator">/</div>

          <button onClick={() => setArchOpen(true)} className="nav-link icon-link">
            <Network size={14} className="mr-2" />
            <span className="desktop-only">Architecture</span>
          </button>

          <div className="nav-separator">/</div>

          <button onClick={() => setBioOpen(true)} className="nav-link icon-link">
            <User size={14} className="mr-2" />
            <span className="desktop-only">Bio</span>
          </button>
        </nav>

      </header>

      {/* --- MODALS --- */}
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setArchOpen(false)} />
      <ManualModal isOpen={isManualOpen} onClose={() => setManualOpen(false)} />
      <BioModal isOpen={isBioOpen} onClose={() => setBioOpen(false)} />
    </>
  );
};

export default Header;
