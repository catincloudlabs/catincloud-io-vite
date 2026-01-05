import React, { useState, Suspense, lazy } from 'react';

// --- OPTIMIZATION 1: LIGHTWEIGHT PLOTLY ---
// Use the factory to force React to use 'basic-dist' (1MB) instead of full (4MB)
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

import { FileCode, Activity } from 'lucide-react'; 

// --- OPTIMIZATION 2: LAZY LOAD HEAVY LOGIC ---
// The 'syntax' chunk (react-syntax-highlighter) will NOT download until this modal is requested.
const LogicModal = lazy(() => import('./LogicModal'));

const InspectorCard = ({ 
  className,
  title, 
  tag, 
  desc, 
  chartType, 
  isLoading, 
  plotData, 
  plotLayout, 
  tableData,
  customChart,
  // Logic Props
  sqlCode, 
  dbtCode, 
  dbtYml,
  headerControls, 
  children 
}) => {
  
  const [showLogic, setShowLogic] = useState(false);
  const isCall = (type) => ['C', 'CALL', 'Call'].includes(type);
  
  const hasLogic = Boolean(sqlCode || dbtCode || dbtYml);
  
  return (
    <div className={`panel panel-flex-column panel-min-height ${className || ''}`}>
      
      {/* --- HEADER --- */}
      <div className="panel-header">
        <div className="panel-title panel-header-actions">
          {isLoading ? <Activity className="spin-slow mr-2" size={16} color="#64748b"/> : null}
          <span className="panel-title-text">{title}</span>
          {tag && <span className={`tag ml-2 ${tag === 'RISK' ? 'tag-red' : 'tag-blue'}`}>{tag}</span>}
        </div>
        
        <div className="panel-header-actions">
            {/* Custom Controls */}
            {headerControls && (
                <div className="header-tabs-wrapper">
                    {headerControls}
                </div>
            )}

            {/* Inspector Button */}
            {hasLogic && (
            <button 
                className="nav-link panel-toggle-btn logic-inspector-btn"
                onClick={() => setShowLogic(true)}
                disabled={isLoading}
                title="Inspect Data Pipeline Logic"
            >
                <div className="logic-btn-inner">
                <FileCode size={14} />
                <span className="ml-1 desktop-only">Logic</span>
                </div>
            </button>
            )}
        </div>
      </div>

      <p className="panel-desc">{desc}</p>

      {/* --- CONTENT AREA --- */}
      <div className="chart-box chart-content-area">
        
        {isLoading && (
            <div className="loading-overlay">
                <div className="scan-line"></div>
            </div>
        )}

        {!isLoading && (
           <>
             {/* 1. PLOTLY CHART */}
             {chartType !== 'table' && plotData && (
                <Plot 
                  data={plotData} 
                  layout={{
                    ...plotLayout,
                    autosize: true,
                    margin: plotLayout.margin || { l: 40, r: 20, t: 20, b: 30 },
                    paper_bgcolor: 'rgba(0,0,0,0)',
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    font: { color: '#cbd5e1', family: 'JetBrains Mono, monospace' },
                    xaxis: { ...plotLayout.xaxis, gridcolor: '#334155' },
                    yaxis: { ...plotLayout.yaxis, gridcolor: '#334155' }
                  }}
                  useResizeHandler={true} 
                  className="plotly-fill"
                  config={{ displayModeBar: false, responsive: true }}
                />
             )}

             {/* 2. DATA TABLE */}
             {chartType === 'table' && tableData && (
               <div className="table-view-container custom-scrollbar">
                 <table className="table-standard">
                   <thead className="table-header sticky-header">
                     <tr className="table-header-row">
                        <th className="table-cell-padding">TICKER</th>
                        <th className="table-cell-padding">STRIKE</th>
                        <th className="table-cell-padding">EXPIRY</th>
                        <th className="table-cell-padding">TYPE</th>
                        <th className="table-cell-padding text-right">PREMIUM</th>
                        <th className="table-cell-padding text-right">SENTIMENT</th>
                      </tr>
                   </thead>
                   <tbody>
                     {tableData.map((row, i) => (
                       <tr key={i} className={row.sentiment === 'Bullish' ? 'row-bullish' : 'row-bearish'}>
                         <td className="table-cell-padding font-bold text-accent">{row.ticker}</td>
                         <td className="table-cell-padding">{row.strike}</td>
                         <td className="table-cell-padding text-muted text-sm">{row.expiry}</td>
                         <td className={`table-cell-padding font-bold ${isCall(row.type) ? 'text-green' : 'text-red'}`}>
                            {row.type}
                         </td>
                         <td className="table-cell-padding text-right font-mono text-white">
                           ${(row.premium / 1000000).toFixed(1)}M
                         </td>
                         <td className={`table-cell-padding text-right font-bold ${row.sentiment === 'Bullish' ? 'text-green' : 'text-red'}`}>
                           {row.sentiment}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}

             {/* 3. CUSTOM CHART (RECHARTS) */}
             {customChart && (
                <div className="custom-chart-wrapper">
                    {customChart}
                </div>
             )}
           </>
        )}
      </div>

      {/* --- FOOTER --- */}
      {children && (
        <div className="chart-footer-area border-top-subtle">
          {children}
        </div>
      )}

      {/* --- LOGIC MODAL (LAZY LOADED) --- */}
      {/* Wrapped in Suspense so the 'syntax' chunk loads only when showLogic is true */}
      <Suspense fallback={null}>
        {showLogic && (
          <LogicModal 
            isOpen={showLogic} 
            onClose={() => setShowLogic(false)} 
            title={title}
            dagCode={sqlCode} 
            dbtCode={dbtCode} 
            dbtYml={dbtYml}
          />
        )}
      </Suspense>
    </div>
  );
};

export default InspectorCard;
