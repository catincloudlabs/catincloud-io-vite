// src/utils/sectorMap.ts

// The keys are the internal IDs, the values are the labels.
// Since we are switching to human-readable IDs, this acts mostly as a reference list now.
export const SECTOR_NAMES: Record<string, string> = {
  Technology: "Technology",
  Semiconductors: "Semiconductors",
  Financials: "Financials",
  Discretionary: "Discretionary",
  Staples: "Staples",
  Healthcare: "Healthcare",
  Communications: "Communications",
  Energy: "Energy",
  Industrials: "Industrials",
  Materials: "Materials",
  RealEstate: "Real Estate",
  Indices: "Market Indices",
  Other: "Other" 
};

export const SECTOR_MAP: Record<string, string> = {
  // --- MAG 7 & MEGA TECH ---
  AAPL: 'Technology', 
  NVDA: 'Semiconductors', 
  MSFT: 'Technology', 
  GOOGL: 'Communications', 
  AMZN: 'Discretionary', 
  META: 'Communications', 
  TSLA: 'Discretionary', 
  AVGO: 'Semiconductors',
  
  // --- SEMICONDUCTORS ---
  AMD: 'Semiconductors', QCOM: 'Semiconductors', TXN: 'Semiconductors', 
  INTC: 'Semiconductors', AMAT: 'Semiconductors', MU: 'Semiconductors', 
  LRCX: 'Semiconductors', ADI: 'Semiconductors', KLAC: 'Semiconductors', 
  MRVL: 'Semiconductors', TSM: 'Semiconductors', ASML: 'Semiconductors', 
  ON: 'Semiconductors', MCHP: 'Semiconductors', STM: 'Semiconductors',
  ARM: 'Semiconductors', MP: 'Semiconductors',
  
  // --- SOFTWARE & CLOUD ---
  ORCL: 'Technology', ADBE: 'Technology', CRM: 'Technology', 
  INTU: 'Technology', IBM: 'Technology', NOW: 'Technology', 
  UBER: 'Discretionary', SAP: 'Technology', FI: 'Financials', 
  ADP: 'Industrials', ACN: 'Technology', CSCO: 'Technology', 
  SQ: 'Financials', SHOP: 'Discretionary', WDAY: 'Technology',
  SNOW: 'Technology', TEAM: 'Technology', ADSK: 'Technology', 
  DDOG: 'Technology', ZM: 'Technology', NET: 'Technology', 
  TTD: 'Communications', MDB: 'Technology', ZS: 'Technology', 
  GIB: 'Technology', FICO: 'Financials', ANET: 'Technology', 
  ESTC: 'Technology', PANW: 'Technology', CRWD: 'Technology',
  PLTR: 'Technology', SMCI: 'Technology', SNPS: 'Technology', 
  CDNS: 'Technology',
  
  // --- FINANCIALS ---
  JPM: 'Financials', V: 'Financials', MA: 'Financials', 
  BAC: 'Financials', WFC: 'Financials', MS: 'Financials', 
  GS: 'Financials', C: 'Financials', BLK: 'Financials', 
  SPGI: 'Financials', AXP: 'Financials', MCO: 'Financials', 
  PGR: 'Financials', CB: 'Financials', MMC: 'Financials',
  AON: 'Financials', USB: 'Financials', PNC: 'Financials', 
  TFC: 'Financials', COF: 'Financials', DFS: 'Financials', 
  PYPL: 'Financials', AFRM: 'Financials', HOOD: 'Financials', 
  COIN: 'Financials', KKR: 'Financials', BX: 'Financials', 
  APO: 'Financials', TRV: 'Financials', ALL: 'Financials',
  HIG: 'Financials', MET: 'Financials', 'BRK.B': 'Financials', 
  BRK: 'Financials',
  
  // --- HEALTHCARE ---
  LLY: 'Healthcare', UNH: 'Healthcare', JNJ: 'Healthcare', 
  ABBV: 'Healthcare', MRK: 'Healthcare', TMO: 'Healthcare', 
  ABT: 'Healthcare', DHR: 'Healthcare', PFE: 'Healthcare', 
  AMGN: 'Healthcare', ISRG: 'Healthcare', ELV: 'Healthcare', 
  VRTX: 'Healthcare', REGN: 'Healthcare', ZTS: 'Healthcare',
  BSX: 'Healthcare', BDX: 'Healthcare', GILD: 'Healthcare', 
  HCA: 'Healthcare', MCK: 'Healthcare', CI: 'Healthcare', 
  HUM: 'Healthcare', CVS: 'Healthcare', BMY: 'Healthcare', 
  SYK: 'Healthcare', EW: 'Healthcare', MDT: 'Healthcare', 
  DXCM: 'Healthcare', ILMN: 'Healthcare', ALGN: 'Healthcare',
  BIIB: 'Healthcare', MRNA: 'Healthcare', BNTX: 'Healthcare',
  
  // --- CONSUMER & RETAIL ---
  WMT: 'Staples', PG: 'Staples', COST: 'Staples', 
  HD: 'Discretionary', KO: 'Staples', PEP: 'Staples', 
  MCD: 'Discretionary', DIS: 'Communications', NKE: 'Discretionary', 
  SBUX: 'Discretionary', LOW: 'Discretionary', PM: 'Staples', 
  TGT: 'Staples', TJX: 'Discretionary', EL: 'Staples',
  CL: 'Staples', MO: 'Staples', LULU: 'Discretionary', 
  CMG: 'Discretionary', MAR: 'Discretionary', BKNG: 'Discretionary', 
  ABNB: 'Discretionary', HLT: 'Discretionary', YUM: 'Discretionary', 
  DE: 'Industrials',
  
  // --- INDUSTRIALS ---
  CAT: 'Industrials', HON: 'Industrials', GE: 'Industrials', 
  MMM: 'Industrials', ETN: 'Industrials', ITW: 'Industrials', 
  EMR: 'Industrials', PH: 'Industrials', CMI: 'Industrials', 
  PCAR: 'Industrials', TT: 'Industrials', LMT: 'Industrials', 
  RTX: 'Industrials', BA: 'Industrials', GD: 'Industrials',
  NOC: 'Industrials', LHX: 'Industrials', TDG: 'Industrials', 
  WM: 'Industrials', RSG: 'Industrials', UNP: 'Industrials', 
  CSX: 'Industrials', NSC: 'Industrials', DAL: 'Industrials', 
  UAL: 'Industrials', AAL: 'Industrials', LUV: 'Industrials', 
  FDX: 'Industrials', UPS: 'Industrials',
  
  // --- ENERGY ---
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy', 
  EOG: 'Energy', MPC: 'Energy', PSX: 'Energy', VLO: 'Energy', 
  OXY: 'Energy', HES: 'Energy', KMI: 'Energy', WMB: 'Energy', 
  SHEL: 'Energy', EQNR: 'Energy',
  
  // --- INDICES & ETFs ---
  SPY: 'Indices', QQQ: 'Indices', IWM: 'Indices'
};

/**
 * Helper to safely resolve a sector ID (e.g., "Technology") from a ticker.
 * If the ticker is unknown, returns "Other".
 */
export function getSectorForTicker(ticker: string): string {
    return SECTOR_MAP[ticker] || "Other";
}

/**
 * Helper to get the Human Readable name.
 * Now largely a pass-through since IDs are readable, but maintained for compatibility.
 */
export function getSectorLabel(sectorId: string): string {
    return SECTOR_NAMES[sectorId] || sectorId;
}
