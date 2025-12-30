import React from 'react';
import { useSystemHeartbeat } from '../hooks/useSystemHeartbeat';

export const SystemStatusRibbon: React.FC = () => {
  const { data, loading, error } = useSystemHeartbeat();

  if (loading) return null; // Or return a skeleton loader
  if (error) return null;
  if (!data) return null;

  // Status Indicator Logic
  let statusClass = 'status-warning';
  let statusText = data.system_status.toUpperCase();

  switch (data.system_status) {
    case 'Healthy':
      statusClass = 'status-healthy';
      break;
    case 'Degraded':
      statusClass = 'status-degraded'; // Ensure you have CSS for this (e.g., Orange)
      break;
    case 'Stale':
      statusClass = 'status-stale';    // Ensure you have CSS for this (e.g., Grey/Red)
      break;
  }

  // Formatters
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    // Returns local time (e.g. "2:30 PM")
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`status-ribbon-container ${statusClass}`}>
      <div className="status-section-left">
        {/* Pulsing Dot - Only pulse if Healthy */}
        <div className="status-indicator-wrapper">
          <span className="status-dot-static" />
          {data.system_status === 'Healthy' && <span className="status-dot-ping" />}
        </div>
        
        <span className="status-text-main">
          SYSTEM {statusText}
        </span>

        <span className="status-separator mobile-hide">|</span>

        <span className="status-metric-text mobile-hide">
          PIPELINE: <span className="status-value">{data.pipeline_version}</span>
        </span>
      </div>

      <div className="status-section-right">
        <span className="status-metric-text mobile-hide">
          DATA POINTS: <span className="status-value">{formatNumber(data.metrics.total_rows_managed)}</span>
        </span>
        
        <span className="status-separator mobile-hide">|</span>

        <span className="status-metric-text" title={`UTC: ${data.last_updated_utc}`}>
          UPDATED: <span className="status-value">{formatTime(data.last_updated_utc)}</span>
        </span>
      </div>
    </div>
  );
};
