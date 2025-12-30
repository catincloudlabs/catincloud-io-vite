// src/utils/statusHelpers.js

export const getHealthColor = (status) => {
  switch (status) {
    case 'Healthy': return 'text-green';
    case 'Degraded': return 'text-yellow'; 
    case 'Stale': return 'text-muted';
    default: return 'text-red';
  }
};

export const getSentimentColor = (isBullish) => isBullish ? 'text-green' : 'text-red';

export const getRiskColor = (isExtreme) => isExtreme ? 'text-purple' : 'text-yellow';

export const getMomentumColor = (isPositive) => isPositive ? 'text-green' : 'text-red';
