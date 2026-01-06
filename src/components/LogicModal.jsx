import React, { useEffect, useState } from 'react';
import { X, Terminal, FileCode, Layers, Book, Copy, Check } from 'lucide-react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Register languages
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('yaml', yaml);

const LogicModal = ({ isOpen, onClose, title, dagCode, dbtCode, dbtYml }) => {
  const [activeTab, setActiveTab] = useState('dag'); // 'dag', 'dbt', or 'yml'
  const [copied, setCopied] = useState(false);

  // Reset tab when opening different modal
  useEffect(() => {
    if (isOpen) {
        setActiveTab('dag');
        setCopied(false);
    }
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

  // Helper to determine language for highlighter
  const getLanguage = () => {
    if (activeTab === 'dag') return 'python';
    if (activeTab === 'yml') return 'yaml';
    return 'sql';
  };

  // Helper to get content
  const getContent = () => {
    if (activeTab === 'dag') return dagCode;
    if (activeTab === 'dbt') return dbtCode;
    if (activeTab === 'yml') return dbtYml;
    return '';
  };

  // Helper for footer source text
  const getSourceText = () => {
    if (activeTab === 'dag') return 'Source: AWS MWAA (Airflow)';
    if (activeTab === 'dbt') return 'Source: dbt Core (Snowflake)';
    if (activeTab === 'yml') return 'Source: dbt Docs (YAML)';
    return '';
  };

  const handleCopy = () => {
      const text = getContent();
      if (text) {
          navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box logic-modal" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="logic-header">
          <div className="logic-title-group">
            <div className="logic-icon-box">
                <Terminal size={18} className="text-accent" />
            </div>
            <div className="logic-title-text">
                <span className="logic-super">Inspect Logic</span>
                <span className="logic-main">{title}</span>
            </div>
          </div>
          <button className="logic-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* TABS */}
        <div className="logic-tabs">
          <button 
            className={`logic-tab ${activeTab === 'dag' ? 'active' : ''}`}
            onClick={() => setActiveTab('dag')}
          >
            <Layers size={14} className={activeTab === 'dag' ? 'text-accent' : 'text-muted'} />
            <span>Orchestration</span>
          </button>
          
          {dbtCode && (
            <button 
              className={`logic-tab ${activeTab === 'dbt' ? 'active' : ''}`}
              onClick={() => setActiveTab('dbt')}
            >
              <FileCode size={14} className={activeTab === 'dbt' ? 'text-accent' : 'text-muted'} />
              <span>Transformation</span>
            </button>
          )}

          {dbtYml && (
            <button 
              className={`logic-tab ${activeTab === 'yml' ? 'active' : ''}`}
              onClick={() => setActiveTab('yml')}
            >
              <Book size={14} className={activeTab === 'yml' ? 'text-accent' : 'text-muted'} />
              <span>Documentation</span>
            </button>
          )}
        </div>

        {/* CODE EDITOR AREA */}
        <div className="logic-editor-container">
            {/* Copy Button (Floating) */}
            <button className="logic-copy-btn" onClick={handleCopy} title="Copy Code">
                {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
                {copied && <span className="ml-1 text-green text-xs">Copied</span>}
            </button>

            <div className="custom-scrollbar logic-scroll-area">
                <SyntaxHighlighter 
                  language={getLanguage()} 
                  style={atomOneDark}
                  customStyle={{ 
                    background: 'transparent', 
                    padding: '24px', 
                    margin: 0,
                    fontSize: '0.85rem',
                    lineHeight: '1.5',
                    fontFamily: 'var(--font-mono)' 
                  }}
                  wrapLongLines={true}
                >
                  {getContent() || "-- Source code not available."}
                </SyntaxHighlighter>
            </div>
        </div>

        {/* FOOTER */}
        <div className="logic-footer">
            <div className="logic-status-dot" />
            <span className="text-xs font-mono text-muted">{getSourceText()}</span>
        </div>

      </div>
    </div>
  );
};

export default LogicModal;
