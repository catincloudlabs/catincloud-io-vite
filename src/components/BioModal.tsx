import React, { useEffect } from 'react';
import { X, Terminal, Github, Linkedin, Mail, Globe } from 'lucide-react'; 

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
      <div className="modal-box bio-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header bio-header">
          <div className="modal-title-wrapper">
            <Terminal size={16} className="text-purple mr-2" />
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
              <p className="bio-desc">
                Specializing in high-performance data pipelines, real-time visualization, 
                and bridging the gap between Data Science and Product Engineering.
              </p>
            </div>
          </div>

          <div className="manual-divider bio-divider" />

          {/* TECH STACK */}
          <h3 className="bio-h3">CURRENT STACK</h3>
          <div className="stack-grid">
            <div className="stack-item"><span className="text-accent">Core:</span> Python, TypeScript, SQL</div>
            <div className="stack-item"><span className="text-accent">Data:</span> Supabase, PostgreSQL, pgvector</div>
            <div className="stack-item"><span className="text-accent">AI/ML:</span> OpenAI Embeddings, SciKit-Learn</div>
            <div className="stack-item"><span className="text-accent">Visual:</span> React, DeckGL, D3.js</div>
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
            
            <a href="https://catincloudlabs.com" target="_blank" rel="noreferrer" className="contact-btn btn-primary">
              <Globe size={18} />
              <span>Portfolio</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BioModal;
