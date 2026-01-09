import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal';
import ManualModal from './ManualModal';
import BioModal from './BioModal';
import JournalModal from './JournalModal';
import { Network, BookOpen, User, Book } from 'lucide-react';

const Header = () => {
  const [isArchOpen, setArchOpen] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);
  const [isJournalOpen, setJournalOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        
        {/* LEFT: LOGO */}
        <div className="brand-group">
          <h1 className="brand-title">
            CatInCloud<span className="text-accent">.io</span>
          </h1>
        </div>

        {/* RIGHT: NAVIGATION */}
        <nav className="header-nav-pill">
          
          {/* Journal Button */}
          <button 
            onClick={() => setJournalOpen(true)} 
            className="nav-link icon-link"
            aria-label="View System Journal"
          >
            <Book size={14} className="mr-2" />
            <span className="desktop-only">Journal</span>
          </button>

          <div className="nav-separator">/</div>

          <button 
            onClick={() => setManualOpen(true)} 
            className="nav-link icon-link"
            aria-label="Open Operator Manual"
          >
            <BookOpen size={14} className="mr-2" />
            <span className="desktop-only">Manual</span>
          </button>

          <div className="nav-separator">/</div>

          <button 
            onClick={() => setArchOpen(true)} 
            className="nav-link icon-link"
            aria-label="View System Architecture"
          >
            <Network size={14} className="mr-2" />
            <span className="desktop-only">Architecture</span>
          </button>

          <div className="nav-separator">/</div>

          <button 
            onClick={() => setBioOpen(true)} 
            className="nav-link icon-link"
            aria-label="View Biography"
          >
            <User size={14} className="mr-2" />
            <span className="desktop-only">Bio</span>
          </button>
        </nav>

      </header>

      {/* MODALS */}
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setArchOpen(false)} />
      <ManualModal isOpen={isManualOpen} onClose={() => setManualOpen(false)} />
      <BioModal isOpen={isBioOpen} onClose={() => setBioOpen(false)} />
      <JournalModal isOpen={isJournalOpen} onClose={() => setJournalOpen(false)} />
    </>
  );
};

export default Header;
