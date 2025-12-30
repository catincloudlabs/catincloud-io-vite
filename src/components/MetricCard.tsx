import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  statusColor?: 'green' | 'red' | 'yellow' | 'gray';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subValue, icon, statusColor }) => {
  return (
    <div className="panel span-1">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        {icon && <span className="panel-icon-wrapper">{icon}</span>}
      </div>
      
      {statusColor && (
         <div className={`metric-status-dot status-${statusColor}`}></div>
      )}

      <div className="metric-big">{value}</div>
      {subValue && <div className="metric-sub">{subValue}</div>}
    </div>
  );
};

export default MetricCard;
