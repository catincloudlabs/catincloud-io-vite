import React from 'react';
import { Terminal, Cpu, TrendingUp, Radio } from 'lucide-react';

const AgentPanel = ({ selectedNode }) => {
  // Empty State - "System Idle" Look
  if (!selectedNode) {
    return (
      <div className="panel h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
        <div className="p-4 rounded-full bg-[rgba(255,255,255,0.02)] border border-[var(--border)]">
           <Radio size={32} className="text-muted animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-1">System Standby</h3>
          <p className="text-xs text-slate-500 font-mono">Select a node from the Galaxy Map<br/>to initiate Agent Analysis.</p>
        </div>
      </div>
    );
  }

  // Sentiment Color Logic
  const isBullish = selectedNode.sentiment > 0.15;
  const isBearish = selectedNode.sentiment < -0.15;
  const sentimentColor = isBullish ? 'text-green' : isBearish ? 'text-red' : 'text-accent';

  return (
    <div className="panel h-full flex flex-col p-0 overflow-hidden">
      
      {/* 1. Standard Header */}
      <div className="panel-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="panel-header-identity">
           <span className="panel-title">AGENT.LOG</span>
           <span className="tag tag-blue">GPT-4o</span>
        </div>
        <div className="panel-header-controls">
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                ONLINE
            </div>
        </div>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        {/* Ticker Identity Block */}
        <div className="flex justify-between items-start pb-6 border-b border-[var(--border)]">
            <div>
                <h1 className="brand-title" style={{ fontSize: '2.5rem', lineHeight: '1' }}>
                    {selectedNode.ticker}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs font-mono text-muted bg-[var(--bg-app)] px-2 py-1 rounded border border-[var(--border)]">
                        {selectedNode.date}
                    </span>
                    <span className="text-xs font-mono text-accent">
                        VEL: {selectedNode.velocity?.toFixed(2)}
                    </span>
                </div>
            </div>
            
            {/* Metric Glass: Sentiment */}
            <div className="metric-glass">
                <span className="metric-label">SENTIMENT</span>
                <span className={`metric-value ${sentimentColor}`}>
                    {selectedNode.sentiment > 0 ? '+' : ''}{selectedNode.sentiment?.toFixed(2)}
                </span>
            </div>
        </div>

        {/* Narrative / RAG Section */}
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider">
                <Terminal size={14} className="text-accent" />
                <span>Headline Event</span>
            </div>
            <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border)]">
                <p className="font-mono text-sm leading-relaxed text-slate-200">
                    "{selectedNode.headline || "No significant headline event detected in the vector database."}"
                </p>
            </div>
        </div>

        {/* Physics Analysis Section */}
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
                    <span className={sentimentColor}> {isBearish ? " negative/fear " : " positive/growth "} </span> 
                    narratives today.
                </p>
            </div>
        </div>

      </div>

      {/* 3. Action Footer */}
      <div className="p-4 border-t border-[var(--border)] bg-[rgba(15,23,42,0.3)]">
        <button className="w-full flex items-center justify-center gap-2 bg-[var(--accent-dim)] hover:bg-[var(--accent)] text-white font-bold py-3 px-4 rounded text-xs transition-all uppercase tracking-wider shadow-lg hover:shadow-cyan-500/20">
            <Cpu size={14} />
            Run Deep Analysis
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
