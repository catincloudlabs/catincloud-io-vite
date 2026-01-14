// src/utils/sectorMap.ts

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
  Utilities: "Utilities",
  RealEstate: "Real Estate",
  Indices: "Market Indices",
  Other: "Other" 
};

export const SECTOR_MAP: Record<string, string> = {
  // --- CUSTOM HIGH CONVICTION (Crypto, AI, Space) ---
  COIN: 'Financials', HOOD: 'Financials', ARES: 'Financials', 
  MSTR: 'Financials', IBIT: 'Financials', MARA: 'Financials',
  PLTR: 'Technology', DELL: 'Technology', WDAY: 'Technology',
  DASH: 'Discretionary', APP: 'Technology', GEV: 'Utilities', 
  SOLV: 'Healthcare', VLTO: 'Industrials', SOUN: 'Technology', 
  IONQ: 'Technology', RKLB: 'Industrials', ASTS: 'Industrials',
  VRT: 'Industrials', VST: 'Utilities', CEG: 'Utilities', 
  NRG: 'Utilities', BABA: 'Discretionary', PDD: 'Discretionary',
  JD: 'Discretionary', BIDU: 'Communications',

  // --- MEGA CAP & TECH ---
  AAPL: 'Technology', MSFT: 'Technology', NVDA: 'Semiconductors',
  GOOGL: 'Communications', GOOG: 'Communications', META: 'Communications',
  AMZN: 'Discretionary', TSLA: 'Discretionary', AVGO: 'Semiconductors',
  ORCL: 'Technology', CRM: 'Technology', ADBE: 'Technology',
  CSCO: 'Technology', ACN: 'Technology', IBM: 'Technology',
  NOW: 'Technology', INTU: 'Technology', QCOM: 'Semiconductors',
  AMD: 'Semiconductors', TXN: 'Semiconductors', INTC: 'Semiconductors',
  AMAT: 'Semiconductors', MU: 'Semiconductors', LRCX: 'Semiconductors',
  ADI: 'Semiconductors', KLAC: 'Semiconductors', MRVL: 'Semiconductors',
  SNPS: 'Technology', CDNS: 'Technology', PANW: 'Technology',
  CRWD: 'Technology', FTNT: 'Technology', ANET: 'Technology',
  APH: 'Technology', MSI: 'Technology', TEL: 'Technology',
  GLW: 'Technology', HPE: 'Technology', HPQ: 'Technology',
  IT: 'Technology', DXC: 'Technology', STX: 'Technology',
  WDC: 'Technology', NTAP: 'Technology', FFIV: 'Technology',
  AKAM: 'Technology', JNPR: 'Technology', TYL: 'Technology',
  FSLR: 'Technology', ENPH: 'Technology', SEDG: 'Technology',
  SMCI: 'Technology', ARM: 'Semiconductors', TSM: 'Semiconductors',
  ASML: 'Semiconductors', ON: 'Semiconductors', MCHP: 'Semiconductors',
  STM: 'Semiconductors', NXP: 'Semiconductors', SWKS: 'Semiconductors',
  QRVO: 'Semiconductors', MPWR: 'Semiconductors', TER: 'Semiconductors',

  // --- FINANCIALS ---
  JPM: 'Financials', V: 'Financials', MA: 'Financials',
  BAC: 'Financials', WFC: 'Financials', MS: 'Financials',
  GS: 'Financials', C: 'Financials', BLK: 'Financials',
  SPGI: 'Financials', AXP: 'Financials', MCO: 'Financials',
  PGR: 'Financials', CB: 'Financials', MMC: 'Financials',
  AON: 'Financials', USB: 'Financials', PNC: 'Financials',
  TFC: 'Financials', COF: 'Financials', DFS: 'Financials',
  PYPL: 'Financials', FI: 'Financials', FIS: 'Financials',
  GPN: 'Financials', BK: 'Financials', STT: 'Financials',
  TROW: 'Financials', NDAQ: 'Financials', ICE: 'Financials',
  CME: 'Financials', CBOE: 'Financials', MSCI: 'Financials',
  SCHW: 'Financials', SBNY: 'Financials', FITB: 'Financials',
  CFG: 'Financials', HBAN: 'Financials', RF: 'Financials',
  KEY: 'Financials', SYF: 'Financials', ALL: 'Financials',
  TRV: 'Financials', HIG: 'Financials', CINF: 'Financials',
  PFG: 'Financials', PRU: 'Financials', MET: 'Financials',
  AFL: 'Financials', AIG: 'Financials', GL: 'Financials',
  WTW: 'Financials', AJG: 'Financials', BRO: 'Financials',
  WRB: 'Financials', RE: 'Financials', AIZ: 'Financials',
  JKHY: 'Financials', BR: 'Financials', 'BRK.B': 'Financials',

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
  NVO: 'Healthcare', IDXX: 'Healthcare', RMD: 'Healthcare',
  WST: 'Healthcare', STE: 'Healthcare', TFX: 'Healthcare',
  COO: 'Healthcare', HOLX: 'Healthcare', WAT: 'Healthcare',
  MTD: 'Healthcare', PKI: 'Healthcare', A: 'Healthcare',
  RVTY: 'Healthcare', LH: 'Healthcare', DGX: 'Healthcare',
  CNC: 'Healthcare', MOH: 'Healthcare', UHS: 'Healthcare',
  CAH: 'Healthcare', COR: 'Healthcare',

  // --- CONSUMER DISCRETIONARY ---
  HD: 'Discretionary', MCD: 'Discretionary', NKE: 'Discretionary',
  SBUX: 'Discretionary', LOW: 'Discretionary', TJX: 'Discretionary',
  BKNG: 'Discretionary', ABNB: 'Discretionary', MAR: 'Discretionary',
  HLT: 'Discretionary', CMG: 'Discretionary', YUM: 'Discretionary',
  LULU: 'Discretionary', F: 'Discretionary', GM: 'Discretionary',
  TSCO: 'Discretionary', ORLY: 'Discretionary', AZO: 'Discretionary',
  ROST: 'Discretionary', DG: 'Discretionary', DLTR: 'Discretionary',
  TGT: 'Discretionary', BBY: 'Discretionary', EBAY: 'Discretionary',
  EXPE: 'Discretionary', RCL: 'Discretionary', CCL: 'Discretionary',
  NCLH: 'Discretionary', MGM: 'Discretionary', CZR: 'Discretionary',
  WYNN: 'Discretionary', LVS: 'Discretionary', DHI: 'Discretionary',
  LEN: 'Discretionary', PHM: 'Discretionary', NVR: 'Discretionary',
  GPC: 'Discretionary', KMX: 'Discretionary', LKQ: 'Discretionary',
  DPZ: 'Discretionary', DRI: 'Discretionary',

  // --- CONSUMER STAPLES ---
  WMT: 'Staples', PG: 'Staples', COST: 'Staples', KO: 'Staples',
  PEP: 'Staples', PM: 'Staples', EL: 'Staples', CL: 'Staples',
  MO: 'Staples', KMB: 'Staples', GIS: 'Staples', MDLZ: 'Staples',
  KHC: 'Staples', KR: 'Staples', SYY: 'Staples', ADM: 'Staples',
  STZ: 'Staples', 'BF.B': 'Staples', TSN: 'Staples', HRL: 'Staples',
  CAG: 'Staples', K: 'Staples', MKC: 'Staples', CLX: 'Staples',
  CHD: 'Staples', SJM: 'Staples', TAP: 'Staples',

  // --- COMMUNICATIONS ---
  DIS: 'Communications', NFLX: 'Communications', CMCSA: 'Communications',
  TMUS: 'Communications', VZ: 'Communications', T: 'Communications',
  CHTR: 'Communications', WBD: 'Communications', PARA: 'Communications',
  FOXA: 'Communications', FOX: 'Communications', NWSA: 'Communications',
  NWS: 'Communications', OMC: 'Communications', IPG: 'Communications',
  TTD: 'Communications', LYV: 'Communications', EA: 'Communications',
  TTWO: 'Communications', ATVI: 'Communications', MTCH: 'Communications',

  // --- INDUSTRIALS ---
  CAT: 'Industrials', DE: 'Industrials', HON: 'Industrials',
  GE: 'Industrials', UNP: 'Industrials', UPS: 'Industrials',
  RTX: 'Industrials', BA: 'Industrials', LMT: 'Industrials',
  ADP: 'Industrials', ITW: 'Industrials', ETN: 'Industrials',
  WM: 'Industrials', MMM: 'Industrials', CSX: 'Industrials',
  NSC: 'Industrials', FDX: 'Industrials', NOC: 'Industrials',
  GD: 'Industrials', EMR: 'Industrials', PH: 'Industrials',
  PCAR: 'Industrials', CMI: 'Industrials', TT: 'Industrials',
  LHX: 'Industrials', TDG: 'Industrials', CARR: 'Industrials',
  OTIS: 'Industrials', ROK: 'Industrials', AME: 'Industrials',
  DAL: 'Industrials', UAL: 'Industrials', AAL: 'Industrials',
  LUV: 'Industrials', JETS: 'Industrials', PAYX: 'Industrials',
  CTAS: 'Industrials', VRSK: 'Industrials', EFX: 'Industrials',
  FAST: 'Industrials', GWW: 'Industrials', URI: 'Industrials',

  // --- ENERGY ---
  XOM: 'Energy', CVX: 'Energy', COP: 'Energy', SLB: 'Energy',
  EOG: 'Energy', MPC: 'Energy', PSX: 'Energy', VLO: 'Energy',
  OXY: 'Energy', HES: 'Energy', KMI: 'Energy', WMB: 'Energy',
  BKR: 'Energy', HAL: 'Energy', DVN: 'Energy', FANG: 'Energy',
  MRO: 'Energy', CTRA: 'Energy', EQT: 'Energy', TRGP: 'Energy',
  OKE: 'Energy', SHEL: 'Energy', EQNR: 'Energy',

  // --- UTILITIES & POWER ---
  NEE: 'Utilities', SO: 'Utilities', DUK: 'Utilities',
  SRE: 'Utilities', AEP: 'Utilities', D: 'Utilities',
  PEG: 'Utilities', EXC: 'Utilities', XEL: 'Utilities',
  ED: 'Utilities', EIX: 'Utilities', WEC: 'Utilities',
  ES: 'Utilities', ETR: 'Utilities', PPL: 'Utilities',
  FE: 'Utilities', CMS: 'Utilities', AWK: 'Utilities',

  // --- REAL ESTATE & DATA CENTERS ---
  PLD: 'Real Estate', AMT: 'Real Estate', EQIX: 'Real Estate',
  CCI: 'Real Estate', PSA: 'Real Estate', O: 'Real Estate',
  DLR: 'Real Estate', SPG: 'Real Estate', WELL: 'Real Estate',
  VICI: 'Real Estate', CSGP: 'Real Estate', AVB: 'Real Estate',
  EQR: 'Real Estate', CBRE: 'Real Estate', WY: 'Real Estate',
  SBAC: 'Real Estate', EXR: 'Real Estate', MAA: 'Real Estate',
  IRM: 'Real Estate', HST: 'Real Estate', VTR: 'Real Estate',

  // --- MATERIALS ---
  LIN: 'Materials', SHW: 'Materials', FCX: 'Materials',
  APD: 'Materials', ECL: 'Materials', NEM: 'Materials',
  DOW: 'Materials', DD: 'Materials', PPG: 'Materials',
  LYB: 'Materials', NUE: 'Materials', STLD: 'Materials',
  MLM: 'Materials', VMC: 'Materials', ALB: 'Materials',
  FMC: 'Materials', MOS: 'Materials', CTVA: 'Materials',
  CF: 'Materials', IFF: 'Materials', BALL: 'Materials',

  // --- INDICES & ETFs ---
  SPY: 'Indices', QQQ: 'Indices', IWM: 'Indices', DIA: 'Indices',
  VTI: 'Indices', VOO: 'Indices', GLD: 'Indices', SLV: 'Indices',
  USO: 'Indices', UNG: 'Indices', TLT: 'Indices', HYG: 'Indices'
};

export function getSectorForTicker(ticker: string): string {
    return SECTOR_MAP[ticker] || "Other";
}

export function getSectorLabel(sectorId: string): string {
    return SECTOR_NAMES[sectorId] || sectorId;
}
