import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import { Clock, Network, User, ChevronDown, Search, Check } from 'lucide-react';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      {/* LEFT: CHRONOMETER & SELECTOR */}
      <div className="header-left">
        
        {/* Date Display */}
        <div className="header-chronometer">
          <div className="chrono-label">
            <Clock size={12} color="var(--accent-green)" />
            <span className="header-label-text">
              EVENT HORIZON
            </span>
          </div>
          <div className="chrono-value">{dateLabel}</div>
        </div>

        {/* Vertical Divider */}
        <div className="v-divider"></div>

        {/* Ticker Selector - CUSTOM DROPDOWN */}
        <div 
            className={`header-selector ${isOpen ? 'open' : ''}`} 
            ref={dropdownRef} 
            onClick={() => setIsOpen(!isOpen)}
        >
          <div className="selector-icon">
             <Search size={12} color={selectedTicker ? "var(--accent-green)" : "var(--text-muted)"} />
          </div>
          
          <div className={`ticker-display ${selectedTicker ? 'active' : ''}`}>
             {selectedTicker || "TICKER"}
          </div>

          <div className="selector-arrow">
            <ChevronDown size={12} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {/* THE CUSTOM SCROLLABLE MENU */}
          {isOpen && (
             <div className="custom-ticker-dropdown">
                {/* --- FIX: Added this scroll-area wrapper --- */}
                <div className="dropdown-scroll-area">
                  <div 
                     className="dropdown-item reset-item"
                     onClick={(e) => { e.stopPropagation(); onSelectTicker(null); setIsOpen(false); }}
                  >
                     <span>RESET VIEW</span>
                  </div>
                  {watchlist.map(t => (
                     <div 
                        key={t} 
                        className={`dropdown-item ${selectedTicker === t ? 'selected' : ''}`}
                        onClick={(e) => { e.stopPropagation(); onSelectTicker(t); setIsOpen(false); }}
                     >
                        <span>{t}</span>
                        {selectedTicker === t && <Check size={12} color="var(--accent-green)" />}
                     </div>
                  ))}
                </div>
             </div>
          )}
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
