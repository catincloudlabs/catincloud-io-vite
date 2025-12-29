import React, { useEffect, useState } from 'react';
import { X, CloudCog, Database, FileJson, Layout, ChevronDown } from 'lucide-react';

const ArchitectureModal = ({ isOpen, onClose }) => {
  // Track which step is expanded on mobile (null = none)
  const [activeStep, setActiveStep] = useState(null);

  const toggleStep = (stepIndex) => {
    setActiveStep(activeStep === stepIndex ? null : stepIndex);
  };

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal-box architecture-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <span className="modal-title">THE STATIC PIPELINE</span>
            <span className="tag ml-2">Latency: &lt;50ms</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="arch-container">
          <div className="arch-intro">
            High-performance architecture: Decoupling compute (Snowflake) from serving (S3).
          </div>

          {/* THE FLOW DIAGRAM */}
          <div className="arch-flow">
            
            {/* STEP 1: INGESTION & ORCHESTRATION */}
            <div 
              className={`arch-node ${activeStep === 1 ? 'active' : ''}`} 
              onClick={() => toggleStep(1)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-orange">
                  <CloudCog size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">INGESTION & TRANSFORM</div>
                    <div className="arch-tech">MWAA (Airflow)</div>
                </div>
                {/* Mobile Chevron Indicator */}
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                DAGs ingest market data, load to Snowflake, and execute <strong>dbt transformations</strong>.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 2: WAREHOUSE */}
            <div 
              className={`arch-node ${activeStep === 2 ? 'active' : ''}`} 
              onClick={() => toggleStep(2)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-blue">
                  <Database size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">WAREHOUSE</div>
                    <div className="arch-tech">Snowflake Data Lake</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                The System of Record. Stores raw JSON ingestion and materialized <strong>incremental dbt models</strong>.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 3: SERVING LAYER */}
            <div 
              className={`arch-node ${activeStep === 3 ? 'active' : ''}`} 
              onClick={() => toggleStep(3)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-green">
                  <FileJson size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">PUBLISHING DAG</div>
                    <div className="arch-tech">Airflow → S3 (JSON)</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                "The Exporter." Reads modeled data, serializes to static JSON, and pushes to <strong>S3</strong>.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 4: PRESENTATION */}
            <div 
              className={`arch-node ${activeStep === 4 ? 'active' : ''}`} 
              onClick={() => toggleStep(4)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-yellow">
                    <Layout size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">UI LAYER</div>
                    <div className="arch-tech">React / Vite</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                Fetches pre-computed JSON from S3. No database queries on page load.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="arch-footer">
            <div className="arch-cicd">
              <span className="text-accent">CI/CD:</span> Infrastructure & Models managed via GitHub Actions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;
