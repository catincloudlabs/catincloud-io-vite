import React from 'react';

const MetricCard = ({ title, value, subValue, icon, statusColor }) => {
  return (
    <div className="panel span-1">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        {/* If an icon component is passed, render it inside a tag container */}
        {icon && <span className="tag" style={{background: 'transparent', padding: 0}}>{icon}</span>}
      </div>
      
      {/* If statusColor is passed (e.g. 'green'), show the glowing dot */}
      {statusColor && (
         <div 
           className="status-dot" 
           style={{
             position: 'absolute', 
             top: '24px', 
             right: '50px', 
             background: `var(--${statusColor})`, 
             boxShadow: `0 0 8px var(--${statusColor})`
           }}
         ></div>
      )}

      <div className="metric-big">{value}</div>
      <div className="metric-sub">{subValue}</div>
    </div>
  );
};

export default MetricCard;
