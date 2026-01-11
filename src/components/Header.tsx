import React from 'react';
import { Clock } from 'lucide-react';

interface HeaderProps {
  dateLabel: string;
  onSelectTicker?: (ticker: string) => void;
  selectedTicker?: string | null;
}

const Header: React.FC<HeaderProps> = ({ dateLabel, onSelectTicker, selectedTicker }) => {
  
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onSelectTicker) {
      onSelectTicker(e.target.value);
    }
  };

  return (
    <header className="app-header">
      {/* LEFT: CHRONOMETER & CONTROLS */}
      <div className="header-left">
        <div className="header-chronometer">
          <div className="chrono-label">
            <Clock size={10} color="var(--accent-green)" aria-hidden="true" />
            <span style={{ marginLeft: '6px' }}>EVENT HORIZON</span>
          </div>
          <div className="chrono-value" aria-label={`Current Simulation Date: ${dateLabel}`}>
            {dateLabel}
          </div>
        </div>

        {/* QUICK NAV DROPDOWN */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <label htmlFor="ticker-select" className="sr-only">Quick Navigate to Ticker</label>
            <select 
                id="ticker-select"
                className="glass-select" 
                onChange={handleSelect} 
                value={selectedTicker || ""}
                aria-label="Quick Navigate to Major Ticker"
            >
                <option value="">QUICK NAV...</option>
                <optgroup label="Indices">
                    <option value="SPY">SPY</option>
                    <option value="QQQ">QQQ</option>
                    <option value="IWM">IWM</option>
                </optgroup>
                <optgroup label="Mag 7">
                    <option value="AAPL">AAPL</option>
                    <option value="MSFT">MSFT</option>
                    <option value="GOOGL">GOOGL</option>
                    <option value="AMZN">AMZN</option>
                    <option value="NVDA">NVDA</option>
                    <option value="META">META</option>
                    <option value="TSLA">TSLA</option>
                </optgroup>
            </select>
        </div>
      </div>
      
      {/* RIGHT SIDE EMPTY - Balanced by Agent Panel */}
    </header>
  );
};

export default Header;
