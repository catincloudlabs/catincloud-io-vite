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
          <Clock size={14} className="ml-2 text-blue" />
        </div>

        <div className="slider-wrapper">
          {/* Slider Input */}
          <input
            type="range"
            min="0"
            max={dates.length - 1}
            value={currentIndex === -1 ? dates.length - 1 : currentIndex}
            onChange={handleRangeChange}
            className="time-slider-input"
          />
          
          {/* Date Badge */}
          <div className="current-date-badge">
             <Calendar size={12} className="mr-1"/>
             {selectedDate}
          </div>
        </div>
      </div>

    </div>
  );
};

export default GlobalControlBar;
