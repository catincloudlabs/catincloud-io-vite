import React from 'react';
// @ts-ignore
import { Activity, Cpu, Network, Terminal } from 'lucide-react';

export const SocialCardGenerator = () => {
  return (
    <div style={{
      width: '1200px', // Standard OpenGraph Width
      height: '630px', // Standard OpenGraph Height
      backgroundColor: '#020617',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '40px',
      fontFamily: "'JetBrains Mono', monospace",
      color: 'white',
      border: '1px solid #334155' // Optional frame for screenshotting
    }}>
      
      {/* 1. ABSTRACT BACKGROUND GRID (The "Data") */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0,
        opacity: 0.2,
        backgroundImage: `
          radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }} />

      {/* 2. GLOWING ORBS (The "Cluster") */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        zIndex: 1
      }} />

      {/* 3. TOP BAR */}
      <div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 10px #22c55e' }} />
          <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.05em' }}>CATINCLOUD.IO</span>
        </div>
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          color: '#22c55e', 
          padding: '8px 16px', 
          borderRadius: '4px', 
          fontSize: '0.9rem',
          fontWeight: 600 
        }}>
          SYSTEM_ONLINE_v2.4
        </div>
      </div>

      {/* 4. CENTRAL HEADLINE */}
      <div style={{ zIndex: 10, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <h1 style={{ 
          fontSize: '4rem', 
          margin: 0, 
          lineHeight: 1.1,
          background: 'linear-gradient(to bottom right, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.2))'
        }}>
          MARKET PHYSICS<br/>ENGINE
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#94a3b8', 
          maxWidth: '600px', 
          lineHeight: 1.6 
        }}>
          Real-time visualization of high-dimensional financial data using hybrid intelligence.
        </p>
      </div>

      {/* 5. BOTTOM METRICS / BADGES */}
      <div style={{ zIndex: 10, display: 'flex', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px' }}>
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
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{ color: '#64748b' }}>{icon}</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: 700 }}>{value}</span>
    </div>
  </div>
);
