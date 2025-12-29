import React from 'react';
import { useSystemHeartbeat } from '../hooks/useSystemHeartbeat';

export const SystemStatusRibbon: React.FC = () => {
  const { data, loading, error } = useSystemHeartbeat();

  if (loading) return null;
  if (error) return null;
  if (!data) return null;

  // Status Indicator Logic
  const isHealthy = data.system_status === 'Healthy';
  const statusClass = isHealthy ? 'status-healthy' : 'status-warning';

  // Formatters
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);
  
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric', 
      timeZoneName: 'short' 
    });
  };

  return (
    <div className={`status-ribbon-container ${statusClass}`}>
      <div className="status-section-left">
        {/* Pulsing Dot */}
        <div className="status-indicator-wrapper">
          <span className="status-dot-static" />
          <span className="status-dot-ping" />
        </div>
        
        <span className="status-text-main">
          SYSTEM {data.system_status.toUpperCase()}
        </span>

        <span className="status-separator mobile-hide">|</span>

        <span className="status-metric-text mobile-hide">
          PIPELINE: <span className="status-value">{data.pipeline_version}</span>
        </span>
      </div>

      <div className="status-section-right mobile-hide">
        <span className="status-metric-text">
          DATA POINTS: <span className="status-value">{formatNumber(data.metrics.total_rows_managed)}</span>
        </span>
        
        <span className="status-separator">|</span>

        <span className="status-metric-text">
          UPDATED: <span className="status-value">{formatTime(data.last_updated_utc)}</span>
        </span>
      </div>
    </div>
  );
};
