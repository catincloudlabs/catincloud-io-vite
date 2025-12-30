import React, { useEffect, useState } from 'react';
import { X, Terminal, FileCode, Layers } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Register languages
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('python', python);

const LogicModal = ({ isOpen, onClose, title, dagCode, dbtCode }) => {
  const [activeTab, setActiveTab] = useState('dag'); // 'dag' or 'dbt'

  // Reset tab when opening different modal
  useEffect(() => {
    if (isOpen) setActiveTab('dag');
  }, [isOpen]);

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

        {/* TAB BAR */}
        <div className="logic-tabs">
          <button 
            className={`logic-tab ${activeTab === 'dag' ? 'active' : ''}`}
            onClick={() => setActiveTab('dag')}
          >
            <Layers size={14} className="mr-2 icon-blue" />
            <span>airflow_dag.py</span>
          </button>
          
          {dbtCode && (
            <button 
              className={`logic-tab ${activeTab === 'dbt' ? 'active' : ''}`}
              onClick={() => setActiveTab('dbt')}
            >
              <FileCode size={14} className="mr-2 icon-orange" />
              <span>model.sql</span>
            </button>
          )}
        </div>

        {/* Code Content */}
        <div className="logic-content">
          <div className="code-block-wrapper">
            <SyntaxHighlighter 
              language={activeTab === 'dag' ? 'python' : 'sql'} 
              style={atomOneDark}
              customStyle={{ 
                background: 'transparent', 
                padding: 0, 
                margin: 0,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)' 
              }}
              wrapLongLines={true}
            >
              {(activeTab === 'dag' ? dagCode : dbtCode) || "-- Source code not available."}
            </SyntaxHighlighter>
          </div>
          
          <div className="logic-footer">
            <span className="text-muted">
              {activeTab === 'dag' ? 'Source: AWS MWAA (Airflow)' : 'Source: dbt Core (Snowflake)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogicModal;
