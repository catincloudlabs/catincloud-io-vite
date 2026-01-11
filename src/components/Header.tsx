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
            {/* explicit color to guarantee theme match */}
            <Clock size={10} color="var(--accent-green)" />
            <span style={{ marginLeft: '6px' }}>EVENT HORIZON</span>
          </div>
          <div className="chrono-value">{dateLabel}</div>
        </div>
      </div>
      
      {/* RIGHT SIDE EMPTY */}
    </header>
  );
};

export default Header;
