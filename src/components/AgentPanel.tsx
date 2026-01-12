import { useState, useEffect, useRef } from 'react';
import { MarketFrame } from '../App';
import { GraphConnection } from '../hooks/useKnowledgeGraph';
import { useAgentOracle } from '../hooks/useAgentOracle';
// @ts-ignore
import { Minus, Plus, Loader2, SendHorizontal, Sparkles, Activity } from 'lucide-react';

interface AgentPanelProps {
  currentFrame: MarketFrame | null;
  selectedTicker: string | null;
  graphConnections?: GraphConnection[];
  isLoading?: boolean;
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
    [SYSTEM INSTRUCTION: Adopt a "Smart Analyst" persona. 
    - Split your response 70/30: 70% hard data/analysis, 30% conversational flow.
    - Be grounded and helpful. Use phrases like "Gotcha", "Hmmm", "Let's see". 
    - Avoid over-the-top sci-fi or roleplay. Keep it professional but relaxed.]

    SIMULATION DATE: ${currentFrame.date} (Treat this as Today)
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

  const handleCommand = async (textOverride?: string) => {
    const query = textOverride || inputValue.trim();
    if (!query) return;

    // Mobile UX: Dismiss keyboard to show results
    if (window.innerWidth < 768) {
      (document.activeElement as HTMLElement)?.blur();
    }

    setInputValue("");
    
    const context = selectedTicker && currentFrame 
      ? getSystemContext(selectedTicker, currentFrame, graphConnections || [])
      : `General Market View. SIMULATION DATE: ${currentFrame?.date}`;

    await sendMessage(query, context);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCommand();
  };

  const getSuggestions = () => {
    if (selectedTicker) {
      return [
        { label: `Brief ${selectedTicker}`, prompt: `Give me a short brief on ${selectedTicker}'s status.` },
        { label: "Check News", prompt: `Any relevant news impacting ${selectedTicker}?` },
        { label: "Analyze Risk", prompt: `What are the immediate risks for ${selectedTicker}?` }
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
      className={`agent-terminal ${isExpanded ? 'expanded' : 'collapsed'}`}
      style={{
         borderColor: selectedTicker ? 'var(--accent-green)' : 'var(--glass-border)',
      }}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Activity 
            size={16} 
            className={isBusy ? "icon-spin" : ""}
            color={isBusy ? "var(--accent-ai)" : "var(--accent-green)"} 
            aria-hidden="true"
          />
          <span style={{ 
              fontFamily: 'var(--font-mono)', 
              fontWeight: 600, 
              fontSize: '0.8rem', 
              color: 'var(--text-primary)',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
          }}>
            {isAiLoading ? "PROCESSING DATA..." : "MARKET INTELLIGENCE"}
          </span>
        </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                <Sparkles size={12} color="var(--accent-green)" style={{ flexShrink: 0, opacity: 0.7 }} aria-hidden="true" />
                {getSuggestions().map((chip, idx) => (
                    <button 
                        key={idx} 
                        className="suggestion-chip"
                        onClick={() => handleCommand(chip.prompt)}
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
            SIMULATION ONLY. NOT FINANCIAL ADVICE.
          </div>
        </>
      )}
    </div>
  );
}
