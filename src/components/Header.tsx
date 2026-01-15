// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import { Clock, Network, User, ChevronDown, Search, Check, X } from 'lucide-react';
import FilterMenu, { FilterState } from './FilterMenu';

interface HeaderProps {
  dateLabel: string;
  onOpenArch: () => void;
  onOpenBio: () => void;
  selectedTicker: string | null;
  onSelectTicker: (ticker: string | null) => void;
  watchlist: string[];
  availableSectors: string[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const Header: React.FC<HeaderProps> = ({ 
  dateLabel, 
  onOpenArch, 
  onOpenBio, 
  selectedTicker, 
  onSelectTicker, 
  watchlist,
  availableSectors,
  filters,
  setFilters
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(""); 
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null); 

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

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setTimeout(() => setSearch(""), 200); 
    }
  }, [isOpen]);

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
                
                <div className="dropdown-search-wrapper">
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="dropdown-search-input"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
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
                  {!search && (
                      <div 
                        className="dropdown-item reset-item"
                        onClick={() => { onSelectTicker(null); setIsOpen(false); }}
                      >
                        <span>RESET VIEW</span>
                      </div>
                  )}

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
        
        {/* WRAPPED FILTER MENU FOR CSS TARGETING */}
        <div className="header-filter-wrapper">
            <FilterMenu 
                availableSectors={availableSectors}
                filters={filters}
                setFilters={setFilters}
            />
        </div>

        {/* Small Divider (Hidden on mobile via CSS if needed) */}
        <div className="v-divider mobile-hide" style={{ height: 20, margin: '0 8px' }}></div>

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
