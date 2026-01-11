import { useState, useEffect, useRef } from 'react';
import { MarketFrame } from '../App';
import { GraphConnection } from '../hooks/useKnowledgeGraph';
import { useAgentOracle } from '../hooks/useAgentOracle';
// @ts-ignore
import { Network, User, Minus, Plus, Loader2, SendHorizontal } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  selectedTicker: string | null;
  graphConnections?: GraphConnection[];
  isLoading?: boolean;
  onOpenArch: () => void;
  onOpenBio: () => void;
}

const getSystemContext = (
  ticker: string, 
  currentFrame: MarketFrame, 
  graph: GraphConnection[]
) => {
  const node = currentFrame.nodes.find(n => n.ticker === ticker);
  if (!node) return "General Market View.";

  const newsSummary = graph.length > 0 
    ? graph.flatMap(c => c.articles).slice(0, 5).join(' | ') 
    : "No recent news.";

  const velocity = Math.sqrt(node.vx**2 + node.vy**2).toFixed(2);

  return `
    Focus Asset: ${ticker}
    Metrics: Energy=${node.energy.toFixed(0)}, Velocity=${velocity}
    News Context: ${newsSummary}
  `;
};

const formatMessage = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="term-bold">{part.slice(2, -2)}</span>;
    }
    return part;
  });
};

const TypewriterMessage = ({ text, type, onTyping }: { text: string, type: string, onTyping: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  const shouldAnimate = type === 'agent';

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        onTyping(); 
      } else {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, 8); // Slightly smoother speed for sans-serif

    return () => clearInterval(timer);
  }, [text, shouldAnimate, onTyping]);

  return (
    <div className={`msg-row msg-${type} ${!isComplete && shouldAnimate ? 'typing-cursor' : ''}`}>
      {isComplete ? formatMessage(text) : displayedText}
    </div>
  );
};

export function AgentPanel({ 
  currentFrame, 
  selectedTicker, 
  graphConnections, 
  isLoading, 
  onOpenArch, 
  onOpenBio 
}: AgentPanelProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth > 768;
  });
  
  const [inputValue, setInputValue] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastTickerRef = useRef<string | null>(null);
  
  const { messages, isAiLoading, sendMessage, addSystemMessage } = useAgentOracle();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) scrollToBottom();
  }, [messages.length, isExpanded]);

  useEffect(() => {
    if (!selectedTicker || !currentFrame || isLoading) return;
    if (lastTickerRef.current === selectedTicker) return;

    addSystemMessage(`**${selectedTicker}** selected. Analyzing real-time metrics...`);
    
    lastTickerRef.current = selectedTicker;
    setIsExpanded(true);
  }, [selectedTicker, currentFrame, graphConnections, isLoading, addSystemMessage]);

  useEffect(() => {
    if (!selectedTicker) lastTickerRef.current = null;
  }, [selectedTicker]);

  const handleCommand = async () => {
    const query = inputValue.trim();
    if (!query) return;

    setInputValue("");
    const upper = query.toUpperCase();
    
    if (upper === "PHYSICS") {
      addSystemMessage("**Physics Model:**\n• **Energy:** Volume/Liquidity\n• **Velocity:** Price Momentum");
      return;
    }

    const context = selectedTicker && currentFrame 
      ? getSystemContext(selectedTicker, currentFrame, graphConnections || [])
      : "General market overview.";

    await sendMessage(query, context);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCommand();
  };

  if (!currentFrame) return null;

  const isBusy = isLoading || isAiLoading;

  return (
    <div className={`agent-terminal ${isExpanded ? 'expanded' : 'collapsed'}`}>
      
      {/* HEADER */}
      <div className="terminal-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div style={{ 
            width: '6px', height: '6px', borderRadius: '50%', 
            background: isBusy ? '#fbbf24' : '#22c55e', 
            boxShadow: isBusy ? '0 0 8px #fbbf24' : '0 0 8px #22c55e',
            transition: 'all 0.3s ease'
          }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.75rem', color: '#94a3b8' }}>
            {isAiLoading ? "PROCESSING..." : "MARKET INTELLIGENCE"}
          </span>
        </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={(e) => { e.stopPropagation(); onOpenArch(); }} className="panel-toggle-btn">
                <Network size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onOpenBio(); }} className="panel-toggle-btn" style={{ marginRight: '8px' }}>
                <User size={14} />
            </button>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
            <button className="panel-toggle-btn">
                {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
            </button>
        </div>
      </div>

      {/* BODY */}
      {isExpanded && (
        <>
          <div className="terminal-body">
            {messages.map((msg, i) => (
              <TypewriterMessage 
                key={i} 
                text={msg.text} 
                type={msg.type}
                onTyping={scrollToBottom} 
              />
            ))}
            
            {isBusy && (
                 <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.75rem', padding: '0 12px', opacity: 0.8 }}>
                    <Loader2 size={12} className="animate-spin" />
                    <span>{isAiLoading ? "AI is typing..." : "Fetching data..."}</span>
                 </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA (Modern) */}
          <div className="terminal-input-area" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: 'rgba(0,0,0,0.3)', padding: '8px 12px', 
                borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <input 
                type="text" className="terminal-input" 
                placeholder="Ask about market trends..." 
                value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                autoFocus
                style={{ fontSize: '0.9rem' }}
              />
              <button 
                onClick={() => handleCommand()}
                disabled={!inputValue.trim()}
                style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', 
                    color: inputValue.trim() ? '#22c55e' : '#475569',
                    transition: 'color 0.2s'
                }}
              >
                <SendHorizontal size={16} />
              </button>
            </div>
          </div>
          
          <div style={{ 
            padding: '4px 0', 
            fontSize: '0.6rem', 
            color: '#475569', 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.02)'
          }}>
            Simulation only. Not financial advice.
          </div>
        </>
      )}
    </div>
  );
}
