import React, { useEffect, useState } from 'react';
import { X, Loader2, Hash } from 'lucide-react';

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
      
      {/* NEW CLASS: 'journal-sheet' 
         Uses the dot-grid pattern and amber border
      */}
      <div 
        className="modal-box journal-sheet" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '750px' }} 
      >
        
        {/* HEADER: Minimalist Title Block */}
        <div className="journal-header">
          <div className="journal-title-block">
            <span className="journal-super">CLASSIFIED // ARCHITECT ONLY</span>
            <h2 className="journal-title">Field Notes</h2>
          </div>
          <button className="logic-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* CONTENT AREA: 'journal-content-area' with 'journal-prose' */}
        <div className="journal-content-area custom-scrollbar">
            
            {/* Top Spacer for the mask effect */}
            <div className="h-8"></div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted space-y-4">
                    <Loader2 size={24} className="animate-spin text-amber-400" />
                    <span className="text-sm font-mono opacity-70">Decryption in progress...</span>
                </div>
            ) : (
                <div className="relative">
                    {entries.map((entry) => (
                        <article key={entry.id} className="journal-entry">
                            
                            {/* Hollow Amber Node */}
                            <div className="journal-node"></div>

                            {/* Date & Meta */}
                            <div className="journal-date">
                                <span className="text-amber-400 font-bold">{entry.date}</span>
                                <span className="opacity-30">|</span>
                                <div className="flex gap-3">
                                    {entry.tags?.map(tag => (
                                        <span 
                                            key={tag} 
                                            className="flex items-center gap-1 opacity-80"
                                            style={{ color: TAG_COLORS[tag] || TAG_COLORS.default }}
                                        >
                                            <Hash size={10} />
                                            {tag.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Headline */}
                            <h3 className="journal-entry-title">
                                {entry.title}
                            </h3>
                            
                            {/* Prose Body */}
                            <div className="journal-prose">
                                {entry.content.split('\n').map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    ))}

                    {/* Footer Ornament */}
                    <div className="flex items-center justify-center pt-8 pb-4 opacity-40">
                        <span className="font-mono text-xs text-amber-500 tracking-widest">
                            *** END OF RECORD ***
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
