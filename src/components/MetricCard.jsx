import React from 'react';

const MetricCard = ({ title, value, subValue, icon, statusColor }) => {
  return (
    <div className="panel span-1">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        {/* Clean class for icon wrapper */}
        {icon && <span className="panel-icon-wrapper">{icon}</span>}
      </div>
      
      {/* Dynamic Status Dot */}
      {statusColor && (
         <div className={`metric-status-dot status-${statusColor}`}></div>
      )}

      <div className="metric-big">{value}</div>
      <div className="metric-sub">{subValue}</div>
    </div>
  );
};

export default MetricCard;
