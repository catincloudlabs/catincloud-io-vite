import React, { useEffect } from 'react';
import { X, CloudCog, Database, FileJson, Layout } from 'lucide-react';

const ArchitectureModal = ({ isOpen, onClose }) => {
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
            <div className="arch-node">
              <div className="arch-icon-box color-orange">
                <CloudCog size={24} />
              </div>
              <div className="arch-label">INGESTION & TRANSFORM</div>
              <div className="arch-tech">MWAA (Airflow)</div>
              <div className="arch-desc">
                DAGs ingest market data, load to Snowflake, and trigger <code>dbt build</code> models.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 2: WAREHOUSE */}
            <div className="arch-node">
              <div className="arch-icon-box color-blue">
                <Database size={24} />
              </div>
              <div className="arch-label">WAREHOUSE</div>
              <div className="arch-tech">Snowflake Data Lake</div>
              <div className="arch-desc">
                The System of Record. Stores raw JSON ingestion and materialized dbt models.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 3: SERVING LAYER */}
            <div className="arch-node">
              <div className="arch-icon-box color-green">
                <FileJson size={24} />
              </div>
              <div className="arch-label">PUBLISHING DAG</div>
              <div className="arch-tech">Airflow → S3 (JSON)</div>
              <div className="arch-desc">
                "The Exporter." Reads modeled data, serializes to static JSON, and pushes to <strong>S3</strong>.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 4: PRESENTATION */}
            <div className="arch-node">
              <div className="arch-icon-box color-yellow">
                <Layout size={24} />
              </div>
              <div className="arch-label">UI LAYER</div>
              <div className="arch-tech">React / Vite</div>
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
