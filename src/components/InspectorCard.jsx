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
            <div className="logic-btn-inner">
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
                    margin: plotLayout.margin || { l: 40, r: 20, t: 20, b: 40 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#94a3b8', family: 'JetBrains Mono, monospace' }
                  }}
                  useResizeHandler={true} 
                  className="plotly-fill"
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
                        <th className="table-cell-padding text-right">PREMIUM</th>
                        <th className="table-cell-padding text-right">SENTIMENT</th>
                     </tr>
                   </thead>
                   <tbody>
                     {tableData.map((row, i) => (
                       <tr key={i} className="table-row-divider">
                         <td className="table-cell-padding font-bold text-accent">{row.ticker}</td>
                         <td className="table-cell-padding">{row.contract}</td>
                         <td className="table-cell-padding text-muted">{row.expiry}</td>
                         <td className={`table-cell-padding ${isCall(row.type) ? 'text-green' : 'text-red'}`}>{row.type}</td>
                         <td className="table-cell-padding text-right">${(row.premium / 1000000).toFixed(1)}M</td>
                         <td className={`table-cell-padding text-right ${row.sentiment === 'Bullish' ? 'text-green' : 'text-red'}`}>
                           {row.sentiment}
                         </td>
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
