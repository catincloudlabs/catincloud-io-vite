import React, { useEffect, useState } from 'react';
import { X, Database, Cpu, Brain, Layout, ChevronDown } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const toggleStep = (stepIndex: number) => {
    setActiveStep(activeStep === stepIndex ? null : stepIndex);
  };

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
            <span className="modal-title">HYBRID INTELLIGENCE PIPELINE</span>
            <span className="tag ml-2">Latency: &lt;16ms (60fps)</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Diagram Area */}
        <div className="arch-diagram">
          
          <div className="arch-flow">
            
            {/* STEP 1: INGESTION */}
            <div 
              className={`arch-node ${activeStep === 1 ? 'active' : ''}`} 
              onClick={() => toggleStep(1)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-purple">
                    <Database size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">DATA INGESTION</div>
                    <div className="arch-tech">Python / Pandas</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                Nightly scripts scrape 2,000+ news articles and market ticks (Polygon.io).
                Data is normalized and cleaned for vectorization.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 2: INTELLIGENCE */}
            <div 
              className={`arch-node ${activeStep === 2 ? 'active' : ''}`} 
              onClick={() => toggleStep(2)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-blue">
                    <Brain size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">KNOWLEDGE GRAPH</div>
                    <div className="arch-tech">Supabase / OpenAI</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                Articles are embedded (text-embedding-3-small) and stored in pgvector.
                Graph connections ("Synapses") are built based on co-occurrence.
              </div>
            </div>

            <div className="arch-arrow">
              <span className="desktop-arrow">→</span>
              <span className="mobile-arrow">↓</span>
            </div>

            {/* STEP 3: PHYSICS ENGINE */}
            <div 
              className={`arch-node ${activeStep === 3 ? 'active' : ''}`} 
              onClick={() => toggleStep(3)}
            >
              <div className="arch-node-header">
                <div className="arch-icon-box color-green">
                    <Cpu size={24} />
                </div>
                <div className="arch-meta">
                    <div className="arch-label">PHYSICS CALC</div>
                    <div className="arch-tech">t-SNE / SciKit-Learn</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                High-dimensional market data is projected into 2D space.
                Velocity and Energy are calculated to simulate fluid dynamics.
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
                    <div className="arch-label">VISUALIZATION</div>
                    <div className="arch-tech">React / DeckGL</div>
                </div>
                <ChevronDown size={16} className="mobile-chevron" />
              </div>
              <div className="arch-desc">
                WebGL renders 250+ particles at 60fps.
                The Agent uses RAG (Retrieval Augmented Generation) to explain the data.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="arch-footer">
            <div className="arch-cicd">
              <span className="text-accent">CI/CD:</span> Full Stack Monorepo deployed via Vercel & GitHub Actions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;
