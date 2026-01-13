import { useState, useEffect, useRef } from 'react';
import { MarketFrame } from './MarketMap';
import { GraphConnection } from '../hooks/useKnowledgeGraph';
import { useAgentOracle } from '../hooks/useAgentOracle';
import { Minus, Plus, Loader2, SendHorizontal, Sparkles, Activity } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  selectedTicker: string | null;
  graphConnections?: GraphConnection[];
  isLoading?: boolean;
}

// --- UPDATED CONTEXT GENERATOR ---
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
    REPORT FOR: ${ticker}
    DATE: ${currentFrame.date}
    
    TELEMETRY:
    - Energy (Vol): ${node.energy.toFixed(0)}
    - Velocity (Mom): ${velocity}
    - Sentiment: ${node.sentiment.toFixed(2)}
    
    INTELLIGENCE:
    ${newsSummary}
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
    }, 5); 

    return () => clearInterval(timer);
  }, [text, shouldAnimate, onTyping]);

  return (
    <div className={`msg-row msg-${type}`}>
      {isComplete ? formatMessage(text) : displayedText}
      {!isComplete && shouldAnimate && <span className="typing-cursor" aria-hidden="true">|</span>}
    </div>
  );
};

export function AgentPanel({ 
  currentFrame, 
  selectedTicker, 
  graphConnections, 
  isLoading 
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

    addSystemMessage(`Tracking **${selectedTicker}**. Metrics loaded for ${currentFrame.date}.`);
    
    lastTickerRef.current = selectedTicker;
    setIsExpanded(true);
  }, [selectedTicker, currentFrame, graphConnections, isLoading, addSystemMessage]);

  useEffect(() => {
    if (!selectedTicker) lastTickerRef.current = null;
  }, [selectedTicker]);

  // 1. UPDATE: Accept 'mode' as an optional 2nd argument
  const handleCommand = async (textOverride?: string, mode?: string) => {
    const query = textOverride || inputValue.trim();
    if (!query) return;

    if (window.innerWidth < 768) {
      (document.activeElement as HTMLElement)?.blur();
    }

    setInputValue("");
    
    const context = selectedTicker && currentFrame 
      ? getSystemContext(selectedTicker, currentFrame, graphConnections || [])
      : `General Market View. SIMULATION DATE: ${currentFrame?.date}`;

    // 2. UPDATE: Pass 'mode' to the hook (which sends it to Supabase)
    await sendMessage(query, context, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCommand();
  };

  const getSuggestions = () => {
    if (selectedTicker) {
      return [
        { label: `Brief ${selectedTicker}`, prompt: `Give me a short brief on ${selectedTicker}'s status.` },
        { label: "Check News", prompt: `Any relevant news impacting ${selectedTicker}?` },
        // 3. UPDATE: Add the new "Explain Physics" chip with the 'physicist' mode trigger
        { label: "Explain Physics", prompt: `Explain the visual physics of ${selectedTicker}.`, mode: 'physicist' }
      ];
    }
    return [
      { label: "Market Status", prompt: "Summarize the current market state." },
      { label: "Velocity?", prompt: "Quickly explain how this simulation calculates velocity." },
      { label: "Tech Stack", prompt: "What technology is powering this dashboard?" }
    ];
  };

  if (!currentFrame) return null;

  const isBusy = isLoading || isAiLoading;

  return (
    <div 
      className={`agent-terminal ${isExpanded ? 'expanded' : 'collapsed'} ${selectedTicker ? 'agent-terminal-active' : ''}`}
      role="region"
      aria-label="AI Market Agent"
    >
      
      {/* HEADER */}
      <div 
        className="terminal-header" 
        onClick={() => setIsExpanded(!isExpanded)} 
        role="button"
        aria-expanded={isExpanded}
        aria-controls="agent-messages"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      >
        <div className="terminal-title-wrapper">
          <Activity 
            size={16} 
            className={isBusy ? "icon-spin" : ""}
            color={isBusy ? "var(--accent-ai)" : "var(--accent-green)"} 
            aria-hidden="true"
          />
          <span className="terminal-title-text">
            {isAiLoading ? "PROCESSING DATA..." : "MARKET INTELLIGENCE"}
          </span>
        </div>

         <div className="terminal-controls">
            <button 
              className="panel-toggle-btn" 
              aria-label={isExpanded ? "Collapse Panel" : "Expand Panel"}
            >
                {isExpanded ? <Minus size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
            </button>
        </div>
      </div>

      {/* BODY */}
      {isExpanded && (
        <>
          <div 
            id="agent-messages"
            className="terminal-body"
            aria-live="polite" 
            aria-atomic="false"
          >
            {messages.map((msg, i) => (
              <TypewriterMessage 
                key={i} 
                text={msg.text} 
                type={msg.type}
                onTyping={scrollToBottom} 
              />
            ))}
            
            {isBusy && (
                 <div className="loading-indicator" role="status">
                    <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                    <span>ANALYZING MARKET VECTORS...</span>
                 </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="terminal-input-area">
            
            <div className="chips-row" role="group" aria-label="Suggested Queries">
                <Sparkles size={12} color="var(--accent-green)" className="suggestion-icon" aria-hidden="true" />
                {getSuggestions().map((chip, idx) => (
                    <button 
                        key={idx} 
                        className="suggestion-chip"
                        // 4. UPDATE: Pass the optional chip.mode to the handler
                        // @ts-ignore
                        onClick={() => handleCommand(chip.prompt, chip.mode)}
                        disabled={isBusy}
                        aria-label={`Ask AI: ${chip.label}`}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            <div className="input-wrapper">
              <input 
                type="text" className="terminal-input" 
                placeholder="Initialize query sequence..." 
                value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown}
                disabled={isBusy}
                aria-label="Message the AI Agent"
              />
              <button 
                onClick={() => handleCommand()}
                disabled={!inputValue.trim() || isBusy}
                className="send-btn"
                aria-label="Send Message"
              >
                <SendHorizontal size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          
          <div className="disclaimer-footer" aria-hidden="true">
            SIMULATION ONLY. NOT FINANCIAL ADVICE. SYSTEM ONLINE V2.4.
          </div>
        </>
      )}
    </div>
  );
}
