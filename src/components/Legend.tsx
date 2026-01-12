import { useState } from 'react';
// @ts-ignore
import { Layers, X } from 'lucide-react';

export default function Legend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="legend-wrapper">
      {/* EXPANDED PANEL */}
      {isOpen && (
        <div className="legend-panel">
          <div className="legend-header">
            <span>VISUAL KEY</span>
            <button onClick={() => setIsOpen(false)} className="legend-close">
              <X size={14} />
            </button>
          </div>
          
          <div className="legend-grid">
            {/* 1. PREDICTION (Dashed) */}
            <div className="legend-item">
              <div className="symbol-line dashed"></div>
              <span>MOMENTUM (FUTURE)</span>
            </div>

            {/* 2. HISTORY (Solid) */}
            <div className="legend-item">
              <div className="symbol-line solid"></div>
              <span>TRAJECTORY (PAST)</span>
            </div>

            {/* 3. HIGH ENERGY (Glow) */}
            <div className="legend-item">
              <div className="symbol-dot glow"></div>
              <span>HIGH ENERGY / VOL</span>
            </div>

            {/* 4. TERRITORY (Dotted) */}
            <div className="legend-item">
              <div className="symbol-grid"></div>
              <span>MARKET SECTOR</span>
            </div>
          </div>
        </div>
      )}

      {/* TOGGLE BUTTON */}
      {!isOpen && (
        <button 
          className="legend-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open Map Legend"
        >
          <Layers size={14} color="var(--accent-green)" />
          <span>LEGEND</span>
        </button>
      )}
    </div>
  );
}
