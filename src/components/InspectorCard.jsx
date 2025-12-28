import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Register SQL language support for the syntax highlighter
SyntaxHighlighter.registerLanguage('sql', sql);

const InspectorCard = ({ 
  title, 
  tag, 
  desc, 
  chartType, 
  isLoading, 
  plotData, 
  plotLayout, 
  tableData, 
  sqlCode 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className={`panel ${isFlipped ? 'panel-terminal' : ''}`} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- HEADER --- */}
      <div className="panel-header">
        <div className="panel-title">
          <span>{title}</span>
          {tag && <span className="tag">{tag}</span>}
        </div>
        
        {/* The Toggle Button */}
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="nav-link" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
          disabled={isLoading}
        >
          {isFlipped ? "Show Chart 📊" : "View Logic 👨‍💻"}
        </button>
      </div>

      {/* --- DESCRIPTION (Hide in Logic Mode to save space) --- */}
      {!isFlipped && <p className="panel-desc">{desc}</p>}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="chart-box" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        
        {/* State 1: Loading */}
        {isLoading && (
          <div className="loading-state">
            Fetching pipeline artifacts...
          </div>
        )}

        {/* State 2: Logic View (Code) */}
        {!isLoading && isFlipped && (
          <div style={{ height: '100%', overflow: 'auto', fontSize: '0.8rem' }}>
            <SyntaxHighlighter 
              language="sql" 
              style={atomOneDark}
              customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
              wrapLongLines={true}
            >
              {sqlCode || "-- No Logic Available"}
            </SyntaxHighlighter>
          </div>
        )}

        {/* State 3A: Plotly Chart View */}
        {!isLoading && !isFlipped && chartType !== 'table' && plotData && (
          <Plot
            data={plotData}
            layout={{
              ...plotLayout,
              autosize: true,
              margin: { l: 40, r: 20, t: 20, b: 40 }, // Tight margins for cards
              paper_bgcolor: 'rgba(0,0,0,0)',         // Transparent
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: '#94a3b8', family: 'JetBrains Mono, monospace' }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }} // Hides the hovering toolbar
          />
        )}

        {/* State 3B: HTML Table View */}
        {!isLoading && !isFlipped && chartType === 'table' && tableData && (
          <div style={{ overflow: 'auto', height: '100%', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 10 }}>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px' }}>TICKER</th>
                  <th style={{ padding: '8px' }}>CONTRACT</th>
                  <th style={{ padding: '8px' }}>EXPIRY</th>
                  <th style={{ padding: '8px' }}>TYPE</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>PREMIUM</th>
                  <th style={{ padding: '8px', textAlign: 'right' }}>SENTIMENT</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold', color: 'var(--accent)' }}>{row.ticker}</td>
                    <td style={{ padding: '8px' }}>{row.contract}</td>
                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{row.expiry}</td>
                    <td style={{ padding: '8px', color: row.type === 'CALL' ? 'var(--green)' : 'var(--red)' }}>{row.type}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>
                      ${(row.premium / 1000000).toFixed(1)}M
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', color: row.sentiment === 'Bullish' ? 'var(--green)' : 'var(--red)' }}>
                      {row.sentiment}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default InspectorCard;
