import React, { useEffect } from 'react';
import { X, Terminal, Github, Linkedin, Mail, FileText } from 'lucide-react';

const BioModal = ({ isOpen, onClose }) => {
  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box bio-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header bio-header">
          <div className="modal-title-wrapper">
            <Terminal size={16} className="text-green mr-2" />
            <span className="modal-title">user@catincloud:~$ whoami</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="bio-content">
          
          {/* PROFILE SECTION */}
          <div className="bio-grid">
            <div className="bio-avatar">
              <div className="avatar-placeholder">
                <span className="avatar-text">ME</span>
              </div>
            </div>
            
            <div className="bio-details">
              <h2 className="bio-name">CatInCloud Labs</h2>
              <div className="bio-role">Senior Data Engineer // Full Stack Data</div>
              
              <div className="bio-text">
                <p>
                  Specialized in building high-performance data pipelines and 
                  interactive analytics applications.
                </p>
                <p>
                  I bridge the gap between <strong>Back-End Data Engineering</strong> (Snowflake, dbt, Airflow) 
                  and <strong>Front-End Delivery</strong> (React, Visualization).
                </p>
              </div>
            </div>
          </div>

          <div className="manual-divider" style={{ margin: '20px 0' }} />

          {/* TECH STACK */}
          <h3 className="bio-h3">ACTIVE_STACK</h3>
          <div className="stack-grid">
            <div className="stack-item"><span className="text-accent">Compute:</span> Snowflake, Spark, DuckDB</div>
            <div className="stack-item"><span className="text-accent">Orchestration:</span> Airflow (MWAA), Dagster</div>
            <div className="stack-item"><span className="text-accent">Transformation:</span> dbt Core, Python, SQL</div>
            <div className="stack-item"><span className="text-accent">Interface:</span> React, Vite, D3.js</div>
          </div>

          <div className="manual-divider" style={{ margin: '20px 0' }} />

          {/* CONTACT LINKS */}
          <h3 className="bio-h3">CONNECT</h3>
          <div className="contact-row">
            <a href="https://github.com/catincloudlabs" target="_blank" rel="noreferrer" className="contact-btn">
              <Github size={18} />
              <span>GitHub</span>
            </a>
            <a href="https://linkedin.com/in/dave-anaya/" target="_blank" rel="noreferrer" className="contact-btn">
              <Linkedin size={18} />
              <span>LinkedIn</span>
            </a>
            <a href="mailto:hello@catincloud.io" className="contact-btn">
              <Mail size={18} />
              <span>Email</span>
            </a>
            <a href="/resume.pdf" target="_blank" className="contact-btn btn-primary">
              <FileText size={18} />
              <span>Resume</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BioModal;
