import React from 'react';

// "Research Mode" Screen
// Now fully integrated with the 'index.css' design tokens.
function App() {
  return (
    <div style={styles.container}>
      {/* Background Gradient Effect matching the social card style */}
      <div style={styles.backgroundGradient}></div>

      <div style={styles.content}>
        {/* Header */}
        <h1 style={styles.title}>CatInCloud.io</h1>
        
        <div style={styles.divider}></div>
        
        {/* Status Indicator: Uses --accent-ai (Amber) for the "Alert" feel */}
        <h2 style={styles.status}>Protocol Simulation In Progress</h2>
        
        {/* Main Context */}
        <p style={styles.text}>
          The Market Physics Engine has been taken offline for a major architectural upgrade.
        </p>
        
        <p style={styles.text}>
          We are currently running <strong style={styles.strong}>Protocol #1 (Thermodynamics of Market Fragility)</strong>. 
          Live visualization will return upon publication of the results.
        </p>

        {/* New External Link: Uses --accent-green (Mint) for the call to action */}
        <div style={styles.linkContainer}>
          <p style={styles.smallText}>For more details on Product R&D and the Protocol:</p>
          <a 
            href="https://catincloudlabs.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.link}
          >
            Visit catincloudlabs.com &rarr;
          </a>
        </div>

        {/* Footer Meta */}
        <div style={styles.footer}>
          <p style={styles.mono}>Status: PRE-REGISTRATION FREEZE</p>
          <p style={styles.mono}>Est. Return: Q4 2026</p>
        </div>
      </div>
    </div>
  );
}

// Styles now point to CSS Variables defined in your index.css
const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--background)', // #0f172a
    color: 'var(--text-primary)',         // #f8fafc
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundGradient: {
    position: 'absolute',
    top: '-50%',
    right: '-20%',
    width: '1000px',
    height: '1000px',
    background: 'radial-gradient(circle, rgba(52, 211, 153, 0.03) 0%, transparent 60%)', // Subtle Mint glow
    pointerEvents: 'none',
    zIndex: 0,
  },
  content: {
    maxWidth: '600px',
    width: '90%',
    padding: '40px',
    textAlign: 'center',
    border: '1px solid var(--glass-border)',
    borderRadius: '12px',
    // Using the glass background from your variables
    background: 'rgba(30, 41, 59, 0.5)', 
    backdropFilter: 'blur(12px)',
    boxShadow: 'var(--shadow-soft)',
    zIndex: 10,
    position: 'relative',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    marginBottom: '24px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-mono)', // Tech feel
  },
  divider: {
    height: '1px',
    width: '80px',
    backgroundColor: 'var(--glass-border)',
    margin: '0 auto 30px auto',
  },
  status: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: 'var(--accent-ai)', // Amber #fbbf24
    marginBottom: '24px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  text: {
    fontSize: '1rem',
    lineHeight: '1.6',
    color: 'var(--text-muted)', // #94a3b8
    marginBottom: '20px',
  },
  strong: {
    color: 'var(--text-primary)',
    fontWeight: 600,
  },
  linkContainer: {
    marginTop: '32px',
    padding: '24px',
    backgroundColor: 'rgba(52, 211, 153, 0.03)', // Very faint mint bg
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
  },
  smallText: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '12px',
    marginTop: 0,
    fontFamily: 'var(--font-mono)',
  },
  link: {
    color: 'var(--accent-green)', // Mint #34d399
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    borderBottom: '1px solid rgba(52, 211, 153, 0.3)',
    transition: 'opacity 0.2s',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid var(--glass-border)',
  },
  mono: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    opacity: 0.7,
    marginBottom: '6px',
    letterSpacing: '0.05em',
  }
};

export default App;
