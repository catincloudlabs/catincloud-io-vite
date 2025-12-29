import React, { useEffect } from 'react';
import { X, ShieldCheck, Cloud, Database, Layout } from 'lucide-react';

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
            <span className="modal-title">SECURE ARCHITECTURE</span>
            <span className="tag ml-2">us-east-2</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="arch-container">
          <div className="arch-intro">
            "The Fortress" — Private VPC pipeline orchestrated by Airflow.
          </div>

          {/* THE FLOW DIAGRAM */}
          <div className="arch-flow">
            
            {/* STEP 1: SECURITY LAYER */}
            <div className="arch-node">
              <div className="arch-icon-box color-green">
                <ShieldCheck size={24} />
              </div>
              <div className="arch-label">SECURE ACCESS</div>
              <div className="arch-tech">AWS SSM / Private VPC</div>
              <div className="arch-desc">
                No public SSH. Bastion-less access via <strong>Session Manager</strong> into private subnets.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 2: ORCHESTRATION */}
            <div className="arch-node">
              <div className="arch-icon-box color-orange">
                <Cloud size={24} />
              </div>
              <div className="arch-label">ORCHESTRATION</div>
              <div className="arch-tech">AWS MWAA (Airflow)</div>
              <div className="arch-desc">
                Managed Airflow routing traffic via <strong>NAT Gateway</strong> & <strong>Interface Endpoints</strong>.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 3: DATA LAKEHOUSE */}
            <div className="arch-node">
              <div className="arch-icon-box color-blue">
                <Database size={24} />
              </div>
              <div className="arch-label">WAREHOUSE</div>
              <div className="arch-tech">Snowflake + S3</div>
              <div className="arch-desc">
                Raw ingestion to <strong>S3</strong> bucket. Transformation & modeling within <strong>Snowflake</strong>.
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
              <div className="arch-tech">React / Vercel</div>
              <div className="arch-desc">
                Consuming modeled data via secure API endpoints.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="arch-footer">
            <div className="arch-cicd">
              <span className="text-accent">CI/CD:</span> GitHub Actions automates the harvest & cooking schedule.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;
