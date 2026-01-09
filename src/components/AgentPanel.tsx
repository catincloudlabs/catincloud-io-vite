import { useState, useEffect, useRef } from 'react';
import { MarketFrame } from '../App';
// @ts-ignore
import { Network, User, Minus, Plus } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  history?: MarketFrame[];
  selectedTicker: string | null;
  onOpenArch: () => void;
  onOpenBio: () => void;
}

export function AgentPanel({ currentFrame, history, selectedTicker, onOpenArch, onOpenBio }: AgentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const [messages, setMessages] = useState<Array<{type: 'agent' | 'user', text: string}>>([
    { 
      type: 'agent', 
      text: `SYSTEM ONLINE v2.4.0
-----------------------
> "Physics": Explains motion model.
> "Legend": Decodes signals.
> "Strategy": Tactical guide.` 
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const suggestions = ["PHYSICS", "LEGEND", "STRATEGY"];

  useEffect(() => {
    if (isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  const generateResponse = (query: string) => {
    const q = query.toUpperCase();

    if (q.includes("PHYSICS")) {
      return `PHYSICS ENGINE DOCS:
• ENERGY (Size): Volume/Liquidity.
• VELOCITY (Speed): Price Momentum.
• POSITION (X/Y): Sector correlation.`;
    }

    if (q.includes("LEGEND")) {
      return `VISUAL DECODER:
🟢 GREEN: Positive Sentiment
🔴 RED: Negative Sentiment
🟡 GOLD: Knowledge Graph Link`;
    }

    if (q.includes("STRATEGY")) {
      return `TACTICAL GUIDE:
1. MOMENTUM: Watch high velocity nodes.
2. CATALYSTS: High Energy pulls mass.
3. DIVERGENCE: Watch cluster breakouts.`;
    }

    if (!currentFrame) return "System initializing...";

    const words = q.split(' ');
    const foundTicker = words.find(word => 
      currentFrame.nodes.some(n => n.ticker === word || n.ticker === word.replace('$', ''))
    );

    if (foundTicker) {
      const ticker = foundTicker.replace('$', '');
      const node = currentFrame.nodes.find(n => n.ticker === ticker);
      
      if (!node) return `ERR: Data for ${ticker} incomplete.`;

      let trend = "STABLE";
      if (history && history.length > 5) {
        const pastFrame = history[Math.max(0, history.indexOf(currentFrame) - 5)];
        const pastNode = pastFrame?.nodes.find(n => n.ticker === ticker);
        if (pastNode) {
            const energyDelta = node.energy - pastNode.energy;
            if (energyDelta > 5) trend = "ACCELERATING";
            else if (energyDelta < -5) trend = "DECELERATING";
        }
      }

      const velocity = Math.sqrt(node.vx**2 + node.vy**2).toFixed(1);
      const sentiment = node.sentiment > 0.1 ? "POS" : node.sentiment < -0.1 ? "NEG" : "NEU";
      
      return `Target: ${ticker}
Status: ${sentiment} (${node.sentiment.toFixed(2)})
Trend:  ${trend}
Energy: ${node.energy.toFixed(0)}
Vel:    ${velocity}

"${node.headline}"`;
    }

    if (q.includes('MARKET') || q.includes('TREND') || q.includes('SCAN')) {
       const avgEnergy = currentFrame.nodes.reduce((a,b) => a + b.energy, 0) / currentFrame.nodes.length;
       return `SCAN: ${currentFrame.date}
Energy: ${avgEnergy.toFixed(1)} / 100
Nodes:  ${currentFrame.nodes.length}

Market Phase: ${avgEnergy > 25 ? "HIGH VOLATILITY" : "CONSOLIDATION"}`;
    }

    return "Unknown command. Try 'PHYSICS', 'LEGEND', or input a ticker symbol.";
  };

  useEffect(() => {
    if (!selectedTicker) return;
    const response = generateResponse(selectedTicker);
    setMessages(prev => [...prev, { type: 'agent', text: response }]);
    setIsExpanded(true);
  }, [selectedTicker]); 

  const handleCommand = (cmd: string) => {
      setMessages(prev => [...prev, { type: 'user', text: cmd }]);
      setTimeout(() => {
         const response = generateResponse(cmd);
         setMessages(prev => [...prev, { type: 'agent', text: response }]);
      }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
       handleCommand(inputValue);
       setInputValue("");
    }
  };

  if (!currentFrame) return null;

  return (
    <div 
      className="agent-terminal"
      style={{ 
        // UPDATED: Fixed height when expanded to fill the available space
        height: isExpanded ? 'calc(100vh - 100px)' : 'auto' 
      }}
    >
      
      {/* HEADER */}
      <div className="terminal-header">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
        >
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: '#22c55e', boxShadow: '0 0 8px #22c55e'
          }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', color: '#94a3b8' }}>
            INTELLIGENCE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
                onClick={onOpenArch}
                title="System Architecture"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
                <Network size={14} />
            </button>
            
            <button 
                onClick={onOpenBio}
                title="User Bio"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, marginRight: '8px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
            >
                <User size={14} />
            </button>

            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>

            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
            >
                {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
            </button>
        </div>
      </div>

      {/* LOG AREA */}
      {isExpanded && (
        <>
          <div style={{ 
            flex: 1, 
            padding: '16px', 
            overflowY: 'auto', 
            display: 'flex', flexDirection: 'column', gap: '8px'
            // UPDATED: Removed minHeight to rely on flex filling the fixed parent height
          }}>
            {messages.map((msg, i) => {
              const isUser = msg.type === 'user';
              return (
                <div key={i} style={{ 
                  alignSelf: 'flex-start', width: '100%', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                  marginTop: isUser ? '16px' : '0px',
                  color: isUser ? '#22c55e' : '#e2e8f0',
                  backgroundColor: isUser ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                  padding: isUser ? '0 4px' : '10px 12px',
                  borderRadius: isUser ? '0' : '6px',
                  borderLeft: isUser ? 'none' : '2px solid #3b82f6',
                  fontSize: '0.8rem'
                }}>
                  {isUser ? `➜ ${msg.text}` : msg.text}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* SUGGESTIONS */}
          <div style={{ 
            padding: '8px 12px', 
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', gap: '8px', flexWrap: 'wrap',
            flexShrink: 0
          }}>
            {suggestions.map(s => (
                <button 
                  key={s}
                  onClick={() => handleCommand(s)}
                  style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      color: '#94a3b8', fontSize: '0.65rem', padding: '4px 8px', cursor: 'pointer',
                      fontFamily: 'var(--font-mono)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22c55e'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                    {s}
                </button>
            ))}
          </div>

          {/* INPUT */}
          <div className="terminal-input-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22c55e' }}>$</span>
              <input 
                type="text" 
                className="terminal-input"
                placeholder="Query system..." 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
