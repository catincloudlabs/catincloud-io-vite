import React from 'react';

const AgentPanel = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="panel h-full flex items-center justify-center text-center p-8">
        <div>
          <div className="text-4xl mb-4">🤖</div>
          <div className="text-muted font-mono text-sm">
            SELECT A PARTICLE TO INITIATE ANALYSIS
          </div>
        </div>
      </div>
    );
  }

  // Determine sentiment color
  const sentimentColor = selectedNode.sentiment > 0.1 ? 'text-green-400' 
                       : selectedNode.sentiment < -0.1 ? 'text-red-400' 
                       : 'text-blue-300';

  return (
    <div className="panel h-full flex flex-col">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-identity">
           <span className="panel-title">AGENT DIAGNOSTIC</span>
           <span className="tag tag-blue">GPT-4o</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        
        {/* Ticker Header */}
        <div className="flex justify-between items-end mb-6 border-b border-[var(--border)] pb-4">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">{selectedNode.ticker}</h1>
                <span className="text-xs text-muted font-mono">
                    {selectedNode.date} • VELOCITY: {selectedNode.velocity?.toFixed(2)}
                </span>
            </div>
            <div className={`text-xl font-mono font-bold ${sentimentColor}`}>
                {selectedNode.sentiment > 0 ? '+' : ''}{selectedNode.sentiment}
            </div>
        </div>

        {/* Narrative / "RAG" Output */}
        <div className="space-y-4">
            <div className="bg-[rgba(255,255,255,0.03)] p-4 rounded border border-[var(--border)]">
                <span className="text-[10px] text-accent font-bold tracking-wider uppercase mb-2 block">
                    // HEADLINE EVENT
                </span>
                <p className="text-sm leading-relaxed text-gray-300 font-mono">
                    "{selectedNode.headline || "No significant headline detected."}"
                </p>
            </div>

            <div className="p-2">
                <span className="text-[10px] text-muted font-bold tracking-wider uppercase mb-2 block">
                    // AGENT ANALYSIS
                </span>
                <p className="text-sm leading-7 text-gray-400">
                    <span className="text-accent">Observation:</span> {selectedNode.ticker} is exhibiting 
                    <strong> {selectedNode.velocity > 3 ? "high displacement" : "stable behavior"}</strong> relative 
                    to the broader market cluster. <br/><br/>
                    The semantic position suggests a correlation with 
                    <span className="text-white"> {selectedNode.sentiment < 0 ? "Risk-Off / Fear" : "Growth / Optimism"} </span> 
                    narratives.
                </p>
            </div>
        </div>

      </div>

      {/* Action Footer */}
      <div className="mt-auto pt-4 border-t border-[var(--border)] flex gap-2">
        <button className="flex-1 bg-[var(--accent-dim)] hover:bg-[var(--accent)] text-black font-bold py-2 px-4 rounded text-xs transition-colors">
            RUN DEEP SCAN
        </button>
        <button className="flex-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold py-2 px-4 rounded text-xs transition-colors border border-[var(--border)]">
            ADD TO WATCH
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
