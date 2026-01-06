import React, { useState, Suspense, lazy } from 'react';

// --- CUSTOM PLOTLY BUNDLE ---
import Plotly from '../lib/plotly-custom'; 
import createPlotlyComponent from 'react-plotly.js/factory';
const Plot = createPlotlyComponent(Plotly);

import { FileCode, Activity } from 'lucide-react'; 
import DataErrorFallback from './DataErrorFallback'; // New Import

// --- LAZY LOAD HEAVY LOGIC ---
const LogicModal = lazy(() => import('./LogicModal'));

const InspectorCard = ({ 
  className,
  title, 
  tag, 
  desc, 
  chartType, 
  isLoading, 
  error,        // New Prop
  onRetry,      // New Prop
  plotData, 
  plotLayout, 
  tableData,
  customChart,
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
        
        {/* 1. LEFT: Identity (Hidden on Mobile) */}
        <div className="panel-header-identity">
          {isLoading && <Activity className="spin-slow" size={16} color="#64748b"/>}
          
          <div className="panel-title">
             <div className="panel-title-text">{title}</div>
          </div>
          
          {tag && (
            <span className={`tag ${tag === 'RISK' ? 'tag-red' : 'tag-blue'}`}>
              {tag}
            </span>
          )}
        </div>
        
        {/* 2. RIGHT: Insight & Utility (Split on Mobile) */}
        <div className="panel-header-controls"> 
            
            {/* A. The Metric */}
            {headerControls && (
                <div className="header-tabs-wrapper">
                    {headerControls}
                </div>
            )}

            {/* Divider (Hidden on Mobile) */}
            {headerControls && hasLogic && (
                <div className="vertical-divider"></div>
            )}

            {/* B. The Logic Button */}
            {hasLogic && (
            <button 
                className="nav-link panel-toggle-btn logic-inspector-btn"
                onClick={() => setShowLogic(true)}
                disabled={isLoading || !!error} // Disable if error
                title="Inspect Data Pipeline Logic"
            >
                <div className="logic-btn-inner">
                    <FileCode size={18} className="hover:text-slate-600 transition-colors" />
                </div>
            </button>
            )}
        </div>
      </div>

      <p className="panel-desc">{desc}</p>

      {/* --- CONTENT AREA --- */}
      <div className="chart-box chart-content-area relative">
        
        {/* 1. LOADING STATE */}
        {isLoading && !error && (
            <div className="loading-overlay">
                <div className="scan-line"></div>
            </div>
        )}

        {/* 2. ERROR STATE (New) */}
        {error && (
            <DataErrorFallback errorType={error} onRetry={onRetry} />
        )}

        {/* 3. DATA STATE */}
        {!isLoading && !error && (
            <>
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
                          <td data-label="TICKER" className="table-cell-padding font-bold text-accent">
                             {row.ticker}
                          </td>
                          <td data-label="STRIKE" className="table-cell-padding">
                             {row.strike}
                          </td>
                          <td data-label="EXPIRY" className="table-cell-padding text-muted text-sm">
                             {row.expiry}
                          </td>
                          <td data-label="TYPE" className={`table-cell-padding font-bold ${isCall(row.type) ? 'text-green' : 'text-red'}`}>
                             {row.type}
                          </td>
                          <td data-label="PREMIUM" className="table-cell-padding text-right font-mono text-white">
                            ${(row.premium / 1000000).toFixed(1)}M
                          </td>
                          <td data-label="SENTIMENT" className="table-cell-padding text-right">
                             <span className={`sentiment-pill ${row.sentiment === 'Bullish' ? 'pill-green' : 'pill-red'}`}>
                                {row.sentiment}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {customChart && (
                 <div className="custom-chart-wrapper">
                     {customChart}
                 </div>
              )}
            </>
        )}
      </div>

      {children && (
        <div className="chart-footer-area border-top-subtle">
          {children}
        </div>
      )}

      <Suspense fallback={null}>
        {showLogic && (
          <LogicModal 
            isOpen={showLogic} 
            onClose={() => setShowLogic(false)} 
            title={title}
            tag={tag}
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
