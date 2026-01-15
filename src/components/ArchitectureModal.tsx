import React, { useEffect, useState } from 'react';
import { X, Database, Cpu, Brain, Layout } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<number | null>(1); 

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
        className="modal-box architecture-modal" 
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="arch-modal-title"
      >
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Cpu size={16} className="text-accent" aria-hidden="true" />
            <span className="modal-title" id="arch-modal-title">SYSTEM_ARCHITECTURE</span>
            <span className="tag ml-2">LIVE</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose} aria-label="Close Architecture Diagram">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Diagram Area */}
        <div className="arch-diagram">
          
          <div className="arch-flow">
            
            {/* STEP 1 */}
            <div 
              className={`arch-node ${activeStep === 1 ? 'active' : ''}`} 
              onClick={() => setActiveStep(1)}
              role="button"
              aria-label="Step 1: Ingestion"
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Database size={20} aria-hidden="true" />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">01. INGESTION</div>
                    <div className="arch-tech">Python / Pandas</div>
                </div>
              </div>
              <div className="arch-desc">
                Daily scraping of 2,000+ market articles. Data normalization and cleaning.
              </div>
            </div>

            <div className="arch-arrow" aria-hidden="true">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 2 */}
            <div 
              className={`arch-node ${activeStep === 2 ? 'active' : ''}`} 
              onClick={() => setActiveStep(2)}
              role="button"
              aria-label="Step 2: Synthesis"
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Brain size={20} aria-hidden="true" />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">02. SYNTHESIS</div>
                    <div className="arch-tech">OpenAI / Supabase</div>
                </div>
              </div>
              <div className="arch-desc">
                Vector embedding generation (text-embedding-3). Semantic graph construction.
              </div>
            </div>

            <div className="arch-arrow" aria-hidden="true">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 3 */}
            <div 
              className={`arch-node ${activeStep === 3 ? 'active' : ''}`} 
              onClick={() => setActiveStep(3)}
              role="button"
              aria-label="Step 3: Physics"
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Cpu size={20} aria-hidden="true" />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">03. PHYSICS</div>
                    <div className="arch-tech">t-SNE / SciKit</div>
                </div>
              </div>
              <div className="arch-desc">
                High-dimensional projection to 2D space. Velocity/Mass calculation.
              </div>
            </div>

            <div className="arch-arrow" aria-hidden="true">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 4 */}
            <div 
              className={`arch-node ${activeStep === 4 ? 'active' : ''}`} 
              onClick={() => setActiveStep(4)}
              role="button"
              aria-label="Step 4: Render"
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Layout size={20} aria-hidden="true" />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">04. RENDER</div>
                    <div className="arch-tech">React / DeckGL</div>
                </div>
              </div>
              <div className="arch-desc">
                60fps WebGL particle system. Real-time RAG agent interaction.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="arch-footer">
            <span className="text-accent">PIPELINE STATUS:</span> OPTIMIZED (16ms Latency)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;
