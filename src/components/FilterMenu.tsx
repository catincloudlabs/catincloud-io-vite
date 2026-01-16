import React, { useState, useRef, useEffect } from 'react';
import { Sliders, Check, Zap, Activity, Layers } from 'lucide-react';

export interface FilterState {
  minEnergy: number;
  visibleSectors: Set<string>; 
  showPositive: boolean;
  showNeutral: boolean;
  showNegative: boolean;
}

interface FilterMenuProps {
  availableSectors: string[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ 
  availableSectors, 
  filters, 
  setFilters 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS ---
  const toggleSector = (sector: string) => {
    setFilters(prev => {
      const newSet = new Set(prev.visibleSectors);
      if (newSet.has(sector)) {
        newSet.delete(sector);
      } else {
        newSet.add(sector);
      }
      return { ...prev, visibleSectors: newSet };
    });
  };

  const clearSectors = () => {
    setFilters(prev => ({ ...prev, visibleSectors: new Set() }));
  };

  // Helper: Visual active state
  const isActive = filters.minEnergy > 0 || 
                   filters.visibleSectors.size > 0 || 
                   !filters.showPositive || 
                   !filters.showNeutral || 
                   !filters.showNegative;

  return (
    <div className="filter-menu-container" ref={menuRef}>
      
      {/* TOGGLE BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`header-icon-btn ${isActive ? 'active-filter' : ''}`}
        title="View Settings"
        aria-label="Filter View"
      >
        <Sliders size={16} />
      </button>

      {/* POPOVER MENU */}
      {isOpen && (
        <div className="filter-popover">
          
          {/* SECTION: Signal Strength */}
          <div className="filter-section">
            <div className="filter-label-row">
              <div className="filter-title">
                <Zap size={12} color="var(--accent-ai)" className="filter-icon"/>
                <span>SIGNAL STRENGTH</span>
              </div>
              <span className="filter-value">{filters.minEnergy}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={filters.minEnergy}
              onChange={(e) => setFilters(prev => ({ ...prev, minEnergy: parseInt(e.target.value) }))}
              className="filter-slider"
            />
            <div className="filter-caption">
                Filter low-energy noise to see only major movers.
            </div>
          </div>

          <div className="filter-divider" />

          {/* SECTION: Sentiment Polarity */}
          <div className="filter-section">
             <div className="filter-title">
                <Activity size={12} color="var(--accent-green)" className="filter-icon"/>
                <span>SENTIMENT POLARITY</span>
             </div>
             <div className="sentiment-toggles">
                <button 
                    className={`sentiment-btn green ${filters.showPositive ? 'active' : ''}`}
                    onClick={() => setFilters(p => ({...p, showPositive: !p.showPositive}))}
                    title="Toggle Positive Sentiment"
                >
                    POSITIVE
                </button>
                <button 
                    className={`sentiment-btn grey ${filters.showNeutral ? 'active' : ''}`}
                    onClick={() => setFilters(p => ({...p, showNeutral: !p.showNeutral}))}
                    title="Toggle Neutral Sentiment"
                >
                    NEUTRAL
                </button>
                <button 
                    className={`sentiment-btn red ${filters.showNegative ? 'active' : ''}`}
                    onClick={() => setFilters(p => ({...p, showNegative: !p.showNegative}))}
                    title="Toggle Negative Sentiment"
                >
                    NEGATIVE
                </button>
             </div>
          </div>

          <div className="filter-divider" />

          {/* SECTION: Sector Isolation */}
          <div className="filter-section">
            <div className="filter-label-row">
                <div className="filter-title">
                    <Layers size={12} color="var(--accent-blue)" className="filter-icon"/>
                    <span>SECTOR VISIBILITY</span>
                </div>
                {filters.visibleSectors.size > 0 && (
                    <button onClick={clearSectors} className="filter-reset-link">
                        RESET
                    </button>
                )}
            </div>
            
            <div className="sector-grid">
                {availableSectors.map(sector => {
                    const isSelected = filters.visibleSectors.has(sector);
                    const isVisualActive = filters.visibleSectors.size === 0 || isSelected;

                    return (
                        <div 
                            key={sector} 
                            className={`sector-chip ${isVisualActive ? 'active' : 'inactive'}`}
                            onClick={() => toggleSector(sector)}
                        >
                            {sector}
                            {isSelected && <Check size={10} className="sector-check" />}
                        </div>
                    );
                })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default FilterMenu;
