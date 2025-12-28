import React from 'react';
import { useSystemHeartbeat } from '../hooks/useSystemHeartbeat';

export const SystemStatusRibbon: React.FC = () => {
  const { data, loading, error } = useSystemHeartbeat();

  if (loading) return null; // Or a subtle loading spinner
  if (error) return null;   // Fail gracefully (don't show a broken bar)
  if (!data) return null;

  // Status Indicator Logic
  const isHealthy = data.system_status === 'Healthy';
  const statusColor = isHealthy ? '#10B981' : '#F59E0B'; // Green vs Amber

  // Formatter for numbers (e.g., 2,400)
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

  // Formatter for time (e.g., "Today at 14:30 UTC")
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric', 
      timeZoneName: 'short' 
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        {/* Pulsing Dot */}
        <div style={styles.indicatorWrapper}>
          <span style={{ ...styles.dot, backgroundColor: statusColor }} />
          <span style={{ ...styles.ping, backgroundColor: statusColor }} />
        </div>
        
        <span style={styles.statusText}>
          SYSTEM {data.system_status.toUpperCase()}
        </span>

        <span style={styles.separator}>|</span>

        <span style={styles.metricText}>
          PIPELINE: <span style={styles.value}>{data.pipeline_version}</span>
        </span>
      </div>

      <div style={styles.rightSection}>
        <span style={styles.metricText}>
          DATA POINTS MANAGED: <span style={styles.value}>{formatNumber(data.metrics.total_rows_managed)}</span>
        </span>
        
        <span style={styles.separator}>|</span>

        <span style={styles.metricText}>
          UPDATED: <span style={styles.value}>{formatTime(data.last_updated_utc)}</span>
        </span>
      </div>
    </div>
  );
};

// Simple "Dark Mode" Tech Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '32px',
    backgroundColor: '#0f172a', // Slate-900
    borderBottom: '1px solid #1e293b', // Slate-800
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    fontSize: '11px',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace', // Monospace sells "Engineering"
    color: '#94a3b8', // Slate-400
    boxSizing: 'border-box',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  leftSection: { display: 'flex', alignItems: 'center', gap: '8px' },
  rightSection: { display: 'flex', alignItems: 'center', gap: '8px' },
  separator: { color: '#334155', margin: '0 8px' },
  statusText: { fontWeight: 700, color: '#e2e8f0' },
  metricText: { letterSpacing: '0.05em' },
  value: { color: '#e2e8f0', fontWeight: 600 },
  
  // The "Live" Dot Animation
  indicatorWrapper: { position: 'relative', width: '8px', height: '8px', marginRight: '6px' },
  dot: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
  },
  ping: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
    animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
    opacity: 0.75,
  }
};
