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
            
            <section id="sec-synopsis" className="manual-section">
              <h3 className="manual-h3">1. SYNOPSIS</h3>
              <p className="manual-p">
                <strong>CatInCloud.io</strong> is a real-time quantitative dashboard monitoring 
                unusual options activity across Mag 7 and meme-tier equities.
              </p>
              <p className="manual-p">
                Data is ingested via Polygon.io, normalized in Snowflake, and served via 
                static JSON endpoints for low-latency retrieval.
              </p>
            </section>

            <div className="manual-divider" />

            <section id="sec-chaos" className="manual-section">
              <h3 className="manual-h3">2. CHAOS INDEX (Scatter Plot)</h3>
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

            <section id="sec-whales" className="manual-section">
              <h3 className="manual-h3">3. WHALE HUNTER (Flow Tape)</h3>
              <p className="manual-p">
                Filters for institutional block trades exceeding <span className="text-green">$1M premium</span>.
              </p>
              <p className="manual-p">
                <span className="text-accent">Logic:</span> See <code>models/marts/core/fct_whale_flow.sql</code> via the "View Logic" button on the card.
              </p>
            </section>

            <div className="manual-divider" />

            <section id="sec-controls" className="manual-section">
              <h3 className="manual-h3">4. CONTROLS</h3>
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
