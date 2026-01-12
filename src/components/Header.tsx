import React from 'react';
// @ts-ignore
import { Clock, Network, User, ChevronDown, Search } from 'lucide-react';

interface HeaderProps {
  dateLabel: string;
  onOpenArch: () => void;
  onOpenBio: () => void;
  selectedTicker: string | null;
  onSelectTicker: (ticker: string | null) => void;
  watchlist: string[];
}

const Header: React.FC<HeaderProps> = ({ 
  dateLabel, 
  onOpenArch, 
  onOpenBio, 
  selectedTicker, 
  onSelectTicker, 
  watchlist 
}) => {
  return (
    <header className="app-header">
      {/* LEFT: CHRONOMETER & SELECTOR */}
      <div className="header-left">
        
        {/* Date Display */}
        <div className="header-chronometer">
          <div className="chrono-label">
            <Clock size={12} color="var(--accent-green)" />
            {/* Added class for mobile hiding */}
            <span className="header-label-text">
              EVENT HORIZON
            </span>
          </div>
          <div className="chrono-value">{dateLabel}</div>
        </div>

        {/* Vertical Divider */}
        <div className="v-divider"></div>

        {/* Ticker Selector */}
        <div className="header-selector">
          <div className="selector-icon">
             <Search size={12} color={selectedTicker ? "var(--accent-green)" : "var(--text-muted)"} />
          </div>
          
          <select 
            className="ticker-select"
            value={selectedTicker || ""}
            onChange={(e) => onSelectTicker(e.target.value || null)}
            aria-label="Select Target Asset"
          >
            {/* Default "Reset" Option */}
            <option value="">TICKER</option>
            {watchlist.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <div className="selector-arrow">
            <ChevronDown size={12} />
          </div>
        </div>

      </div>
      
      {/* RIGHT: META CONTROLS */}
      <div className="header-right">
        <button 
          onClick={onOpenArch} 
          className="header-icon-btn" 
          title="System Architecture" 
          aria-label="Open Architecture Diagram"
        >
          <Network size={16} />
        </button>
        <button 
          onClick={onOpenBio} 
          className="header-icon-btn" 
          title="Developer Bio" 
          aria-label="Open Developer Bio"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
