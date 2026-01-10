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
    <div className="modal-overlay" onClick={onClose} style={{ display: 'flex' }}>
      <div className="modal-box architecture-modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <Cpu size={16} className="text-accent" />
            <span className="modal-title">SYSTEM_ARCHITECTURE</span>
            <span className="tag ml-2">LIVE</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Diagram Area */}
        <div className="arch-diagram">
          
          <div className="arch-flow">
            
            {/* STEP 1 */}
            <div 
              className={`arch-node ${activeStep === 1 ? 'active' : ''}`} 
              onClick={() => setActiveStep(1)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Database size={20} />
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

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 2 */}
            <div 
              className={`arch-node ${activeStep === 2 ? 'active' : ''}`} 
              onClick={() => setActiveStep(2)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Brain size={20} />
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

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 3 */}
            <div 
              className={`arch-node ${activeStep === 3 ? 'active' : ''}`} 
              onClick={() => setActiveStep(3)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Cpu size={20} />
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

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 4 */}
            <div 
              className={`arch-node ${activeStep === 4 ? 'active' : ''}`} 
              onClick={() => setActiveStep(4)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box">
                    <Layout size={20} />
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
