import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import { Clock, Network, User, ChevronDown, Search, Check, X } from 'lucide-react';

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
  const [search, setSearch] = useState(""); // 1. New Search State
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); // 2. Ref for auto-focus

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

  // 3. Auto-focus search input when opened & Reset search when closed
  useEffect(() => {
    if (isOpen) {
      // Small timeout ensures the element is rendered before focusing
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      // Optional: Clear search when closed (remove if you want to persist)
      setTimeout(() => setSearch(""), 200); 
    }
  }, [isOpen]);

  // 4. Filter Logic
  const filteredWatchlist = watchlist.filter(t => 
    t.toLowerCase().includes(search.toLowerCase())
  );

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
             <div className="custom-ticker-dropdown" onClick={(e) => e.stopPropagation()}>
                
                {/* 5. SEARCH BAR AREA */}
                <div className="dropdown-search-wrapper">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="dropdown-search-input"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        // Prevent dropdown close when clicking input
                        onClick={(e) => e.stopPropagation()} 
                    />
                    {search && (
                        <button 
                            className="search-clear-btn"
                            onClick={() => setSearch("")}
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>

                <div className="dropdown-scroll-area">
                  {/* Reset Option (Only show if not searching or if explicitly wanted) */}
                  {!search && (
                      <div 
                        className="dropdown-item reset-item"
                        onClick={() => { onSelectTicker(null); setIsOpen(false); }}
                      >
                        <span>RESET VIEW</span>
                      </div>
                  )}

                  {/* 6. RENDER FILTERED LIST */}
                  {filteredWatchlist.length > 0 ? (
                    filteredWatchlist.map(t => (
                        <div 
                            key={t} 
                            className={`dropdown-item ${selectedTicker === t ? 'selected' : ''}`}
                            onClick={() => { onSelectTicker(t); setIsOpen(false); }}
                        >
                            <span>{t}</span>
                            {selectedTicker === t && <Check size={12} color="var(--accent-green)" />}
                        </div>
                    ))
                  ) : (
                    <div className="dropdown-empty-state">
                        No asset found.
                    </div>
                  )}
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
