import React from 'react';
import { Clock } from 'lucide-react';

const TimeSlider = ({ dates, selectedDate, onChange }) => {
  if (!dates || dates.length === 0) return null;

  const currentIndex = dates.indexOf(selectedDate);

  const handleRangeChange = (e) => {
    const index = parseInt(e.target.value, 10);
    onChange(dates[index]);
  };

  return (
    <div className="time-slider-container">
      <div className="time-slider-header">
        <div className="time-slider-label">
          <Clock size={14} style={{ marginRight: '6px' }} />
          <span>TIME TRAVEL</span>
        </div>
        <span className="time-slider-date">{selectedDate}</span>
      </div>

      <input
        type="range"
        min="0"
        max={dates.length - 1}
        value={currentIndex === -1 ? dates.length - 1 : currentIndex}
        onChange={handleRangeChange}
        className="time-slider-input"
      />

      <div className="time-slider-ticks">
        {dates.map((date, i) => (
          <div 
            key={date} 
            className={`time-slider-tick ${i === currentIndex ? 'active' : ''}`}
            title={date}
          />
        ))}
      </div>
    </div>
  );
};

export default TimeSlider;
