import React, { useEffect } from 'react';
import { X, Terminal, Github, Linkedin, Mail, Globe, MapPin } from 'lucide-react'; 

interface BioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BioModal: React.FC<BioModalProps> = ({ isOpen, onClose }) => {

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box bio-modal" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bio-modal-title"
      >
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Terminal size={16} className="text-accent" aria-hidden="true" />
            <span className="modal-title" id="bio-modal-title">USER_RECORD: DAVE_ANAYA</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose} aria-label="Close Profile">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="bio-content">
          
          {/* PROFILE SECTION */}
          <div className="bio-grid">
            <div className="bio-avatar">
              <img 
                src="/avatar.jpg" 
                alt="Profile" 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none'; 
                }} 
              />
            </div>
            <div className="bio-text">
              <h2 className="bio-name">Dave Anaya</h2>
              <p className="bio-role">Senior Data Engineer & Architect</p>
              {/* UPDATED: Removed hardcoded hex, used variable */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <MapPin size={12} aria-hidden="true" />
                <span>Minneapolis, MN</span>
              </div>
              <p className="bio-desc">
                Building high-performance data pipelines and real-time visualization systems. 
                Bridging Data Science and Product Engineering.
              </p>
            </div>
          </div>

          <div className="bio-divider" />

          {/* TECH STACK */}
          <h3 className="bio-h3">TECHNICAL_STACK</h3>
          <div className="stack-grid">
            <div className="stack-item">
                <span className="text-accent">LANG:</span> Python, TypeScript, SQL, Rust
            </div>
            <div className="stack-item">
                <span className="text-accent">DATA:</span> Supabase, PostgreSQL, pgvector, Redis
            </div>
            <div className="stack-item">
                <span className="text-accent">ML/AI:</span> OpenAI, SciKit-Learn, PyTorch
            </div>
            <div className="stack-item">
                <span className="text-accent">VISUAL:</span> React, DeckGL, D3.js, WebGL
            </div>
          </div>

          <div className="bio-divider" />

          {/* CONTACT LINKS */}
          <h3 className="bio-h3">UPLINK</h3>
          <div className="contact-row">
            <a href="https://github.com/catincloudlabs" target="_blank" rel="noreferrer" className="contact-btn">
              <Github size={14} aria-hidden="true" />
              <span>GITHUB</span>
            </a>
            <a href="https://linkedin.com/in/dave-anaya/" target="_blank" rel="noreferrer" className="contact-btn">
              <Linkedin size={14} aria-hidden="true" />
              <span>LINKEDIN</span>
            </a>
            <a href="mailto:dave@catincloudlabs.com" className="contact-btn">
              <Mail size={14} aria-hidden="true" />
              <span>EMAIL</span>
            </a>
            <a href="https://catincloudlabs.com" target="_blank" rel="noreferrer" className="contact-btn btn-primary">
              <Globe size={14} aria-hidden="true" />
              <span>PORTFOLIO</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BioModal;
