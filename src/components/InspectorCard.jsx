import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { FileCode } from 'lucide-react'; 
import LogicModal from './LogicModal';

const InspectorCard = ({ 
  title, tag, desc, chartType, isLoading, 
  plotData, plotLayout, tableData, sqlCode,
  children 
}) => {
  
  const [showLogic, setShowLogic] = useState(false);
  const isCall = (type) => ['C', 'CALL', 'Call'].includes(type);

  return (
    <div className="panel panel-flex-column">
      
      {/* HEADER */}
      <div className="panel-header">
        <div className="panel-title">
          <span>{title}</span>
          {tag && <span className="tag ml-2">{tag}</span>}
        </div>
        
        {/* LOGIC TRIGGER BUTTON */}
        {sqlCode && (
          <button 
            className="nav-link panel-toggle-btn"
            onClick={() => setShowLogic(true)}
            disabled={isLoading}
            title="View Logic"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}>
              <FileCode size={14} />
              <span className="mobile-hide">View Logic</span>
            </div>
          </button>
        )}
      </div>

      <p className="panel-desc">{desc}</p>

      {/* CONTENT AREA */}
      <div className="chart-box chart-content-area">
        {isLoading && <div className="loading-state">Fetching pipeline artifacts...</div>}

        {!isLoading && (
           <>
             {/* SCATTER / LINE */}
             {chartType !== 'table' && plotData && (
                <Plot 
                  data={plotData} 
                  layout={{
                    ...plotLayout,
                    autosize: true,
                    // Standardize margins if not provided
                    margin: plotLayout.margin || { l: 40, r: 20, t: 20, b: 40 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#94a3b8', family: 'JetBrains Mono, monospace' }
                  }}
                  useResizeHandler={true} 
                  style={{ width: '100%', height: '100%' }}
                  config={{ displayModeBar: false }}
                />
             )}

             {/* TABLE */}
             {chartType === 'table' && tableData && (
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
           </>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      {children && (
        <div className="chart-footer-area">
          {children}
        </div>
      )}

      {/* THE LOGIC MODAL */}
      <LogicModal 
        isOpen={showLogic} 
        onClose={() => setShowLogic(false)}
        title={title}
        sqlCode={sqlCode}
      />
    </div>
  );
};

export default InspectorCard;
