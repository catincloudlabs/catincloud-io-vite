import React from 'react';
import { Clock, Search, Calendar } from 'lucide-react';

const GlobalControlBar = ({ 
  // Date State
  dates, 
  selectedDate, 
  onDateChange,
  
  // Ticker State
  availableTickers = [],
  selectedTicker, 
  onTickerChange
}) => {
  
  if (!dates || dates.length === 0) return null;

  const currentIndex = dates.indexOf(selectedDate);
  const maxIndex = dates.length - 1;

  // Calculate progress % for the "Fill" effect
  // If only 1 date exists, fill it 100%
  const progressPercent = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 100;

  const handleRangeChange = (e) => {
    const index = parseInt(e.target.value, 10);
    onDateChange(dates[index]);
  };

  return (
    <div className="global-control-bar panel-flex-row">
      
      {/* 1. LEFT: HORIZONTAL WATCHLIST */}
      <div className="ticker-selector-group">
        <div className="control-label">
           <Search size={14} className="mr-2 text-muted"/>
           <span>WATCHLIST</span>
        </div>
        
        <div className="ticker-pills-row">
          {availableTickers.map((ticker) => {
            const isActive = selectedTicker === ticker;
            return (
              <button
                key={ticker}
                onClick={() => onTickerChange(ticker)}
                className={`ticker-pill ${isActive ? 'active' : ''}`}
              >
                {ticker}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RIGHT: TIME TRAVEL SLIDER */}
      <div className="time-travel-group">
        <div className="control-label" style={{ justifyContent: 'flex-end' }}>
          <span>TIME TRAVEL</span>
          <Clock size={14} className="ml-2 text-accent" />
        </div>

        <div className="slider-wrapper">
          {/* Date Badge (Moved Left for better flow) */}
          <div className="current-date-badge mr-4">
             <Calendar size={12} className="mr-2"/>
             {selectedDate}
          </div>

          {/* Interactive Slider */}
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={currentIndex === -1 ? maxIndex : currentIndex}
            onChange={handleRangeChange}
            className="time-slider-input"
            // Pass the dynamic value as a CSS Variable
            style={{ '--progress': `${progressPercent}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default GlobalControlBar;
