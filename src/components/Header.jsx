import React, { useState } from 'react';
import ArchitectureModal from './ArchitectureModal';
import ManualModal from './ManualModal';
import BioModal from './BioModal';
import JournalModal from './JournalModal'; // Import the new modal
import { Network, BookOpen, User, CheckCircle, AlertTriangle, XCircle, Activity, Scroll } from 'lucide-react'; // Added Scroll icon
import { useSystemHeartbeat } from '../hooks/useSystemHeartbeat';

const Header = () => {
  const [isArchOpen, setArchOpen] = useState(false);
  const [isManualOpen, setManualOpen] = useState(false);
  const [isBioOpen, setBioOpen] = useState(false);
  const [isJournalOpen, setJournalOpen] = useState(false); // New State

  const { data: heartbeat, loading } = useSystemHeartbeat();

  // Status Logic
  const status = heartbeat?.system_status || 'Loading';
  let StatusIcon = Activity;
  let statusColor = "text-muted";
  let statusBg = "rgba(148, 163, 184, 0.1)";
  let statusBorder = "rgba(148, 163, 184, 0.2)";

  if (!loading && heartbeat) {
      if (status === 'Healthy') {
          StatusIcon = CheckCircle;
          statusColor = "text-green";
          statusBg = "rgba(34, 197, 94, 0.1)";
          statusBorder = "rgba(34, 197, 94, 0.2)";
      } else if (status === 'Degraded' || status === 'Stale') {
          StatusIcon = AlertTriangle;
          statusColor = "text-yellow";
          statusBg = "rgba(234, 179, 8, 0.1)";
          statusBorder = "rgba(234, 179, 8, 0.2)";
      } else {
          StatusIcon = XCircle;
          statusColor = "text-red";
          statusBg = "rgba(239, 68, 68, 0.1)";
          statusBorder = "rgba(239, 68, 68, 0.2)";
      }
  }

  return (
    <>
      <header className="app-header">
        
        {/* LEFT: LOGO + STATUS (Horizontal Group) */}
        <div className="brand-group">
          <h1 className="brand-title">
            CatInCloud<span className="text-accent">.io</span>
          </h1>

          <div className="brand-divider"></div>

          <div 
            className="status-badge-compact"
            style={{ backgroundColor: statusBg, borderColor: statusBorder }}
            title={heartbeat?.notices.join('\n') || "All Systems Operational"}
          >
            <StatusIcon size={14} className={statusColor} />
            <span className={`status-text ${statusColor}`}>
                {loading ? "INIT..." : status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* RIGHT: NAVIGATION PILL (Horizontal Group) */}
        <nav className="header-nav-pill">
          
          {/* NEW: Journal / Log Button */}
          <button 
            onClick={() => setJournalOpen(true)} 
            className="nav-link icon-link"
            aria-label="View Architect Log"
          >
            <Scroll size={14} className="mr-2" />
            <span className="desktop-only">Log</span>
          </button>

          <div className="nav-separator">/</div>

          <button 
            onClick={() => setManualOpen(true)} 
            className="nav-link icon-link"
            aria-label="Open Operator Manual"
          >
            <BookOpen size={14} className="mr-2" />
            <span className="desktop-only">Manual</span>
          </button>

          <div className="nav-separator">/</div>

          <button 
            onClick={() => setArchOpen(true)} 
            className="nav-link icon-link"
            aria-label="View System Architecture"
          >
            <Network size={14} className="mr-2" />
            <span className="desktop-only">Architecture</span>
          </button>

          <div className="nav-separator">/</div>

          <button 
            onClick={() => setBioOpen(true)} 
            className="nav-link icon-link"
            aria-label="View Biography"
          >
            <User size={14} className="mr-2" />
            <span className="desktop-only">Bio</span>
          </button>
        </nav>

      </header>

      {/* MODALS */}
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setArchOpen(false)} />
      <ManualModal isOpen={isManualOpen} onClose={() => setManualOpen(false)} />
      <BioModal isOpen={isBioOpen} onClose={() => setBioOpen(false)} />
      <JournalModal isOpen={isJournalOpen} onClose={() => setJournalOpen(false)} />
    </>
  );
};

export default Header;
