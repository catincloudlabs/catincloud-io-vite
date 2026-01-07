import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';

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

  // Derive the active entry (Latest) for the Header Title & Date
  const activeEntry = entries.length > 0 ? entries[0] : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-box journal-sheet" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '750px' }} 
      >
        
        {/* HEADER */}
        <div className="journal-header">
          <div className="journal-title-block">
            <span className="journal-super">ARCHITECT'S JOURNAL</span>
            
            {/* DYNAMIC TITLE */}
            <h2 className="journal-title">
                {activeEntry ? activeEntry.title : 'Loading Entry...'}
            </h2>
            
            {/* DYNAMIC DATE (Moved here) */}
            <span className="journal-header-date">
                {activeEntry ? activeEntry.date : ''}
            </span>
          </div>
          
          <button className="logic-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="journal-content-area custom-scrollbar">
            
            <div className="h-8"></div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted space-y-4">
                    <Loader2 size={24} className="animate-spin text-amber-400" />
                    <span className="text-sm font-mono opacity-70">Entry loading...</span>
                </div>
            ) : (
                <div className="relative">
                    {entries.map((entry) => (
                        <article key={entry.id} className="journal-entry">
                            
                            {/* Hollow Amber Node (Kept for timeline visual) */}
                            <div className="journal-node"></div>
                            
                            {/* Prose Body (Clean - No Date/Title here) */}
                            <div className="journal-prose">
                                {entry.content.split('\n').map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
