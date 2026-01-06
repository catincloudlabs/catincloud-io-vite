import React, { useEffect, useState } from 'react';
import { X, Terminal, Github, Linkedin, Mail, Globe, Bot } from 'lucide-react'; 

const BioModal = ({ isOpen, onClose }) => {
  const [imgError, setImgError] = useState(false);

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
            <span className="modal-title">dave@root:~$ whoami</span>
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
              {!imgError ? (
                <img 
                  src="/avatar.jpg" 
                  alt="Profile" 
                  className="bio-profile-img" 
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="avatar-placeholder">
                  <Bot size={48} />
                </div>
              )}
            </div>
            
            <div className="bio-details">
              <h2 className="bio-name">Dave Anaya</h2>
              <div className="bio-role">Lead Cloud & Data Architect</div>
              
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

          <div className="manual-divider bio-divider" />

          {/* TECH STACK */}
          <h3 className="bio-h3">ACTIVE_STACK</h3>
          <div className="stack-grid">
            <div className="stack-item"><span className="text-accent">Compute:</span> Snowflake, Python (Pandas)</div>
            <div className="stack-item"><span className="text-accent">Orchestration:</span> Airflow (MWAA)</div>
            <div className="stack-item"><span className="text-accent">Transformation:</span> dbt Core, SQL</div>
            <div className="stack-item"><span className="text-accent">Interface:</span> React, Vite, Plotly.js</div>
          </div>

          <div className="manual-divider bio-divider" />

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
            <a href="mailto:dave@catincloudlabs.com" className="contact-btn">
              <Mail size={18} />
              <span>Email</span>
            </a>
            
            {/* Main Site Link */}
            <a href="https://catincloudlabs.com" target="_blank" rel="noreferrer" className="contact-btn btn-primary">
              <Globe size={18} />
              <span>Main Site</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BioModal;
