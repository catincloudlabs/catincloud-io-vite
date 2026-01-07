import React, { useEffect, useState } from 'react';
import { X, Book, Terminal } from 'lucide-react';

const TAG_COLORS = {
  'Architecture': '#c084fc', // Purple
  'Engineering':  '#38bdf8', // Blue
  'Performance':  '#f87171', // Red
  'Flow':         '#4ade80', // Green
  'Personal':     '#fbbf24', // Amber
  'default':      '#94a3b8'  // Gray
};

const JournalModal = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Close on Escape Key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Fetch Data on Open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/data/journal_entry.json')
        .then(res => {
            if (!res.ok) throw new Error("Failed to load journal");
            return res.json();
        })
        .then(data => {
          setEntries(data.entries);
          setLoading(false);
        })
        .catch(err => {
          console.error("Journal Fetch Error:", err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box" 
        onClick={e => e.stopPropagation()}
        style={{ 
            maxWidth: '800px', 
            '--dynamic-accent': '#fbbf24' // Amber accent
        }} 
      >
        
        {/* HEADER */}
        <div className="logic-header">
          <div className="logic-title-group">
            <div className="logic-icon-box">
                <Book size={18} className="dynamic-text-color" />
            </div>
            <div className="logic-title-text">
                <span className="logic-super dynamic-text-color">System Journal</span>
                <span className="logic-main">Engineering Brainstorms</span>
            </div>
          </div>
          <button className="logic-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="custom-scrollbar" style={{ 
            height: '600px', 
            overflowY: 'auto', 
            padding: '32px' 
        }}>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted space-y-4">
                    <Terminal size={24} className="animate-pulse opacity-50" />
                    <span className="text-sm font-mono animate-pulse">Initializing Journal Protocol...</span>
                </div>
            ) : (
                <div className="space-y-12">
                    {entries.map((entry, idx) => (
                        <article key={entry.id} className="relative pl-6 border-l border-slate-800">
                            
                            {/* Terminal-style Connector Dot */}
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 bg-[#0f172a] border border-slate-600 rounded-full"></div>

                            {/* Meta Header - "Terminal Prompt" style */}
                            <div className="flex flex-wrap items-center gap-3 mb-3 font-mono text-xs">
                                <span className="text-accent opacity-80">&gt;</span>
                                <span className="text-slate-400">{entry.date}</span>
                                <span className="text-slate-600">|</span>
                                <div className="flex gap-2">
                                    {entry.tags?.map(tag => (
                                        <span 
                                            key={tag} 
                                            style={{ color: TAG_COLORS[tag] || TAG_COLORS.default }}
                                        >
                                            #{tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-100 mb-4 tracking-tight">
                                {entry.title}
                            </h3>
                            
                            {/* Body Text */}
                            <div className="text-gray-400 leading-relaxed font-sans text-sm space-y-4">
                                {entry.content.split('\n').map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    ))}

                    {/* End of Stream Marker */}
                    <div className="flex items-center justify-center pt-8 opacity-40">
                         <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                            <span className="w-2 h-2 bg-slate-500 animate-pulse"></span>
                            END OF STREAM
                         </span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
