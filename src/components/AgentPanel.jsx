import React from 'react';
import { Terminal, Cpu, TrendingUp } from 'lucide-react';

const AgentPanel = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="panel ai-hero-card h-full flex items-center justify-center text-center min-h-[300px]">
        <div className="opacity-50">
          <Cpu size={48} className="text-[#e879f9] mb-4 mx-auto" />
          <div className="text-muted font-mono text-sm uppercase tracking-wider">
            Awaiting Target Lock...
          </div>
        </div>
      </div>
    );
  }

  const isBullish = selectedNode.sentiment > 0.15;
  const isBearish = selectedNode.sentiment < -0.15;
  const sentimentColor = isBullish ? 'text-green' : isBearish ? 'text-red' : 'text-accent';
  
  return (
    <div className="panel ai-hero-card h-full flex flex-col p-0">
      
      {/* Header */}
      <div className="panel-header" style={{ padding: '16px', margin: 0, borderBottom: '1px solid rgba(192, 132, 252, 0.2)' }}>
        <div className="panel-header-identity">
           <span className="panel-title">AGENT DIAGNOSTIC</span>
           <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(192,132,252,0.15)] text-[#e879f9] border border-[rgba(192,132,252,0.3)]">
             GPT-4o
           </span>
        </div>
      </div>

      {/* Body: 'flex-1' allows it to fill available space on Desktop, 'min-h' ensures readability on Mobile */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        
        <div className="flex justify-between items-start">
            <div>
                <h1 className="brand-title" style={{ fontSize: '2rem' }}>{selectedNode.ticker}</h1>
                <div className="flex gap-2 mt-2">
                    <span className="tag">{selectedNode.date}</span>
                    <span className="tag">VEL: {selectedNode.velocity?.toFixed(2)}</span>
                </div>
            </div>
            
            <div className="metric-glass" style={{ borderColor: 'rgba(192, 132, 252, 0.3)' }}>
                <span className="metric-label" style={{ color: '#d8b4fe' }}>SENTIMENT</span>
                <span className={`metric-value ${sentimentColor}`}>
                    {selectedNode.sentiment?.toFixed(2)}
                </span>
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#e879f9] text-xs font-bold uppercase tracking-wider">
                <Terminal size={12} />
                <span>Headline Event</span>
            </div>
            <div className="p-4 rounded bg-[rgba(255,255,255,0.03)] border border-[rgba(192,132,252,0.2)] font-mono text-sm leading-relaxed text-main">
                "{selectedNode.headline || "No significant headline detected."}"
            </div>
        </div>

        <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#e879f9] text-xs font-bold uppercase tracking-wider">
                <TrendingUp size={12} />
                <span>Physics Analysis</span>
            </div>
            <p className="text-sm leading-7 text-muted border-l-2 border-[var(--accent)] pl-3">
                <span className="text-[#e879f9] font-bold">Observation:</span> The particle {selectedNode.ticker} is exhibiting 
                <strong className="text-main"> {selectedNode.velocity > 5 ? "high displacement" : "stable clustering"}</strong> relative 
                to the broader market galaxy. <br/><br/>
                Vector direction suggests a correlation with 
                <span className={sentimentColor}> {isBearish ? "Risk-Off / Fear" : "Growth / Optimism"} </span> 
                narratives driving institutional volume.
            </p>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[rgba(192,132,252,0.2)] flex gap-3 mt-auto">
        <button className="flex-1 bg-[#e879f9] hover:bg-[#c084fc] text-[#0f172a] font-bold py-3 px-4 rounded-md text-xs transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(232,121,249,0.3)]">
            Deep Scan
        </button>
        <button className="flex-1 bg-transparent hover:bg-[rgba(192,132,252,0.1)] text-[#e879f9] font-bold py-3 px-4 rounded-md text-xs transition-all border border-[rgba(192,132,252,0.4)] uppercase tracking-wider">
            Watch
        </button>
      </div>
    </div>
  );
};

export default AgentPanel;
