import { TrendingUp, Globe, Zap, Box } from 'lucide-react';

export const SocialCardGenerator = () => {
  return (
    <div className="social-card-modern">
      
      {/* Subtle Background Accents */}
      <div className="modern-bg-gradient" />
      <div className="modern-accent-line" />

      {/* Main Content Layer */}
      <div className="modern-content">
        
        {/* Header Row */}
        <div className="modern-header">
            <span className="modern-brand">CATINCLOUD.IO</span>
            <span className="modern-badge">BETA</span>
        </div>

        {/* Hero Typography */}
        <h1 className="modern-title">
          Market Intelligence,<br />
          <span className="text-mint">Refined.</span>
        </h1>

        <p className="modern-sub">
          A high-dimensional physics engine for real-time financial visualization and analysis.
        </p>

        {/* Clean Feature Grid */}
        <div className="modern-feature-grid">
           <FeatureItem icon={<TrendingUp size={20} />} label="Market Physics" />
           <FeatureItem icon={<Globe size={20} />} label="Global Nodes" />
           <FeatureItem icon={<Zap size={20} />} label="Live Signals" />
           <FeatureItem icon={<Box size={20} />} label="3D Engine" />
        </div>

      </div>
    </div>
  );
};

// Helper Component for the bottom grid
const FeatureItem = ({ icon, label }: any) => (
  <div className="modern-feature">
    <div className="feature-icon">{icon}</div>
    <span className="feature-label">{label}</span>
  </div>
);
