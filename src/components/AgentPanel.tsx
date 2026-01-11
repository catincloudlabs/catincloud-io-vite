import { useState, useEffect, useRef, useMemo } from 'react';
import { MarketFrame } from '../App';
import { GraphConnection } from '../hooks/useKnowledgeGraph';
import { useAgentOracle } from '../hooks/useAgentOracle';
// @ts-ignore
import { Network, User, Minus, Plus, Loader2 } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  selectedTicker: string | null;
  graphConnections?: GraphConnection[];
  isLoading?: boolean;
  onOpenArch: () => void;
  onOpenBio: () => void;
}

/**
 * UTILITY: Parses bold markdown (e.g. **Text**) into JSX
 */
const formatMessage = (text: string) => {
  // Split by double asterisks
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="term-bold">{part.slice(2, -2)}</span>;
    }
    return part;
  });
};

/**
 * COMPONENT: Handles the "Sci-Fi" typing effect
 */
const TypewriterMessage = ({ text, type, onTyping }: { text: string, type: string, onTyping: () => void }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  // Instant render for user messages, typing for agent
  const shouldAnimate = type === 'agent' || type === 'system';

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    let i = 0;
    // Speed: 15ms per char (Fast but readable)
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => text.slice(0, i + 1));
        i++;
        onTyping(); // Trigger scroll
      } else {
        clearInterval(timer);
        setIsComplete(true);
      }
    }, 15);

    return () => clearInterval(timer);
  }, [text, shouldAnimate]);

  return (
    <div className={`msg-row msg-${type} ${!isComplete && shouldAnimate ? 'typing-cursor' : ''}`}>
      {type === 'user' && <span style={{ marginRight: 8 }}>➜</span>}
      {/* We only format the text once it's fully typed to prevent 
         markdown chars (**...**) from flickering during animation 
      */}
      {isComplete ? formatMessage(text) : displayedText}
    </div>
  );
};

// --- Context Helper ---
const getSystemContext = (
  ticker: string, 
  currentFrame: MarketFrame, 
  graph: GraphConnection[]
) => {
  const node = currentFrame.nodes.find(n => n.ticker === ticker);
  if (!node) return "General Market View.";

  const newsSummary = graph.length > 0 
    ? graph.flatMap(c => c.articles).slice(0, 5).join(' | ') 
    : "No recent news signals.";

  const velocity = Math.sqrt(node.vx**2 + node.vy**2).toFixed(2);

  return `
    CURRENT TARGET: ${ticker}
    PHYSICS: Energy=${node.energy.toFixed(0)}, Velocity=${velocity}
    KNOWLEDGE GRAPH INTEL: ${newsSummary}
  `;
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

  // Scroll Helper
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Auto-scroll when message list length changes
  useEffect(() => {
    if (isExpanded) scrollToBottom();
  }, [messages.length, isExpanded]);

  // 2. Ticker Selection Logic
  useEffect(() => {
    if (!selectedTicker || !currentFrame || isLoading) return;
    if (lastTickerRef.current === selectedTicker) return;

    const context = getSystemContext(selectedTicker, currentFrame, graphConnections || []);
    
    // Using Markdown for emphasis
    addSystemMessage(`**TARGET ACQUIRED:** ${selectedTicker}\nAnalyzing physics and news vectors...`);
    
    // Log for debugging
    console.debug("Context prepared for target:", context);

    lastTickerRef.current = selectedTicker;
    setIsExpanded(true);
  }, [selectedTicker, currentFrame, graphConnections, isLoading, addSystemMessage]);

  useEffect(() => {
    if (!selectedTicker) lastTickerRef.current = null;
  }, [selectedTicker]);

  // 3. Command Router
  const handleCommand = async (cmd: string) => {
    const query = cmd.trim();
    if (!query) return;

    setInputValue("");
    const upper = query.toUpperCase();
    
    if (upper === "PHYSICS") {
      addSystemMessage("**PHYSICS ENGINE DOCS:**\n• **ENERGY** (Size): Volume/Liquidity.\n• **VELOCITY** (Speed): Price Momentum.");
      return;
    }
    if (upper === "LEGEND") {
      addSystemMessage("**VISUAL DECODER:**\n🟢 **GREEN**: Positive\n🔴 **RED**: Negative\n🟡 **GOLD**: Knowledge Graph Link");
      return;
    }

    const context = selectedTicker && currentFrame 
      ? getSystemContext(selectedTicker, currentFrame, graphConnections || [])
      : "Viewing general market map simulation.";

    await sendMessage(query, context);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCommand(inputValue);
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
          <span style={{ fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.75rem', color: '#94a3b8' }}>
            {isAiLoading ? "CONSULTING ORACLE..." : isLoading ? "DECRYPTING..." : "INTELLIGENCE"}
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
                key={i} // Using index is safe here as we only append
                text={msg.text} 
                type={msg.type}
                onTyping={scrollToBottom} 
              />
            ))}
            
            {isBusy && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.75rem', padding: '10px 12px', opacity: 0.8 }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="typing-cursor">
                      {isAiLoading ? "Uplink established. Awaiting stream..." : "Accessing Knowledge Graph..."}
                    </span>
                 </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div className="terminal-input-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22c55e', fontWeight: 'bold' }}>$</span>
              <input 
                type="text" className="terminal-input" placeholder="Query intelligence..." 
                value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
