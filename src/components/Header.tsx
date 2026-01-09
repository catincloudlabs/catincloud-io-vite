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
            <Clock size={10} className="text-accent-green" />
            <span>EVENT HORIZON</span>
          </div>
          <div className="chrono-value">{dateLabel}</div>
        </div>
      </div>
      
      {/* RIGHT SIDE IS NOW EMPTY - CLEANER LOOK */}
    </header>
  );
};

export default Header;
