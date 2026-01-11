import React from 'react';
// @ts-ignore
import { Clock, Network, User } from 'lucide-react';

interface HeaderProps {
  dateLabel: string;
  onOpenArch: () => void;
  onOpenBio: () => void;
}

const Header: React.FC<HeaderProps> = ({ dateLabel, onOpenArch, onOpenBio }) => {
  return (
    <header className="app-header">
      {/* LEFT: CHRONOMETER */}
      <div className="header-left">
        <div className="header-chronometer">
          <div className="chrono-label">
            <Clock size={10} color="var(--accent-green)" />
            <span style={{ marginLeft: '6px' }}>EVENT HORIZON</span>
          </div>
          <div className="chrono-value">{dateLabel}</div>
        </div>
      </div>
      
      {/* RIGHT: META CONTROLS */}
      <div className="header-right">
        <button 
          onClick={onOpenArch} 
          className="header-icon-btn" 
          title="Architecture" 
          aria-label="Open Architecture Diagram"
        >
          <Network size={16} />
        </button>
        <button 
          onClick={onOpenBio} 
          className="header-icon-btn" 
          title="Bio" 
          aria-label="Open Developer Bio"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
