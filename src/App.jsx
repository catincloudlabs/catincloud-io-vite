return (
    <div className="app-container">
      
      <div className="sticky-header-group">
        <Header />
        <GlobalControlBar 
          dates={chaosMeta?.available_dates || []} selectedDate={selectedDate} onDateChange={setSelectedDate}
          availableTickers={WATCHLIST} selectedTicker={selectedTicker} onTickerChange={setSelectedTicker}
        />
      </div>

      <main className="bento-grid">
        
        {/* ROW 1: KPI STRIP */}
        <div className="span-4 metric-strip">
           <MetricCard title="Market Sentiment" value={(Math.random() * 100).toFixed(0)} subValue="Fear / Greed Index" icon={<TrendingUp size={16} className="text-accent" />} />
           <MetricCard title="Whale Flow" value={whaleMetric.value} subValue={whaleMetric.sub} icon={<Activity size={16} className={getSentimentColor(whaleMetric.isBullish)} />} />
           <MetricCard title="Max Volatility" value={chaosMetric.value} subValue={chaosMetric.sub} icon={<Zap size={16} className={getRiskColor(chaosMetric.isExtreme)} />} />
           <MetricCard title="Mag 7 Leader" value={magLeaderMetric.value} subValue={magLeaderMetric.sub} icon={magLeaderMetric.isPositive ? <ArrowUpRight size={16} className={getMomentumColor(true)}/> : <ArrowDownRight size={16} className={getMomentumColor(false)}/>} />
        </div>

        {/* ROW 2: MACRO CONTEXT (AI Map + Risk Radar) */}
        {/* We use span-2 for both to create a 50/50 split */}
        
        {/* 2A: MARKET PSYCHOLOGY MAP (Moved Up) */}
        <div className="span-2 h-tall">
           <InspectorCard 
             title="Market Psychology Map"
             tag="AI MODEL"
             desc={mapMeta ? `t-SNE Clustering of ${mapMeta.inspector?.description || 'Market News'}` : "Loading AI Model..."}
             sqlCode={mapMeta?.inspector?.sql_logic}
             dbtCode={mapMeta?.inspector?.dbt_logic}
             dbtYml={mapMeta?.inspector?.dbt_yml}
             // Render the Custom Map
             customChart={<MarketPsychologyMap onMetaLoaded={setMapMeta} />}
           />
        </div>

        {/* 2B: RISK / MOMENTUM (Moved to align with Map) */}
        <div className="span-2 h-tall">
            <InspectorCard 
              {...sidebarProps} 
              headerControls={
                  <div className="header-tabs">
                      <button className={`header-tab-btn ${sidebarTab === 'risk' ? 'active' : ''}`} onClick={() => setSidebarTab('risk')}>Risk</button>
                      <button className={`header-tab-btn ${sidebarTab === 'momentum' ? 'active' : ''}`} onClick={() => setSidebarTab('momentum')}>Trend</button>
                  </div>
              }
            >
               {sidebarTab === 'momentum' && (
                 <div className="ticker-controls-compact">
                    <span className="text-muted text-sm">Showing All 7</span>
                 </div>
               )}
            </InspectorCard>
        </div>

        {/* ROW 3: MICRO DATA (Whales + Chaos) */}
        
        {/* 3A: WHALE HUNTER (Table) */}
        <div className="span-2 h-standard"> 
           <InspectorCard 
             title={whaleData?.meta.title || "Whale Hunter"} tag="Flow" desc={whaleData?.meta.inspector.description}
             isLoading={whaleLoading} chartType="table" tableData={whaleData?.data}
             sqlCode={whaleData?.meta.inspector.sql_logic} dbtCode={whaleData?.meta.inspector.dbt_logic} dbtYml={whaleData?.meta.inspector.dbt_yml} 
           />
        </div>

        {/* 3B: CHAOS MAP (Specific Ticker) */}
        <div className="span-2 h-standard">
           <InspectorCard 
             title={`Chaos Map: ${selectedTicker}`} tag="Gamma" desc={chaosMeta?.inspector.description}
             isLoading={chaosLoading} chartType="scatter" plotData={getFilteredChaosPlot()} plotLayout={scatterLayout}
             sqlCode={chaosMeta?.inspector.sql_logic} dbtCode={chaosMeta?.inspector.dbt_logic} dbtYml={chaosMeta?.inspector.dbt_yml} 
           />
        </div>

      </main>
      <Footer />
    </div>
  );
