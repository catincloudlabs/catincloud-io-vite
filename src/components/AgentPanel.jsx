import React from 'react';
import { Terminal, Cpu, TrendingUp } from 'lucide-react';

const AgentPanel = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="panel h-tall flex items-center justify-center text-center">
        <div className="opacity-50">
          <Cpu size={48} className="text-accent mb-4 mx-auto" />
          <div className="text-muted font-mono text-sm uppercase tracking-wider">
            Awaiting Target Lock...
          </div>
        </div>
      </div>
    );
  }

  // Sentiment Colors (using your CSS vars logic)
  const isBullish = selectedNode.sentiment > 0.15;
  const isBearish = selectedNode.sentiment < -0.15;
  const sentimentColor = isBullish ? 'text-green' : isBearish ? 'text-red' : 'text-accent';

  return (
    <div className="panel h-tall panel-flex-column" style={{ padding: 0 }}>
      
      {/* Header */}
      <div className="panel-header" style={{ padding: '16px', margin: 0, borderBottom: '1px solid var(--border)' }}>
        <div className="panel-header-identity">
           <span className="panel-title">AGENT DIAGNOSTIC</span>
           <span className="tag tag-blue">GPT-4o</span>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {/* Ticker Identity */}
        <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="brand-title" style={{ fontSize: '2.5rem' }}>{selectedNode.ticker}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="tag">{selectedNode.date}</span>
                    <span className="tag">VELOCITY: {selectedNode.velocity?.toFixed(2)}</span>
                </div>
            </div>
            
            {/* Metric Glass Component */}
            <div className="metric-glass">
                <span className="metric-label">SENTIMENT</span>
                <span className={`metric-value ${sentimentColor}`}>
                    {selectedNode.sentiment?.toFixed(2)}
                </span>
            </div>
        </div>

        {/* Narrative Section */}
        <div className="mb-6">
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-2">
                <Terminal size={12} className="text-accent" />
                <span>Headline Event</span>
            </div>
            <div className="p-4 rounded bg-[rgba(255,255,255,0.03)] border border-[var(--border)] font-mono text-sm leading-relaxed text-white">
                "{selectedNode.headline || "No significant headline detected."}"
            </div>
        </div>

        {/* Analysis Section */}
        <div>
            <div className="flex items-center gap-2 text-muted text-xs font-bold uppercase tracking-wider mb-2">
                <TrendingUp size={12} className="text-accent" />
                <span>Physics Analysis</span>
            </div>
            <p className="text-sm leading-7 text-muted border-left border-[var(--accent)] pl-3">
                <span className="text-accent font-bold">Observation:</span> The particle {selectedNode.ticker} is exhibiting 
                <strong className="text-white"> {selectedNode.velocity > 5 ? "high displacement" : "stable clustering"}</strong> relative 
                to the broader market galaxy. <br/><br/>
                Vector direction suggests a correlation with 
                <span className={sentimentColor}> {isBearish ? "Risk-Off / Fear" : "Growth / Optimism"} </span> 
                narratives driving institutional volume.
            </p>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--border)] flex gap-3 mt-auto">
        <button className="flex-1 bg-[var(--accent-dim)] hover:bg-[var(--accent)] text-black font-bold py-3 px-4 rounded text-xs transition-all uppercase tracking-wider">
            Deep Scan
        </button>
        <button className="flex-1 bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-accent font-bold py-3 px-4 rounded text-xs transition-all border border-[var(--border)] uppercase tracking-wider">
            Add to Watch
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
