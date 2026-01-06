import React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const GlobalControlBar = ({ 
  dates = [], 
  selectedDate, 
  onDateChange,
  availableTickers = [],
  selectedTicker, 
  onTickerChange
}) => {
  
  if (!dates || dates.length === 0) return null;

  // 1. Determine current position to handle Previous/Next logic
  const currentIndex = dates.indexOf(selectedDate);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < dates.length - 1;

  const handlePrev = () => {
    if (canGoBack) {
      onDateChange(dates[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (canGoForward) {
      onDateChange(dates[currentIndex + 1]);
    }
  };

  return (
    <div className="global-control-bar panel-flex-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      
      {/* LEFT: Ticker Pills */}
      <div className="ticker-selector-group">
        <div className="ticker-pills-row" style={{ display: 'flex', gap: '8px' }}>
          {availableTickers.map((ticker) => {
            const isActive = selectedTicker === ticker;
            return (
              <button
                key={ticker}
                onClick={() => onTickerChange(ticker)}
                className={`ticker-pill ${isActive ? 'active' : ''}`}
                style={{
                  // Basic inline styles for immediate visual feedback (move to CSS)
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: isActive ? '1px solid currentColor' : '1px solid transparent',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                {ticker}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Date Stepper */}
      <div className="date-stepper-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Previous Button */}
        <button 
          onClick={handlePrev} 
          disabled={!canGoBack}
          className="stepper-btn"
          style={{ opacity: canGoBack ? 1 : 0.5, cursor: canGoBack ? 'pointer' : 'not-allowed' }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Date Display */}
        <div className="current-date-badge" style={{ display: 'flex', alignItems: 'center', minWidth: '120px', justifyContent: 'center' }}>
           <Calendar size={14} className="mr-2" style={{ marginRight: '8px' }}/>
           <span style={{ fontWeight: 600 }}>{selectedDate}</span>
        </div>

        {/* Next Button */}
        <button 
          onClick={handleNext} 
          disabled={!canGoForward}
          className="stepper-btn"
          style={{ opacity: canGoForward ? 1 : 0.5, cursor: canGoForward ? 'pointer' : 'not-allowed' }}
        >
          <ChevronRight size={20} />
        </button>

      </div>

    </div>
  );
};

export default GlobalControlBar;
