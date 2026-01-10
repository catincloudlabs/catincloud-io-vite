import { useState, useEffect, useRef } from 'react';
import { MarketFrame } from '../App';
import { GraphConnection } from '../hooks/useKnowledgeGraph';
// @ts-ignore
import { Network, User, Minus, Plus, Loader2 } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  history?: MarketFrame[];
  selectedTicker: string | null;
  graphConnections?: GraphConnection[];
  isLoading?: boolean;
  onOpenArch: () => void;
  onOpenBio: () => void;
}

export function AgentPanel({ currentFrame, history, selectedTicker, graphConnections, isLoading, onOpenArch, onOpenBio }: AgentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > 768;
  });
  
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
  const lastTickerRef = useRef<string | null>(null); 

  const suggestions = ["PHYSICS", "LEGEND", "STRATEGY"];

  useEffect(() => {
    if (isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // --- REPORT GENERATOR ---
  const generateResponse = (ticker: string) => {
    if (!currentFrame) return "System initializing...";

    const node = currentFrame.nodes.find(n => n.ticker === ticker);
    if (!node) return `ERR: No physics data for ${ticker}.`;

    // 1. Physics Data
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
    
    // 2. Intelligence Data
    let intelligenceReport = "";
    if (graphConnections && graphConnections.length > 0) {
      const peers = graphConnections.slice(0, 3).map(c => c.target).join(', ');
      const topArticle = graphConnections[0]?.articles[0];
      const narrative = topArticle ? `"${topArticle}"` : "Sector Correlation";

      intelligenceReport = `
🧠 NETWORK INTEL:
• Cluster: [${peers}]
• Driver: ${narrative}`;
    } else {
      intelligenceReport = `
🧠 NETWORK INTEL:
• No major signal detected.
• Idiosyncratic movement.`;
    }

    // TACTICAL FORMAT
    return `🎯 TARGET: ${ticker}
📊 PHYSICS:
• Trend:  ${trend}
• Energy: ${node.energy.toFixed(0)} | Vel: ${velocity}${intelligenceReport}`;
  };

  // --- SMART EFFECT ---
  useEffect(() => {
    if (!selectedTicker) return;

    // 1. If we are still loading, do nothing (wait for data)
    if (isLoading) return;

    // 2. If we already spoke about this ticker *with this data*, stop.
    if (lastTickerRef.current === selectedTicker) {
        return; 
    }

    // 3. Generate and Send
    const response = generateResponse(selectedTicker);
    setMessages(prev => [...prev, { type: 'agent', text: response }]);
    setIsExpanded(true);
    
    // 4. Mark as spoken
    lastTickerRef.current = selectedTicker;

  }, [selectedTicker, graphConnections, isLoading]); 

  // Reset ref if user specifically deselects (optional, helps with re-clicking)
  useEffect(() => {
     if (!selectedTicker) {
         lastTickerRef.current = null;
     }
  }, [selectedTicker]);


  const handleCommand = (cmd: string) => {
      setMessages(prev => [...prev, { type: 'user', text: cmd }]);
      
      setTimeout(() => {
         let response = "";
         const q = cmd.toUpperCase();
         if (q.includes("PHYSICS")) response = "PHYSICS ENGINE DOCS:\n• ENERGY (Size): Volume/Liquidity.\n• VELOCITY (Speed): Price Momentum.";
         else if (q.includes("LEGEND")) response = "VISUAL DECODER:\n🟢 GREEN: Positive\n🔴 RED: Negative\n🟡 GOLD: Knowledge Graph Link";
         else if (q.includes("STRATEGY")) response = "TACTICAL GUIDE:\n1. MOMENTUM: Watch high velocity.\n2. CATALYSTS: High Energy pulls mass.";
         else response = "Unknown command.";
         
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
    <div className={`agent-terminal ${isExpanded ? 'expanded' : 'collapsed'}`}>
      
      {/* HEADER */}
      <div className="terminal-header">
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer' }}
        >
          {/* Status Light */}
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: isLoading ? '#fbbf24' : '#22c55e', 
            boxShadow: isLoading ? '0 0 8px #fbbf24' : '0 0 8px #22c55e',
            transition: 'all 0.3s ease'
          }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', color: '#94a3b8' }}>
            {isLoading ? "DECRYPTING..." : "INTELLIGENCE"}
          </span>
        </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={onOpenArch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}>
                <Network size={14} />
            </button>
            <button onClick={onOpenBio} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, marginRight: '8px' }}>
                <User size={14} />
            </button>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
            <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
            </button>
        </div>
      </div>

      {/* BODY */}
      {isExpanded && (
        <>
          <div style={{ 
            flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '150px'
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
            
            {isLoading && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.75rem', padding: '10px 12px' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Accessing Knowledge Graph...</span>
                 </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
            {suggestions.map(s => (
                <button key={s} onClick={() => handleCommand(s)} style={{
                      background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px',
                      color: '#94a3b8', fontSize: '0.65rem', padding: '4px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)'
                  }}>
                    {s}
                </button>
            ))}
          </div>

          <div className="terminal-input-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22c55e' }}>$</span>
              <input 
                type="text" className="terminal-input" placeholder="Query system..." 
                value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
