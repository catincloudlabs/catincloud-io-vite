// src/utils/sectorMap.ts

// Maps individual tickers to their Sector ETF (The "Captain")
export const SECTOR_MAP: Record<string, string> = {
  // MAG 7 & Big Tech -> Tech (XLK)
  AAPL: 'XLK', NVDA: 'SMH', MSFT: 'XLK', GOOGL: 'XLC', AMZN: 'XLY', 
  META: 'XLC', TSLA: 'XLY', AMD: 'SMH', AVGO: 'SMH', QCOM: 'SMH',
  
  // Semis -> SMH
  INTC: 'SMH', MU: 'SMH', AMAT: 'SMH', LRCX: 'SMH', TSM: 'SMH',

  // Finance -> Financials (XLF)
  JPM: 'XLF', BAC: 'XLF', WFC: 'XLF', C: 'XLF', GS: 'XLF', MS: 'XLF',
  V: 'XLF', MA: 'XLF', BRK: 'XLF', 'BRK.B': 'XLF',

  // Retail/Discretionary -> XLY
  WMT: 'XLP', TGT: 'XLP', COST: 'XLP', HD: 'XLY', LOW: 'XLY', 
  NKE: 'XLY', SBUX: 'XLY', MCD: 'XLY', DIS: 'XLC',

  // Health -> XLV
  LLY: 'XLV', UNH: 'XLV', JNJ: 'XLV', PFE: 'XLV', MRK: 'XLV', ABBV: 'XLV',

  // Industrial/Energy
  CAT: 'XLI', DE: 'XLI', BA: 'XLI', GE: 'XLI',
  XOM: 'XLE', CVX: 'XLE', COP: 'XLE', SLB: 'XLE',
  
  // Indices (Self-referential)
  SPY: 'SPY', QQQ: 'QQQ', IWM: 'IWM'
};

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
  SPY: "Broad Mkt",
  QQQ: "Nasdaq-100"
};
