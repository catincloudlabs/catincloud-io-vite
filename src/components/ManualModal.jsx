import React, { useEffect, useState } from 'react';
import { X, BookOpen } from 'lucide-react';

const ManualModal = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('synopsis');

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const sections = [
    { id: 'synopsis', label: 'SYNOPSIS' },
    { id: 'metrics', label: 'METRIC CARDS' },
    { id: 'mag7', label: 'MAG 7 MOMENTUM' },
    { id: 'chaos', label: 'CHAOS INDEX' },
    { id: 'whales', label: 'WHALE HUNTER' },
    { id: 'controls', label: 'CONTROLS' },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box manual-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header manual-header">
          <div className="modal-title-wrapper">
            <BookOpen size={16} className="text-accent mr-2" />
            <span className="modal-title">OPERATOR MANUAL (v1.0)</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="manual-body">
          {/* Sidebar */}
          <div className="manual-sidebar">
            {sections.map(s => (
              <button 
                key={s.id}
                className={`manual-nav-btn ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => scrollToSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="manual-content">
            
            {/* 1. SYNOPSIS */}
            <section id="sec-synopsis" className="manual-section">
              <h3 className="manual-h3">1. SYNOPSIS</h3>
              <p className="manual-p">
                <strong>CatInCloud.io</strong> is a real-time quantitative dashboard monitoring 
                unusual options activity across Mag 7 and meme-tier equities.
              </p>
              <p className="manual-p">
                Data is ingested via Massive.com, normalized in Snowflake, and served via 
                static JSON endpoints for low-latency retrieval.
              </p>
            </section>

            <div className="manual-divider" />

            {/* 2. METRIC CARDS */}
            <section id="sec-metrics" className="manual-section">
              <h3 className="manual-h3">2. METRIC CARDS</h3>
              <p className="manual-p">
                Top-level KPIs providing instant situational awareness.
              </p>
              <ul className="manual-list">
                <li><strong>Pipeline State:</strong>
                  <ul className="manual-list-nested">
                    <li><span className="text-green">GREEN</span> :: All Systems Operational.</li>
                    <li><span className="text-yellow">YELLOW</span> :: Data Stale ( &gt; 26h ) or Degraded.</li>
                    <li><span className="text-red">RED</span> :: System Offline / Connectivity Lost.</li>
                  </ul>
                </li>
                <li><strong>Whale Flow:</strong> Total Net Premium traded by institutional blocks today.</li>
                <li><strong>Max Volatility:</strong> The single contract with the highest Implied Volatility (IV) in the Chaos dataset. <span className="text-purple">Purple</span> indicates extreme risk (&gt;100% IV).</li>
                <li><strong>Mag 7 Leader:</strong> The mega-cap ticker with the highest absolute sentiment flow (bullish or bearish) for the day.</li>
              </ul>
            </section>

            <div className="manual-divider" />

            {/* 3. MAG 7 MOMENTUM */}
            <section id="sec-mag7" className="manual-section">
              <h3 className="manual-h3">3. MAG 7 MOMENTUM (Time Series)</h3>
              <p className="manual-p">
                <span className="text-accent">Purpose:</span> Tracks aggregated option sentiment flow for mega-cap tech.
              </p>
              <ul className="manual-list">
                <li><strong>Metric (Y-Axis):</strong> Net Sentiment Flow. Calculated as <code>(Call Premium - Put Premium)</code> adjusted for delta.</li>
                <li><strong>Multi-Select:</strong> Toggle individual tickers (NVDA, TSLA, etc.) using the control pills in the chart footer.</li>
              </ul>
            </section>

            <div className="manual-divider" />

            {/* 4. CHAOS INDEX */}
            <section id="sec-chaos" className="manual-section">
              <h3 className="manual-h3">4. CHAOS INDEX (Scatter Plot)</h3>
              <p className="manual-p">
                <span className="text-accent">Purpose:</span> Identifies gamma exposure risk.
              </p>
              <ul className="manual-list">
                <li><strong>X-Axis (DTE):</strong> Days to Expiration. Closer to 0 = Higher Gamma Risk.</li>
                <li><strong>Y-Axis (Moneyness):</strong> Strike Price / Current Price. 1.0 = ATM.</li>
                <li><strong>Bubble Size:</strong> Relative Volume (Log Scale).</li>
              </ul>
            </section>

            <div className="manual-divider" />

            {/* 5. WHALE HUNTER */}
            <section id="sec-whales" className="manual-section">
              <h3 className="manual-h3">5. WHALE HUNTER (Flow Tape)</h3>
              <p className="manual-p">
                Filters for institutional block trades exceeding <span className="text-green">$1M premium</span>.
              </p>
              <p className="manual-p">
                <span className="text-accent">Logic:</span> See <code>models/intermediate/int_massive__whale_hunter.sql</code> via the "View Logic" button on the card.
              </p>
            </section>

            <div className="manual-divider" />

            {/* 6. CONTROLS */}
            <section id="sec-controls" className="manual-section">
              <h3 className="manual-h3">6. CONTROLS</h3>
              <ul className="manual-list">
                <li><span className="key-cap">Scroll</span> :: Zoom Chart Axes</li>
                <li><span className="key-cap">Click + Drag</span> :: Pan Chart Area</li>
                <li><span className="key-cap">Double Click</span> :: Reset Zoom</li>
              </ul>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualModal;
