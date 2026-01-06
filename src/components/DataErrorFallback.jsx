import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
const DataErrorFallback = ({ errorType, onRetry }) => {
  
  // Determine content based on error type
  const isNetwork = errorType === 'Network Error';
  const Icon = isNetwork ? WifiOff : AlertTriangle;
  const title = isNetwork ? 'Connection Lost' : 'Data Stream Failed';
  const message = isNetwork 
    ? 'Unable to reach the data pipeline. Check your connection.' 
    : 'The requested dataset is currently unavailable or malformed.';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 text-center text-slate-400">
      <div className="mb-4 p-4 rounded-full bg-slate-800/50 border border-slate-700/50">
        <Icon size={32} className="text-red-400" />
      </div>
      
      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">
        {title}
      </h3>
      
      <p className="text-xs max-w-[200px] leading-relaxed mb-6">
        {message}
      </p>

      <button 
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 text-xs font-mono font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded transition-all active:scale-95"
      >
        <RefreshCw size={12} />
        RETRY_CONNECTION
      </button>
    </div>
  );
};

export default DataErrorFallback;
