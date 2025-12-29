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
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.label}>
          <Clock size={14} style={{ marginRight: '6px' }} />
          <span>TIME TRAVEL</span>
        </div>
        <span style={styles.currentDate}>{selectedDate}</span>
      </div>

      <input
        type="range"
        min="0"
        max={dates.length - 1}
        value={currentIndex === -1 ? dates.length - 1 : currentIndex}
        onChange={handleRangeChange}
        style={styles.slider}
      />

      <div style={styles.ticks}>
        {dates.map((date, i) => (
          <div 
            key={date} 
            style={{ 
              ...styles.tick, 
              backgroundColor: i === currentIndex ? '#38bdf8' : '#475569' 
            }} 
            title={date}
          />
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '12px 16px',
    backgroundColor: 'transparent', // Transparent to blend with card
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  label: { display: 'flex', alignItems: 'center', fontWeight: 'bold' },
  currentDate: { color: '#e2e8f0', fontWeight: 'bold' },
  slider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#38bdf8', 
  },
  ticks: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '4px',
    padding: '0 4px',
  },
  tick: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
  }
};

export default TimeSlider;
