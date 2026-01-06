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
    { id: 'psych', label: 'MARKET PSYCH' },
    { id: 'chaos', label: 'CHAOS MAP' },
    { id: 'risk', label: 'RISK RADAR' },
    { id: 'whales', label: 'WHALE HUNTER' },
    { id: 'controls', label: 'CONTROLS' },
  ];

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  // The purple used in .ai-hero-card tags
  const purpleStyle = { color: '#e879f9' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box manual-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header manual-header">
          <div className="modal-title-wrapper">
            <BookOpen size={16} className="text-accent mr-2" />
            <span className="modal-title">OPERATOR MANUAL (v1.2)</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="manual-body">
          {/* Sidebar (Desktop) / Tabs (Mobile) */}
          {/* UPDATED: Wrapper added for CSS fade mask effect */}
          <div className="manual-sidebar-wrapper">
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
          </div>

          {/* Content */}
          <div className="manual-content">
            
            {/* 1. SYNOPSIS */}
            <section id="sec-synopsis" className="manual-section">
              <h3 className="manual-h3">1. SYNOPSIS</h3>
              <p className="manual-p">
                <strong>CatInCloud.io</strong> is a quantitative dashboard monitoring 
                asymmetric risk and semantic data clusters across the "Mag 7" equities.
              </p>
              <p className="manual-p">
                Data is ingested via distributed pipelines, normalized in Snowflake, and served 
                as static JSON artifacts for ultra-low latency retrieval.
              </p>
            </section>

            <div className="manual-divider" />

            {/* 2. MARKET PSYCHOLOGY */}
            <section id="sec-psych" className="manual-section">
              <h3 className="manual-h3">2. MARKET PSYCHOLOGY (AI Model)</h3>
              <p className="manual-p">
                <span style={purpleStyle}>Dataset:</span> <code>market_psychology_map.json</code>
              </p>
              <p className="manual-p">
                Visualizes the "Narrative Landscape" by clustering thousands of news headlines using vector embeddings.
              </p>
              <ul className="manual-list">
                <li><strong>Algorithm:</strong> High-dimensional OpenAI text embeddings reduced via t-SNE.</li>
                <li><strong>Node Size:</strong> Proportional to <strong>News Volume</strong> (Cluster Density).</li>
                <li><span style={purpleStyle}>Color:</span> Represents Aggregate Sentiment.
                    <ul className="manual-list-nested">
                        <li><span className="text-red">RED</span> :: Negative Sentiment (Fear)</li>
                        <li><span className="text-green">GREEN</span> :: Positive Sentiment (Greed)</li>
                        <li><span className="text-muted">GRAY</span> :: Neutral / Noise</li>
                    </ul>
                </li>
              </ul>
            </section>

            <div className="manual-divider" />

            {/* 3. CHAOS MAP */}
            <section id="sec-chaos" className="manual-section">
              <h3 className="manual-h3">3. CHAOS MAP (Structure)</h3>
              <p className="manual-p">
                <span style={purpleStyle}>Dataset:</span> <code>chaos.json</code>
              </p>
              <p className="manual-p">
                Isolates "Pin Risk" by plotting the Option Chain surface. Identifies where dealers may be forced to hedge.
              </p>
              <ul className="manual-list">
                <li><strong>X-Axis (DTE):</strong> 0 to 60 Days. Left-tail indicates immediate Gamma risk.</li>
                <li><strong>Y-Axis (Moneyness):</strong> Strike / Spot Price. 
                    <br/><code>1.0</code> = ATM. <code>&gt;1.0</code> = OTM Call / ITM Put.
                </li>
                <li><strong>Chaos Score (Size):</strong> A composite metric weighting <code>Relative Vol * Implied Volatility</code>. Large bubbles = High impact nodes.</li>
              </ul>
            </section>

            <div className="manual-divider" />

            {/* 4. RISK RADAR */}
            <section id="sec-risk" className="manual-section">
              <h3 className="manual-h3">4. RISK RADAR (Scatter)</h3>
              <p className="manual-p">
                <span className="text-accent">Dataset:</span> <code>sentiment_volatility.json</code>
              </p>
              <p className="manual-p">
                Detects pricing dislocations by contrasting "What they say" (News) vs "What they pay" (Volatility).
              </p>
              <ul className="manual-list">
                <li><strong>X-Axis (Sentiment):</strong> NLP Signal (-1.0 to +1.0).</li>
                <li><strong>Y-Axis (IV):</strong> 30-Day Implied Volatility %.</li>
                <li><strong>Signal Interpretation:</strong>
                    <ul className="manual-list-nested">
                        <li><strong>Top Left:</strong> High Fear (High IV, Low Sentiment).</li>
                        <li><strong>Bottom Right:</strong> Complacency (Low IV, High Sentiment).</li>
                    </ul>
                </li>
              </ul>
            </section>

            <div className="manual-divider" />

            {/* 5. WHALE HUNTER */}
            <section id="sec-whales" className="manual-section">
              <h3 className="manual-h3">5. WHALE HUNTER (Flow Tape)</h3>
              <p className="manual-p">
                <span className="text-accent">Dataset:</span> <code>whales.json</code>
              </p>
              <p className="manual-p">
                A filtered tape of institutional block trades with premiums exceeding <span className="text-green">$1M</span>.
              </p>
              <ul className="manual-list">
                <li><strong>PREM:</strong> Total cash value of the trade.</li>
                <li><strong>SENT:</strong> Directional bias. 
                    <br/>Derived from trade side (Ask = Bullish, Bid = Bearish) and OTM/ITM positioning.
                </li>
                <li><strong>TYPE:</strong> <code>C</code> (Call) or <code>P</code> (Put).</li>
              </ul>
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
