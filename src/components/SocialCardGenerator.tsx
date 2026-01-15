// @ts-ignore
import { Activity, Cpu, Network, Terminal } from 'lucide-react';

export const SocialCardGenerator = () => {
  return (
    <div className="social-card">
      
      {/* 1. ABSTRACT BACKGROUND GRID (The "Data") */}
      <div className="social-card-bg" />

      {/* 2. GLOWING ORBS (The "Cluster") */}
      <div className="social-card-orbs" />

      {/* 3. TOP BAR */}
      <div className="social-card-top">
        <div className="social-brand-row">
          <div className="social-brand-dot" />
          <span className="social-brand-name">CATINCLOUD.IO</span>
        </div>
        <div className="social-status-badge">
          SYSTEM_ONLINE_v2.4
        </div>
      </div>

      {/* 4. CENTRAL HEADLINE */}
      <div className="social-headline-box">
        <h1 className="social-h1">
          MARKET PHYSICS<br/>ENGINE
        </h1>
        <p className="social-sub">
          Real-time visualization of high-dimensional financial data using hybrid intelligence.
        </p>
      </div>

      {/* 5. BOTTOM METRICS / BADGES */}
      <div className="social-footer">
        <Badge icon={<Activity size={18} />} label="LIVE VELOCITY" value="60 FPS" />
        <Badge icon={<Network size={18} />} label="NODES" value="2,400+" />
        <Badge icon={<Cpu size={18} />} label="LATENCY" value="<16ms" />
        <Badge icon={<Terminal size={18} />} label="AGENT" value="ACTIVE" />
      </div>

    </div>
  );
};

// Helper for the badges
const Badge = ({ icon, label, value }: any) => (
  <div className="social-metric">
    <div className="social-metric-icon">{icon}</div>
    <div className="social-metric-text">
      <span className="social-metric-label">{label}</span>
      <span className="social-metric-val">{value}</span>
    </div>
  </div>
);
