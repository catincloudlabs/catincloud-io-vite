// src/utils/sectorMap.ts

/* --- SECTOR CLASSIFICATION SYSTEM --- */
/* Maps individual tickers to broader market sectors for visualization groupings */

export const SECTOR_NAMES: Record<string, string> = {
  Technology: "Technology",         // The Growth Engine
  Semiconductors: "Semiconductors", // The Hardware Backbone
  Finance: "Finance",               // Banks, Payments, Insurance
  Consumer: "Consumer",             // Retail, Food, Autos, Leisure
  Healthcare: "Healthcare",         // Pharma, Bio, MedTech
  Energy: "Energy",                 // Oil, Gas, Pipelines
  Industrials: "Industrials",       // Manufacturing, Aerospace, Logistics
  MediaTelco: "Media & Telco",      // Legacy Media, Streaming, Telecoms
  RealEstate: "Real Estate",        // REITs
  Utilities: "Utilities",           // Power & Water
  Indices: "Market Indices",
  Other: "Other" 
};

export const SECTOR_MAP: Record<string, string> = {
  // --- TECHNOLOGY ---
  AAPL: 'Technology', MSFT: 'Technology', GOOGL: 'Technology', GOOG: 'Technology',
  META: 'Technology', AMZN: 'Technology', TSLA: 'Technology', NFLX: 'Technology',
  ORCL: 'Technology', CRM: 'Technology', ADBE: 'Technology', CSCO: 'Technology',
  ACN: 'Technology', IBM: 'Technology', NOW: 'Technology', INTU: 'Technology',
  PLTR: 'Technology', U: 'Technology', AI: 'Technology', RBLX: 'Technology',
  SNPS: 'Technology', CDNS: 'Technology', PANW: 'Technology', CRWD: 'Technology',
  FTNT: 'Technology', ANET: 'Technology', APH: 'Technology', MSI: 'Technology',
  COIN: 'Technology', HOOD: 'Technology', SQ: 'Technology', PYPL: 'Technology',
  MSTR: 'Technology', IBIT: 'Technology', MARA: 'Technology', UPST: 'Technology',
  SOFI: 'Technology', AFRM: 'Technology', DKNG: 'Technology',
  
  // --- SEMICONDUCTORS ---
  NVDA: 'Semiconductors', AMD: 'Semiconductors', AVGO: 'Semiconductors',
  QCOM: 'Semiconductors', INTC: 'Semiconductors', TSM: 'Semiconductors',
  ARM: 'Semiconductors', MU: 'Semiconductors', AMAT: 'Semiconductors',
  LRCX: 'Semiconductors', ADI: 'Semiconductors', KLAC: 'Semiconductors',
  TXN: 'Semiconductors', MRVL: 'Semiconductors', ON: 'Semiconductors',
  MCHP: 'Semiconductors', STM: 'Semiconductors', NXP: 'Semiconductors',
  SWKS: 'Semiconductors', QRVO: 'Semiconductors', MPWR: 'Semiconductors',
  TER: 'Semiconductors', SMH: 'Semiconductors', SOXL: 'Semiconductors',

  // --- CONSUMER ---
  WMT: 'Consumer', COST: 'Consumer', TGT: 'Consumer', HD: 'Consumer',
  LOW: 'Consumer', MCD: 'Consumer', SBUX: 'Consumer', NKE: 'Consumer',
  LULU: 'Consumer', CMG: 'Consumer', TJX: 'Consumer', ROST: 'Consumer',
  KO: 'Consumer', PEP: 'Consumer', PG: 'Consumer', PM: 'Consumer',
  MO: 'Consumer', EL: 'Consumer', CL: 'Consumer', KMB: 'Consumer',
  GIS: 'Consumer', KHC: 'Consumer', KR: 'Consumer', SYY: 'Consumer',
  STZ: 'Consumer', TSN: 'Consumer', HRL: 'Consumer', CAG: 'Consumer',
  F: 'Consumer', GM: 'Consumer', HMC: 'Consumer', TM: 'Consumer',
  BKNG: 'Consumer', ABNB: 'Consumer', MAR: 'Consumer', HLT: 'Consumer',
  RCL: 'Consumer', CCL: 'Consumer', NCLH: 'Consumer', MGM: 'Consumer',
  CZR: 'Consumer', WYNN: 'Consumer', LVS: 'Consumer', DHI: 'Consumer',
  LEN: 'Consumer', EBAY: 'Consumer', ETSY: 'Consumer', CHWY: 'Consumer',
  PTON: 'Consumer', GME: 'Consumer', AMC: 'Consumer',

  // --- FINANCE ---
  JPM: 'Finance', BAC: 'Finance', WFC: 'Finance', C: 'Finance',
  GS: 'Finance', MS: 'Finance', BLK: 'Finance', SCHW: 'Finance',
  AXP: 'Finance', V: 'Finance', MA: 'Finance', 
  BR: 'Finance', 'BRK.B': 'Finance', SPGI: 'Finance', MCO: 'Finance',
  PGR: 'Finance', CB: 'Finance', MMC: 'Finance', AON: 'Finance',
  USB: 'Finance', PNC: 'Finance', TFC: 'Finance', COF: 'Finance',
  DFS: 'Finance', BK: 'Finance', STT: 'Finance', TROW: 'Finance',
  ICE: 'Finance', CME: 'Finance', CBOE: 'Finance', NDAQ: 'Finance',
  AIG: 'Finance', ALL: 'Finance', TRV: 'Finance', ARES: 'Finance',

  // --- HEALTHCARE ---
  LLY: 'Healthcare', UNH: 'Healthcare', JNJ: 'Healthcare', ABBV: 'Healthcare',
  MRK: 'Healthcare', TMO: 'Healthcare', ABT: 'Healthcare', DHR: 'Healthcare',
  PFE: 'Healthcare', AMGN: 'Healthcare', ISRG: 'Healthcare', ELV: 'Healthcare',
  VRTX: 'Healthcare', REGN: 'Healthcare', ZTS: 'Healthcare', BSX: 'Healthcare',
  BDX: 'Healthcare', GILD: 'Healthcare', HCA: 'Healthcare', MCK: 'Healthcare',
  CI: 'Healthcare', HUM: 'Healthcare', CVS: 'Healthcare', BMY: 'Healthcare',
  SYK: 'Healthcare', EW: 'Healthcare', MDT: 'Healthcare', DXCM: 'Healthcare',
  ILMN: 'Healthcare', ALGN: 'Healthcare', BIIB: 'Healthcare', MRNA: 'Healthcare',
  HIMS: 'Healthcare', SOLV: 'Healthcare', RVTY: 'Healthcare',

  // --- INDUSTRIALS ---
  CAT: 'Industrials', DE: 'Industrials', HON: 'Industrials', GE: 'Industrials',
  UNP: 'Industrials', UPS: 'Industrials', FDX: 'Industrials', RTX: 'Industrials',
  BA: 'Industrials', LMT: 'Industrials', NOC: 'Industrials', GD: 'Industrials',
  ADP: 'Industrials', ITW: 'Industrials', ETN: 'Industrials', WM: 'Industrials',
  MMM: 'Industrials', CSX: 'Industrials', NSC: 'Industrials', EMR: 'Industrials',
  PH: 'Industrials', PCAR: 'Industrials', CMI: 'Industrials', TT: 'Industrials',
  LHX: 'Industrials', TDG: 'Industrials', CARR: 'Industrials', OTIS: 'Industrials',
  DAL: 'Industrials', UAL: 'Industrials', AAL: 'Industrials', LUV: 'Industrials',
  RKLB: 'Industrials', SPCE: 'Industrials', LUNR: 'Industrials',
  ASTS: 'Industrials',

  // --- ENERGY ---
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy',
  EOG: 'Energy', MPC: 'Energy', PSX: 'Energy', VLO: 'Energy',
  OXY: 'Energy', HES: 'Energy', KMI: 'Energy', WMB: 'Energy',
  BKR: 'Energy', HAL: 'Energy', DVN: 'Energy', FANG: 'Energy',
  MRO: 'Energy', CTRA: 'Energy', EQT: 'Energy', TRGP: 'Energy',
  OKE: 'Energy', SHEL: 'Energy', EQNR: 'Energy',

  // --- MEDIA & TELCO ---
  DIS: 'MediaTelco', CMCSA: 'MediaTelco', TMUS: 'MediaTelco',
  VZ: 'MediaTelco', T: 'MediaTelco', CHTR: 'MediaTelco',
  WBD: 'MediaTelco', PARA: 'MediaTelco', FOXA: 'MediaTelco',
  FOX: 'MediaTelco', NWSA: 'MediaTelco', NWS: 'MediaTelco',
  OMC: 'MediaTelco', IPG: 'MediaTelco', LYV: 'MediaTelco',
  TTWO: 'MediaTelco', EA: 'MediaTelco', MTCH: 'MediaTelco',
  DJT: 'MediaTelco', RDDT: 'MediaTelco',

  // --- REAL ESTATE ---
  PLD: 'Real Estate', AMT: 'Real Estate', EQIX: 'Real Estate',
  CCI: 'Real Estate', PSA: 'Real Estate', O: 'Real Estate',
  DLR: 'Real Estate', SPG: 'Real Estate', WELL: 'Real Estate',
  VICI: 'Real Estate', CSGP: 'Real Estate', AVB: 'Real Estate',
  EQR: 'Real Estate', CBRE: 'Real Estate', WY: 'Real Estate',
  OPEN: 'Real Estate', Z: 'Real Estate', RDFN: 'Real Estate',

  // --- UTILITIES ---
  NEE: 'Utilities', SO: 'Utilities', DUK: 'Utilities', SRE: 'Utilities',
  AEP: 'Utilities', D: 'Utilities', PEG: 'Utilities', EXC: 'Utilities',
  XEL: 'Utilities', ED: 'Utilities', EIX: 'Utilities', WEC: 'Utilities',
  ES: 'Utilities', ETR: 'Utilities', PPL: 'Utilities', FE: 'Utilities',
  CMS: 'Utilities', AWK: 'Utilities', VST: 'Utilities', CEG: 'Utilities',
  NRG: 'Utilities', GEV: 'Utilities',

  // --- MATERIALS ---
  LIN: 'Industrials', SHW: 'Industrials', 
  FCX: 'Industrials', APD: 'Industrials', NEM: 'Industrials',
  DOW: 'Industrials', DD: 'Industrials', PPG: 'Industrials',
  NUE: 'Industrials', AA: 'Industrials',

  // --- INDICES ---
  SPY: 'Indices', QQQ: 'Indices', IWM: 'Indices', DIA: 'Indices',
  VTI: 'Indices', VOO: 'Indices', GLD: 'Indices', SLV: 'Indices',
  USO: 'Indices', UNG: 'Indices', TLT: 'Indices', HYG: 'Indices',
  VIXY: 'Indices', UVXY: 'Indices'
};

export function getSectorForTicker(ticker: string): string {
    return SECTOR_MAP[ticker] || "Other";
}

export function getSectorLabel(sectorId: string): string {
    return SECTOR_NAMES[sectorId] || sectorId;
}
