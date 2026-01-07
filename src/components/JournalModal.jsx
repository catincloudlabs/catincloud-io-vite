import React, { useEffect, useState } from 'react';
import { X, BookOpen, Calendar, Scroll } from 'lucide-react';

// --- COLOR MAPPING FOR TAGS ---
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
            '--dynamic-accent': '#fbbf24' // Amber accent for the Journal
        }} 
      >
        
        {/* HEADER (Reusing LogicModal styles for consistency) */}
        <div className="logic-header">
          <div className="logic-title-group">
            <div className="logic-icon-box">
                <BookOpen size={18} className="dynamic-text-color" />
            </div>
            <div className="logic-title-text">
                <span className="logic-super dynamic-text-color">Personal Log</span>
                <span className="logic-main">Architect's Journal</span>
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
                    <Scroll size={24} className="animate-pulse opacity-50" />
                    <span className="text-sm font-mono animate-pulse">Retrieving entries...</span>
                </div>
            ) : (
                <div className="space-y-10">
                    {entries.map(entry => (
                        <article key={entry.id} className="border-l-2 border-slate-800 pl-6 relative">
                            {/* Dot Indicator on the timeline line */}
                            <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-700" />

                            {/* Meta Header */}
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <span className="text-xs font-mono text-muted flex items-center">
                                    <Calendar size={12} className="mr-1.5" />
                                    {entry.date}
                                </span>
                                <div className="flex gap-2">
                                    {entry.tags?.map(tag => (
                                        <span 
                                            key={tag} 
                                            className="text-[10px] px-2 py-0.5 rounded-sm font-mono tracking-wide"
                                            style={{ 
                                                color: TAG_COLORS[tag] || TAG_COLORS.default,
                                                backgroundColor: `${TAG_COLORS[tag] || TAG_COLORS.default}15`,
                                            }}
                                        >
                                            {tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-bold text-gray-100 mb-3 tracking-tight">
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

                    {/* End of Log Marker */}
                    <div className="flex items-center justify-center pt-8 opacity-30">
                        <div className="h-px bg-slate-700 w-16 mx-4"></div>
                        <span className="text-xs font-mono text-slate-500">END OF LOG</span>
                        <div className="h-px bg-slate-700 w-16 mx-4"></div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
