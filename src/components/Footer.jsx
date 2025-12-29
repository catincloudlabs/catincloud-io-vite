import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal'; 

const Footer = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  return (
    <>
      <footer className="app-footer">
        <div>
          Built by <a href="https://catincloudlabs.com" className="nav-link hover:underline">CatInCloud Labs</a>
        </div>
        
        {/* Architecture Trigger Line */}
        <div className="footer-meta">
          <button 
            onClick={() => setModalOpen(true)}
            className="footer-trigger" 
          >
            System Architecture
          </button>
          <span className="footer-separator">•</span>
          <span>v1.0.0</span>
        </div>
      </footer>

      <ArchitectureModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
};

export default Footer;
