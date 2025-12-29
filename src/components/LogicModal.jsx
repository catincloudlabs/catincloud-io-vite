import React, { useEffect } from 'react';
import { X, Terminal } from 'lucide-react';

const LogicModal = ({ isOpen, onClose, title, sqlCode }) => {
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
      <div className="modal-box logic-modal" onClick={e => e.stopPropagation()}>
        
        {/* Editor Header */}
        <div className="modal-header logic-header">
          <div className="modal-title-wrapper">
            <Terminal size={16} className="text-accent mr-2" />
            <span className="modal-title">{title} :: LOGIC</span>
          </div>
          <button className="panel-toggle-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Code Content */}
        <div className="logic-content">
          <div className="code-block-wrapper">
            <pre className="sql-code">
              <code>{sqlCode || "-- No logic definition found."}</code>
            </pre>
          </div>
          
          <div className="logic-footer">
            <span className="text-muted">Source: dbt (Snowflake)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogicModal;
