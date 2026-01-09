import React from 'react';
import { Terminal, Cpu, TrendingUp, Radio } from 'lucide-react';

const AgentPanel = ({ selectedNode }) => {
  // Empty State
  if (!selectedNode) {
    return (
      <div className="panel ai-hero-card h-full flex flex-col items-center justify-center text-center p-6">
        <div className="p-4 rounded-full bg-[rgba(232,121,249,0.05)] border border-[rgba(232,121,249,0.2)] mb-4">
           <Radio size={32} className="text-[#e879f9] opacity-70 animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-1">
          Awaiting Signal
        </h3>
        <p className="text-xs text-slate-500 font-mono">
          Select a particle to engage AI agent.
        </p>
      </div>
    );
  }

  // Sentiment Logic
  const isBullish = selectedNode.sentiment > 0.15;
  const isBearish = selectedNode.sentiment < -0.15;
  const sentimentColor = isBullish ? 'text-green' : isBearish ? 'text-red' : 'text-accent';

  return (
    <div className="panel ai-hero-card h-full flex flex-col p-0 overflow-hidden">
      
      {/* Header */}
      <div className="panel-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid rgba(192, 132, 252, 0.2)' }}>
        <div className="panel-header-identity">
           <span className="panel-title">AGENT.LOG</span>
           <span className="tag" style={{ color: '#e879f9', background: 'rgba(192,132,252,0.1)', borderColor: 'rgba(192,132,252,0.3)' }}>GPT-4o</span>
        </div>
        <div className="panel-header-controls">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#e879f9]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e879f9] animate-pulse"></span>
                ONLINE
            </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Identity */}
        <div className="flex justify-between items-start pb-6 border-b border-[var(--border)]">
            <div>
                <h1 className="brand-title" style={{ fontSize: '2.5rem', lineHeight: '1' }}>
                    {selectedNode.ticker}
                </h1>
                <div className="flex gap-2 mt-3">
                    <span className="tag">{selectedNode.date}</span>
                    <span className="tag">VEL: {selectedNode.velocity?.toFixed(2)}</span>
                </div>
            </div>
            
            {/* Metric Glass */}
            <div className="metric-glass" style={{ borderColor: 'rgba(51, 65, 85, 0.5)' }}>
                <span className="metric-label">SENTIMENT</span>
                <span className={`metric-value ${sentimentColor}`}>
                    {selectedNode.sentiment > 0 ? '+' : ''}{selectedNode.sentiment?.toFixed(2)}
                </span>
            </div>
        </div>

        {/* Narrative */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <Terminal size={14} className="text-[#e879f9]" />
                <span>Headline Event</span>
            </div>
            <div className="p-4 rounded bg-[rgba(15,23,42,0.6)] border border-[var(--border)] shadow-inner">
                <p className="font-mono text-sm leading-relaxed text-slate-300">
                    "{selectedNode.headline || "No significant headline event detected."}"
                </p>
            </div>
        </div>

        {/* Analysis */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <TrendingUp size={14} className="text-[#e879f9]" />
                <span>Physics Analysis</span>
            </div>
            <div className="pl-4 border-l-2 border-[#e879f9]">
                <p className="text-sm leading-7 text-slate-400">
                    The particle <strong className="text-white">{selectedNode.ticker}</strong> is exhibiting 
                    <span className="text-[#e879f9]"> {selectedNode.velocity > 5 ? " high displacement " : " stable clustering "}</span> 
                    relative to the market centroid. <br/>
                    
                    Vector positioning indicates a strong correlation with 
                    <span className={sentimentColor}> {isBearish ? " negative " : " positive "} </span> 
                    narratives today.
                </p>
            </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[rgba(192,132,252,0.2)] bg-[rgba(15,23,42,0.4)]">
        <button className="w-full bg-[#e879f9] hover:bg-[#d946ef] text-[#0f172a] font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(232,121,249,0.25)]">
            Run Deep Analysis
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
