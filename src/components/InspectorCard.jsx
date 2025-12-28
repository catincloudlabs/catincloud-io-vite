import React, { useState } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Register SQL language
SyntaxHighlighter.registerLanguage('sql', sql);

const InspectorCard = ({ title, tag, desc, chartType }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Placeholder SQL for now - we will fetch this from JSON later
  const mockSQL = `
-- Example Logic for ${title}
SELECT 
  ticker,
  (implied_vol - realized_vol) as vrp,
  sum(gamma_exposure) as gex
FROM int_massive__options_joined
WHERE ticker_category = 'Chaos'
GROUP BY 1
HAVING gex > 1000000;
  `;

  return (
    <div className={`panel ${isFlipped ? 'panel-terminal' : ''}`} style={{height: '100%'}}>
      
      {/* Header with Toggle Switch */}
      <div className="panel-header">
        <div className="panel-title">
          <span>{title}</span>
          {tag && <span className="tag">{tag}</span>}
        </div>
        
        {/* The Toggle Button */}
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="nav-link" 
          style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem'}}
        >
          {isFlipped ? "Show Chart 📊" : "View Logic 👨‍💻"}
        </button>
      </div>

      {/* Description (Hide in Logic Mode to save space) */}
      {!isFlipped && <p className="panel-desc">{desc}</p>}

      {/* Main Content Area */}
      <div className="chart-box" style={{position: 'relative', flex: 1}}>
        {isFlipped ? (
          // BACK OF CARD: The Code
          <div style={{height: '100%', overflow: 'auto', fontSize: '0.8rem'}}>
             <SyntaxHighlighter 
                language="sql" 
                style={atomOneDark}
                customStyle={{background: 'transparent', padding: 0}}
             >
               {mockSQL}
             </SyntaxHighlighter>
          </div>
        ) : (
          // FRONT OF CARD: The Chart
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)'
          }}>
            [ {chartType.toUpperCase()} CHART GOES HERE ]
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorCard;
