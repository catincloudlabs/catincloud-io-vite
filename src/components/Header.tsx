import React from 'react';
import { Clock } from 'lucide-react';

interface HeaderProps {
  dateLabel: string;
}

const Header: React.FC<HeaderProps> = ({ dateLabel }) => {
  return (
    <header className="app-header">
      {/* LEFT: CHRONOMETER */}
      <div className="header-left">
        <div className="header-chronometer">
          <div className="chrono-label">
            {/* Directly referencing the CSS variable ensures this icon 
              always matches the global theme changes.
            */}
            <Clock size={12} color="var(--accent-green)" style={{ opacity: 0.9 }} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>EVENT HORIZON</span>
          </div>
          <div className="chrono-value">
            {dateLabel}
          </div>
        </div>
      </div>
      
      {/* RIGHT SIDE IS EMPTY - CLEANER LOOK */}
    </header>
  );
};

export default Header;
