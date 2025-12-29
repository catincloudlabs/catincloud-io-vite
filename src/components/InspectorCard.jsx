import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

const InspectorCard = ({ 
  title, tag, desc, chartType, isLoading, 
  plotData, plotLayout, tableData, sqlCode,
  children 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const isCall = (type) => ['C', 'CALL', 'Call'].includes(type);

  return (
    <div className={`panel ${isFlipped ? 'panel-terminal' : ''} panel-flex-column`}>
      
      {/* HEADER */}
      <div className="panel-header">
        <div className="panel-title">
          <span>{title}</span>
          {tag && <span className="tag">{tag}</span>}
        </div>
        <button 
          onClick={() => setIsFlipped(!isFlipped)}
          className="nav-link panel-toggle-btn" 
          disabled={isLoading}
        >
          {isFlipped ? "Show Chart 📊" : "View Logic 🐈"}
        </button>
      </div>

      {!isFlipped && <p className="panel-desc">{desc}</p>}

      {/* CONTENT */}
      <div className="chart-box chart-content-area">
        {isLoading && <div className="loading-state">Fetching pipeline artifacts...</div>}

        {/* LOGIC VIEW */}
        {!isLoading && isFlipped && (
          <div className="code-view-container">
            <SyntaxHighlighter 
              language="sql" style={atomOneDark}
              customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
              wrapLongLines={true}
            >
              {sqlCode || "-- No Logic Available"}
            </SyntaxHighlighter>
          </div>
        )}

        {/* CHART VIEW */}
        {!isLoading && !isFlipped && chartType !== 'table' && plotData && (
          <Plot
            data={plotData}
            layout={{
              ...plotLayout,
              autosize: true,
              margin: { l: 40, r: 20, t: 20, b: 40 },
              paper_bgcolor: 'rgba(0,0,0,0)',
              plot_bgcolor: 'rgba(0,0,0,0)',
              font: { color: '#94a3b8', family: 'JetBrains Mono, monospace' }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%' }}
            config={{ displayModeBar: false }}
          />
        )}

        {/* TABLE VIEW */}
        {!isLoading && !isFlipped && chartType === 'table' && tableData && (
          <div className="table-view-container">
            <table className="table-standard">
              <thead className="table-header">
                <tr className="table-header-row">
                  <th className="table-cell-padding">TICKER</th>
                  <th className="table-cell-padding">CONTRACT</th>
                  <th className="table-cell-padding">EXPIRY</th>
                  <th className="table-cell-padding">TYPE</th>
                  <th className="table-cell-padding" style={{ textAlign: 'right' }}>PREMIUM</th>
                  <th className="table-cell-padding" style={{ textAlign: 'right' }}>SENTIMENT</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i} className="table-row-divider">
                    <td className="table-cell-padding" style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{row.ticker}</td>
                    <td className="table-cell-padding">{row.contract}</td>
                    <td className="table-cell-padding" style={{ color: 'var(--text-muted)' }}>{row.expiry}</td>
                    <td className="table-cell-padding" style={{ color: isCall(row.type) ? 'var(--green)' : 'var(--red)' }}>{row.type}</td>
                    <td className="table-cell-padding" style={{ textAlign: 'right' }}>${(row.premium / 1000000).toFixed(1)}M</td>
                    <td className="table-cell-padding" style={{ textAlign: 'right', color: row.sentiment === 'Bullish' ? 'var(--green)' : 'var(--red)' }}>{row.sentiment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FOOTER */}
      {children && (
        <div className="chart-footer-area">
          {children}
        </div>
      )}
    </div>
  );
};

export default InspectorCard;
