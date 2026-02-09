import React from 'react';

// Simple, dark-themed "Research Mode" screen
// No external dependencies, no API calls.
function App() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Optional: Keep your logo if you want, or just text */}
        <h1 style={styles.title}>CatInCloud.io</h1>
        
        <div style={styles.divider}></div>
        
        <h2 style={styles.status}>PROTOCOL SIMULATION IN PROGRESS</h2>
        
        <p style={styles.text}>
          The Market Physics Engine has been taken offline for a major architectural upgrade.
        </p>
        
        <p style={styles.text}>
          We are currently running <strong>Protocol #1 (Thermodynamics of Market Fragility)</strong>. 
          Live visualization will return upon publication of the results.
        </p>

        <div style={styles.footer}>
          <p style={styles.mono}>Status: PRE-REGISTRATION FREEZE</p>
          <p style={styles.mono}>Est. Return: Q4 2026</p>
        </div>
      </div>
    </div>
  );
}

// Minimal inline styles to ensure it looks good without 'index.css'
const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0a0a0a', // Deep dark background
    color: '#e5e5e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  content: {
    maxWidth: '600px',
    padding: '40px',
    textAlign: 'center',
    border: '1px solid #333',
    borderRadius: '8px',
    backgroundColor: '#111',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: '20px',
    color: '#fff',
  },
  divider: {
    height: '1px',
    width: '100px',
    backgroundColor: '#333',
    margin: '0 auto 30px auto',
  },
  status: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#FFD700', // Gold color for "Research Mode"
    marginBottom: '20px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
  text: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#a1a1a1',
    marginBottom: '20px',
  },
  footer: {
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #222',
  },
  mono: {
    fontFamily: '"SF Mono", "Fira Code", Consolas, monospace',
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  }
};

export default App;
