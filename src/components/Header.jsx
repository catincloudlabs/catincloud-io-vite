import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal';
import ManualModal from './ManualModal';
import BioModal from './BioModal';
// Added Search, Bell, HelpCircle for the utility cluster
import { Network, BookOpen, User, Search, Bell, HelpCircle } from 'lucide-react';

const Header = () => {
  const [isArchOpen, setArchOpen] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        
        {/* 1. LEFT: BRANDING */}
        <div className="brand-section">
          <h1 className="brand-title">
            CatInCloud<span className="text-accent">.io</span>
          </h1>
          <span className="brand-sub desktop-only">QUANTITATIVE INTELLIGENCE</span>
        </div>

        {/* 2. CENTER: CONTENT NAVIGATION (Your Existing Modals) */}
        <nav className="header-nav-center">
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

        {/* 3. RIGHT: UTILITY CLUSTER (New "Control Center") */}
        <div className="utility-cluster">
            {/* Search */}
            <div className="search-wrapper desktop-only">
               <Search size={14} className="search-icon" />
               <input type="text" placeholder="Search..." className="search-input" />
            </div>
            
            <div className="divider-vertical desktop-only"></div>

            {/* Notifications */}
            <button className="icon-btn">
               <Bell size={16} />
               <span className="notification-dot"></span>
            </button>
            
            {/* Help */}
            <button className="icon-btn">
               <HelpCircle size={16} />
            </button>

            <div className="divider-vertical"></div>

            {/* Admin Profile (Static for now) */}
            <div className="user-profile">
               <div className="user-info desktop-only">
                  <span className="user-name">Guest</span>
                  <span className="user-role">VIEWER</span>
               </div>
               <div className="user-avatar-placeholder">
                  <User size={16} color="#cbd5e1"/>
               </div>
            </div>
         </div>
      </header>

      {/* --- MODALS --- */}
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setArchOpen(false)} />
      <ManualModal isOpen={isManualOpen} onClose={() => setManualOpen(false)} />
      <BioModal isOpen={isBioOpen} onClose={() => setBioOpen(false)} />
    </>
  );
};

export default Header;
