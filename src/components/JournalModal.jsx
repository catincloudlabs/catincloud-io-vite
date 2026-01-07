import React, { useEffect, useState } from 'react';
import { X, Book, Loader2 } from 'lucide-react'; // Switched Terminal icon to Loader2 for loading state

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
      fetch('/data/journal.json')
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
                <span className="logic-super dynamic-text-color">Architect's Journal</span>
                <span className="logic-main">Engineering Notes</span>
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
            padding: '40px' // Increased padding for a more readable "page" feel
        }}>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted space-y-4">
                    <Loader2 size={24} className="animate-spin opacity-50" />
                    <span className="text-sm font-sans opacity-70">Loading notes...</span>
                </div>
            ) : (
                <div className="space-y-16"> {/* Increased spacing between entries */}
                    {entries.map((entry, idx) => (
                        <article key={entry.id} className="relative pl-8 border-l border-slate-800">
                            
                            {/* Timeline Node (Replaces the "techy" dot) */}
                            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-slate-800 border-2 border-[var(--dynamic-accent)] z-10"></div>

                            {/* Meta Header - Clean & Typographic */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 text-xs tracking-wide">
                                <span className="font-mono text-[var(--dynamic-accent)] font-bold">
                                    {entry.date}
                                </span>
                                <span className="text-slate-600">•</span>
                                <div className="flex gap-2">
                                    {entry.tags?.map(tag => (
                                        <span 
                                            key={tag} 
                                            className="font-mono opacity-80"
                                            style={{ color: TAG_COLORS[tag] || TAG_COLORS.default }}
                                        >
                                            #{tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-gray-100 mb-4 tracking-tight">
                                {entry.title}
                            </h3>
                            
                            {/* Body Text */}
                            <div className="text-gray-400 leading-7 font-sans text-sm space-y-4">
                                {entry.content.split('\n').map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    ))}

                    {/* Footer Ornament (Replaces "END OF STREAM") */}
                    <div className="flex items-center justify-center pt-12 pb-4 opacity-30">
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent w-24"></div>
                        <span className="mx-4 text-slate-500 text-lg">❖</span>
                        <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent w-24"></div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
