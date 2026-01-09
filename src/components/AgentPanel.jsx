import React from 'react';
import { Terminal, Cpu, TrendingUp, Radio } from 'lucide-react';

const AgentPanel = ({ selectedNode }) => {
  // Empty State
  if (!selectedNode) {
    return (
      <div className="panel ai-hero-card h-full flex flex-col items-center justify-center text-center p-6">
        <div className="p-4 rounded-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)] mb-4">
           <Radio size={32} className="text-muted opacity-50" />
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
      <div className="panel-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="panel-header-identity">
           <span className="panel-title">AGENT.LOG</span>
           <span className="tag tag-blue">GPT-4o</span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Identity */}
        <div className="flex justify-between items-start pb-6 border-b border-[var(--border)]">
            <div>
                <h1 className="brand-title" style={{ fontSize: '2rem', lineHeight: 1 }}>
                    {selectedNode.ticker}
                </h1>
                <div className="flex gap-2 mt-3">
                    <span className="text-xs font-mono text-muted border border-[var(--border)] px-2 py-1 rounded bg-[var(--bg-app)]">
                        {selectedNode.date}
                    </span>
                </div>
            </div>
            
            {/* Metric Glass from styles.css */}
            <div className="metric-glass">
                <span className="metric-label">SENTIMENT</span>
                <span className={`metric-value ${sentimentColor}`}>
                    {selectedNode.sentiment > 0 ? '+' : ''}{selectedNode.sentiment?.toFixed(2)}
                </span>
            </div>
        </div>

        {/* Narrative */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <Terminal size={14} className="text-accent" />
                <span>Headline Event</span>
            </div>
            <div className="p-4 rounded bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
                <p className="font-mono text-sm leading-relaxed text-slate-300">
                    "{selectedNode.headline || "No significant headline event detected."}"
                </p>
            </div>
        </div>

        {/* Physics Analysis */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <TrendingUp size={14} className="text-accent" />
                <span>Physics Analysis</span>
            </div>
            <div className="pl-4 border-l-2 border-[var(--accent)]">
                <p className="text-sm leading-7 text-slate-400">
                    The particle <strong className="text-white">{selectedNode.ticker}</strong> is exhibiting 
                    <span className="text-accent"> {selectedNode.velocity > 5 ? " high displacement " : " stable clustering "}</span> 
                    relative to the market centroid. <br/>
                    
                    Vector positioning indicates a strong correlation with 
                    <span className={sentimentColor}> {isBearish ? " negative " : " positive "} </span> 
                    narratives today.
                </p>
            </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[var(--border)] bg-[rgba(15,23,42,0.3)]">
        <button className="w-full bg-[var(--accent-dim)] hover:bg-[var(--accent)] text-white font-bold py-3 px-4 rounded text-xs uppercase tracking-wider transition-all shadow-lg">
            Run Deep Analysis
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
