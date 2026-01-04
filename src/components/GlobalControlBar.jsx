import React from 'react';
import { Search, Calendar } from 'lucide-react';

const GlobalControlBar = ({ 
  dates, 
  selectedDate, 
  onDateChange,
  availableTickers = [],
  selectedTicker, 
  onTickerChange
}) => {
  
  if (!dates || dates.length === 0) return null;

  const currentIndex = dates.indexOf(selectedDate);
  const maxIndex = dates.length - 1;
  const progressPercent = maxIndex > 0 ? (currentIndex / maxIndex) * 100 : 100;

  const handleRangeChange = (e) => {
    const index = parseInt(e.target.value, 10);
    onDateChange(dates[index]);
  };

  return (
    <div className="global-control-bar panel-flex-row">
      
      {/* 1. LEFT: WATCHLIST */}
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

      {/* 2. RIGHT: TIME SLIDER */}
      <div className="time-travel-group">
        <div className="slider-wrapper">
          {/* A. The Slider */}
          <input
            type="range"
            min="0"
            max={maxIndex}
            value={currentIndex === -1 ? maxIndex : currentIndex}
            onChange={handleRangeChange}
            className="time-slider-input"
            style={{ '--progress': `${progressPercent}%` }}
          />

          {/* B. The Date Badge */}
          <div className="current-date-badge ml-4">
             <Calendar size={12} className="mr-2"/>
             {selectedDate}
          </div>
        </div>
      </div>

    </div>
  );
};

export default GlobalControlBar;
