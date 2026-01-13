// src/utils/sectorMap.ts

export const SECTOR_NAMES: Record<string, string> = {
  XLK: "Tech",
  SMH: "Semis",
  XLF: "Financials",
  XLY: "Discretionary",
  XLP: "Staples",
  XLV: "Healthcare",
  XLC: "Comms",
  XLE: "Energy",
  XLI: "Industrials",
  XLB: "Materials",
  XLRE: "Real Estate",
  SPY: "Broad Market",
  QQQ: "Nasdaq-100",
  IWM: "Small Caps",
  Other: "Other" 
};

export const SECTOR_MAP: Record<string, string> = {
  // --- MAG 7 & MEGA TECH ---
  AAPL: 'XLK', NVDA: 'SMH', MSFT: 'XLK', GOOGL: 'XLC', AMZN: 'XLY', 
  META: 'XLC', TSLA: 'XLY', AVGO: 'SMH',
  
  // --- SEMICONDUCTORS (SMH) ---
  AMD: 'SMH', QCOM: 'SMH', TXN: 'SMH', INTC: 'SMH', AMAT: 'SMH', 
  MU: 'SMH', LRCX: 'SMH', ADI: 'SMH', KLAC: 'SMH', MRVL: 'SMH',
  TSM: 'SMH', ASML: 'SMH', ON: 'SMH', MCHP: 'SMH', STM: 'SMH',
  ARM: 'SMH', MP: 'SMH',
  
  // --- SOFTWARE & CLOUD (XLK/IGV) ---
  ORCL: 'XLK', ADBE: 'XLK', CRM: 'XLK', INTU: 'XLK', IBM: 'XLK',
  NOW: 'XLK', UBER: 'XLY', SAP: 'XLK', FI: 'XLF', ADP: 'XLI',
  ACN: 'XLK', CSCO: 'XLK', SQ: 'XLF', SHOP: 'XLY', WDAY: 'XLK',
  SNOW: 'XLK', TEAM: 'XLK', ADSK: 'XLK', DDOG: 'XLK', ZM: 'XLK',
  NET: 'XLK', TTD: 'XLC', MDB: 'XLK', ZS: 'XLK', GIB: 'XLK',
  FICO: 'XLF', ANET: 'XLK', ESTC: 'XLK', PANW: 'XLK', CRWD: 'XLK',
  PLTR: 'XLK', SMCI: 'XLK', SNPS: 'XLK', CDNS: 'XLK',
  
  // --- FINANCIALS (XLF) ---
  JPM: 'XLF', V: 'XLF', MA: 'XLF', BAC: 'XLF', WFC: 'XLF',
  MS: 'XLF', GS: 'XLF', C: 'XLF', BLK: 'XLF', SPGI: 'XLF',
  AXP: 'XLF', MCO: 'XLF', PGR: 'XLF', CB: 'XLF', MMC: 'XLF',
  AON: 'XLF', USB: 'XLF', PNC: 'XLF', TFC: 'XLF', COF: 'XLF',
  DFS: 'XLF', PYPL: 'XLF', AFRM: 'XLF', HOOD: 'XLF', COIN: 'XLF',
  KKR: 'XLF', BX: 'XLF', APO: 'XLF', TRV: 'XLF', ALL: 'XLF',
  HIG: 'XLF', MET: 'XLF', 'BRK.B': 'XLF', BRK: 'XLF',
  
  // --- HEALTHCARE (XLV) ---
  LLY: 'XLV', UNH: 'XLV', JNJ: 'XLV', ABBV: 'XLV', MRK: 'XLV',
  TMO: 'XLV', ABT: 'XLV', DHR: 'XLV', PFE: 'XLV', AMGN: 'XLV',
  ISRG: 'XLV', ELV: 'XLV', VRTX: 'XLV', REGN: 'XLV', ZTS: 'XLV',
  BSX: 'XLV', BDX: 'XLV', GILD: 'XLV', HCA: 'XLV', MCK: 'XLV',
  CI: 'XLV', HUM: 'XLV', CVS: 'XLV', BMY: 'XLV', SYK: 'XLV',
  EW: 'XLV', MDT: 'XLV', DXCM: 'XLV', ILMN: 'XLV', ALGN: 'XLV',
  BIIB: 'XLV', MRNA: 'XLV', BNTX: 'XLV',
  
  // --- CONSUMER & RETAIL (XLY / XLP) ---
  WMT: 'XLP', PG: 'XLP', COST: 'XLP', HD: 'XLY', KO: 'XLP',
  PEP: 'XLP', MCD: 'XLY', DIS: 'XLC', NKE: 'XLY', SBUX: 'XLY',
  LOW: 'XLY', PM: 'XLP', TGT: 'XLP', TJX: 'XLY', EL: 'XLP',
  CL: 'XLP', MO: 'XLP', LULU: 'XLY', CMG: 'XLY', MAR: 'XLY',
  BKNG: 'XLY', ABNB: 'XLY', HLT: 'XLY', YUM: 'XLY', DE: 'XLI',
  
  // --- INDUSTRIALS (XLI) ---
  CAT: 'XLI', HON: 'XLI', GE: 'XLI', MMM: 'XLI', ETN: 'XLI',
  ITW: 'XLI', EMR: 'XLI', PH: 'XLI', CMI: 'XLI', PCAR: 'XLI',
  TT: 'XLI', LMT: 'XLI', RTX: 'XLI', BA: 'XLI', GD: 'XLI',
  NOC: 'XLI', LHX: 'XLI', TDG: 'XLI', WM: 'XLI', RSG: 'XLI',
  UNP: 'XLI', CSX: 'XLI', NSC: 'XLI', DAL: 'XLI', UAL: 'XLI',
  AAL: 'XLI', LUV: 'XLI', FDX: 'XLI', UPS: 'XLI',
  
  // --- ENERGY (XLE) ---
  XOM: 'XLE', CVX: 'XLE', COP: 'XLE', SLB: 'XLE', EOG: 'XLE',
  MPC: 'XLE', PSX: 'XLE', VLO: 'XLE', OXY: 'XLE', HES: 'XLE',
  KMI: 'XLE', WMB: 'XLE', SHEL: 'XLE', EQNR: 'XLE',
  
  // --- INDICES & ETFs (Self Reference) ---
  SPY: 'SPY', QQQ: 'QQQ', IWM: 'IWM'
};

/**
 * Helper to safely resolve a sector ID (e.g., "XLK") from a ticker.
 * If the ticker is unknown, returns "Other".
 */
export function getSectorForTicker(ticker: string): string {
    return SECTOR_MAP[ticker] || "Other";
}

/**
 * Helper to get the Human Readable name (e.g., "Tech") from a Sector ID.
 */
export function getSectorLabel(sectorId: string): string {
    return SECTOR_NAMES[sectorId] || sectorId;
}
