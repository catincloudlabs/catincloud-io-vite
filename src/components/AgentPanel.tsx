import { useState, useEffect, useRef } from 'react';
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
 * HELPER: Formats raw data into a structured SITREP for the AI.
 * This provides the "Intelligence" the Oracle needs to be accurate.
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
  
  // 1. Hook Integration
  const { messages, isAiLoading, sendMessage, addSystemMessage } = useAgentOracle();

  // 2. Auto-scroll terminal
  useEffect(() => {
    if (isExpanded) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isExpanded]);

  // 3. Ticker Selection Effect
  // This triggers when the user clicks a node on the map.
  useEffect(() => {
    if (!selectedTicker || !currentFrame || isLoading) return;
    if (lastTickerRef.current === selectedTicker) return;

    // Generate context for the SITREP
    const context = getSystemContext(selectedTicker, currentFrame, graphConnections || []);
    
    // Add local acknowledgment
    addSystemMessage(`🎯 TARGET ACQUIRED: ${selectedTicker}\nAnalyzing physics and news vectors...`);
    
    // OPTIONAL: Automatically ask the AI for a brief sitrep when clicked
    // sendMessage("Provide a 1-sentence tactical SITREP based on current physics.", context);
    
    // Note: To fix the 'context' unused error, we either use it in sendMessage 
    // or log it if you only want the local message for now.
    console.debug("Context prepared for target:", context);

    lastTickerRef.current = selectedTicker;
    setIsExpanded(true);
  }, [selectedTicker, currentFrame, graphConnections, isLoading, addSystemMessage]);

  // Reset tracking if user deselects
  useEffect(() => {
    if (!selectedTicker) lastTickerRef.current = null;
  }, [selectedTicker]);

  // 4. Command Router
  const handleCommand = async (cmd: string) => {
    const query = cmd.trim();
    if (!query) return;

    setInputValue("");
    
    const upper = query.toUpperCase();
    
    // Static system documentation
    if (upper === "PHYSICS") {
      addSystemMessage("PHYSICS ENGINE DOCS:\n• ENERGY (Size): Volume/Liquidity.\n• VELOCITY (Speed): Price Momentum.");
      return;
    }
    if (upper === "LEGEND") {
      addSystemMessage("VISUAL DECODER:\n🟢 GREEN: Positive\n🔴 RED: Negative\n🟡 GOLD: Knowledge Graph Link");
      return;
    }

    // AI Oracle Route
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
            <button onClick={(e) => { e.stopPropagation(); onOpenArch(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}>
                <Network size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onOpenBio(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, marginRight: '8px' }}>
                <User size={14} />
            </button>
            <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)' }}></div>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
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
            {messages.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: 'flex-start', width: '100%', lineHeight: '1.5', whiteSpace: 'pre-wrap',
                marginTop: msg.type === 'user' ? '16px' : '0px',
                color: msg.type === 'user' ? '#22c55e' : '#e2e8f0',
                backgroundColor: msg.type === 'user' ? 'transparent' : 'rgba(255, 255, 255, 0.05)',
                padding: msg.type === 'user' ? '0 4px' : '10px 12px',
                borderRadius: msg.type === 'user' ? '0' : '6px',
                borderLeft: msg.type === 'user' ? 'none' : '2px solid #3b82f6',
                fontSize: '0.8rem'
              }}>
                {msg.type === 'user' ? `➜ ${msg.text}` : msg.text}
              </div>
            ))}
            
            {isBusy && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '0.75rem', padding: '10px 12px' }}>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{isAiLoading ? "Uplink active..." : "Accessing Knowledge Graph..."}</span>
                 </div>
            )}
            
            <div ref={chatEndRef} />
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
