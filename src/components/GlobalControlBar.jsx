import React, { useRef } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Activity 
} from 'lucide-react';

const GlobalControlBar = ({ 
  dates = [], 
  selectedDate, 
  onDateChange,
  availableTickers = [],
  selectedTicker, 
  onTickerChange
}) => {
  
  // Ref to trigger the calendar programmatically if needed, 
  // though the overlay method handles this mostly.
  const dateInputRef = useRef(null);

  if (!dates || dates.length === 0) return null;

  const currentIndex = dates.indexOf(selectedDate);
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < dates.length - 1;

  // --- Handlers ---

  const handlePrev = () => {
    if (canGoBack) onDateChange(dates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (canGoForward) onDateChange(dates[currentIndex + 1]);
  };

  const handleCalendarPick = (e) => {
    // The native picker returns YYYY-MM-DD.
    // If your app relies on specific existing dates, 
    // you might want to validate that the picked date exists in 'dates'.
    // For now, we pass it directly.
    onDateChange(e.target.value);
  };

  return (
    <div className="global-control-bar panel-flex-row" style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '16px'
    }}>
      
      {/* 1. LEFT: Ticker Dropdown (Scalable) */}
      <div className="ticker-group" style={{ position: 'relative' }}>
        <div className="relative inline-block" style={{ position: 'relative' }}>
          
          {/* Left Icon */}
          <Activity 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none', 
              color: '#6b7280' 
            }} 
          />
          
          {/* The Select Element */}
          <select 
            value={selectedTicker}
            onChange={(e) => onTickerChange(e.target.value)}
            style={{
              appearance: 'none', 
              WebkitAppearance: 'none',
              padding: '8px 40px 8px 36px', // Pad left for icon, right for arrow
              fontSize: '14px',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              cursor: 'pointer',
              minWidth: '140px',
              color: '#1f2937',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {availableTickers.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Custom Dropdown Arrow */}
          <ChevronDown 
            size={16} 
            style={{ 
              position: 'absolute', 
              right: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none', 
              color: '#6b7280' 
            }} 
          />
        </div>
      </div>


      {/* 2. RIGHT: Date Stepper + Pop-up Calendar */}
      <div className="date-controls" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        background: '#f3f4f6', 
        padding: '4px', 
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        
        {/* Previous Day */}
        <button 
          onClick={handlePrev} 
          disabled={!canGoBack}
          style={{ 
            border: 'none',
            background: 'white',
            borderRadius: '6px',
            padding: '4px',
            display: 'flex', 
            alignItems: 'center',
            cursor: canGoBack ? 'pointer' : 'not-allowed',
            opacity: canGoBack ? 1 : 0.4,
            boxShadow: canGoBack ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            color: '#374151'
          }}
          title="Previous Day"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Date Display (With Hidden Input Overlay) */}
        <div style={{ position: 'relative', minWidth: '130px' }}>
          
          {/* The Visible Label */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '4px 8px', 
            fontSize: '14px', 
            fontWeight: '600',
            fontVariantNumeric: 'tabular-nums',
            color: '#111827',
            cursor: 'pointer'
          }}>
             <Calendar size={14} style={{ marginRight: '8px', color: '#6b7280' }}/>
             {selectedDate}
          </div>

          {/* The Invisible Native Date Input */}
          <input 
            ref={dateInputRef}
            type="date" 
            value={selectedDate} // Assumes selectedDate is YYYY-MM-DD
            onChange={handleCalendarPick}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0, // Invisible but clickable
              cursor: 'pointer',
              zIndex: 10
            }}
          />
        </div>

        {/* Next Day */}
        <button 
          onClick={handleNext} 
          disabled={!canGoForward}
          style={{ 
            border: 'none',
            background: 'white',
            borderRadius: '6px',
            padding: '4px',
            display: 'flex', 
            alignItems: 'center',
            cursor: canGoForward ? 'pointer' : 'not-allowed',
            opacity: canGoForward ? 1 : 0.4,
            boxShadow: canGoForward ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            color: '#374151'
          }}
          title="Next Day"
        >
          <ChevronRight size={18} />
        </button>

      </div>

    </div>
  );
};

export default GlobalControlBar;
