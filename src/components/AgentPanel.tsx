import { useState, useEffect, useRef } from 'react';
import { MarketFrame } from '../App';
import { GraphConnection } from '../hooks/useKnowledgeGraph';
import { useAgentOracle } from '../hooks/useAgentOracle';
// @ts-ignore
import { Network, User, Minus, Plus, Loader2, SendHorizontal, Sparkles } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  selectedTicker: string | null;
  graphConnections?: GraphConnection[];
  isLoading?: boolean;
  onOpenArch: () => void;
  onOpenBio: () => void;
}

/**
 * HELPER: Formats raw data into a structured context for the AI.
 */
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
    SIMULATION DATE: ${currentFrame.date} (Treat this date as "Today")
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
    }, 8); 

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

    addSystemMessage(`**${selectedTicker}** selected. Analyzing real-time metrics for ${currentFrame.date}...`);
    
    lastTickerRef.current = selectedTicker;
    setIsExpanded(true);
  }, [selectedTicker, currentFrame, graphConnections, isLoading, addSystemMessage]);

  useEffect(() => {
    if (!selectedTicker) lastTickerRef.current = null;
  }, [selectedTicker]);

  const handleCommand = async (textOverride?: string) => {
    const query = textOverride || inputValue.trim();
    if (!query) return;

    setInputValue("");
    
    // INJECT: Now passing currentFrame (with date) to the helper
    const context = selectedTicker && currentFrame 
      ? getSystemContext(selectedTicker, currentFrame, graphConnections || [])
      : `General Market View. SIMULATION DATE: ${currentFrame?.date}`;

    await sendMessage(query, context);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCommand();
  };

  // --- SMART CHIPS LOGIC ---
  const getSuggestions = () => {
    if (selectedTicker) {
      return [
        { label: `Analyze $${selectedTicker}`, prompt: `Analyze the price action and sentiment for ${selectedTicker}.` },
        { label: "News Summary", prompt: `What are the latest headlines for ${selectedTicker}?` },
        { label: "Risk Factors", prompt: `What are the potential downsides or risks for ${selectedTicker}?` }
      ];
    }
    return [
      { label: "Market Overview", prompt: "Give me a high-level summary of the current market state." },
      { label: "Explain the Physics", prompt: "How does this simulation work? What do Energy and Velocity represent?" },
      { label: "Who built this?", prompt: "Who created this dashboard and what is their tech stack?" }
    ];
  };
  // -------------------------

  if (!currentFrame) return null;

  const isBusy = isLoading || isAiLoading;

  return (
    <div className={`agent-terminal ${isExpanded ? 'expanded' : 'collapsed'}`}>
      
      {/* HEADER */}
      <div className="terminal-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '2px', // Square dot = more technical
            background: isBusy ? '#fbbf24' : '#10b981', 
            boxShadow: isBusy ? '0 0 8px #fbbf24' : 'none',
            transition: 'all 0.3s ease'
          }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em', fontSize: '0.75rem', color: '#94a3b8' }}>
            {isAiLoading ? "PROCESSING STREAM..." : `INTELLIGENCE • ${currentFrame.date}`}
          </span>
        </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={(e) => { e.stopPropagation(); onOpenArch(); }} className="panel-toggle-btn" title="Architecture">
                <Network size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onOpenBio(); }} className="panel-toggle-btn" title="Bio">
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
                    <span style={{ fontFamily: 'var(--font-mono)' }}>COMPUTING...</span>
                 </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="terminal-input-area" style={{ background: 'rgba(2, 6, 23, 0.5)' }}>
            
            {/* SUGGESTION CHIPS */}
            <div className="chips-row">
                <Sparkles size={12} color="#10b981" style={{ flexShrink: 0 }} />
                {getSuggestions().map((chip, idx) => (
                    <button 
                        key={idx} 
                        className="suggestion-chip"
                        onClick={() => handleCommand(chip.prompt)}
                        disabled={isBusy}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: 'rgba(255,255,255,0.03)', padding: '8px 12px', 
                borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' 
            }}>
              <input 
                type="text" className="terminal-input" 
                placeholder="Query the market model..." 
                value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                autoFocus
                disabled={isBusy}
                style={{ fontSize: '0.85rem' }}
              />
              <button 
                onClick={() => handleCommand()}
                disabled={!inputValue.trim() || isBusy}
                style={{ 
                    background: 'none', border: 'none', cursor: 'pointer', 
                    color: inputValue.trim() ? '#10b981' : '#475569',
                    transition: 'color 0.2s'
                }}
              >
                <SendHorizontal size={16} />
              </button>
            </div>
          </div>
          
          <div style={{ 
            padding: '6px 0', 
            fontSize: '0.5rem', 
            color: '#475569', 
            textAlign: 'center',
            background: 'rgba(2, 6, 23, 0.8)',
            borderTop: '1px solid rgba(255,255,255,0.05)'
          }}>
            Simulation only. Not financial advice.
          </div>
        </>
      )}
    </div>
  );
}
