export interface ConversionResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: Date;
  source: 'google' | 'exchangerate-api' | 'fixer' | 'currencylayer' | 'fallback';
  metadata?: {
    method?: string;
    selector?: string;
    precision?: 'high' | 'standard';
    symbol?: string;
  };
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export interface ConversionOptions {
  amount?: number;
  timeout?: number;
  retries?: number;
  source?: 'google' | 'exchangerate-api' | 'fixer' | 'auto';
}

export interface ApiError {
  message: string;
  code: string;
  source: string;
  debugInfo?: {
    url?: string;
    htmlSnippet?: string;
    methodAttempted?: string[];
  };
}

export type CurrencyCode = keyof PopularCurrencies | (string & {});

export interface PopularCurrencies {
  // --- G10 & Global Reserve ---
  USD: 'US Dollar';
  EUR: 'Euro';
  GBP: 'British Pound';
  JPY: 'Japanese Yen';
  AUD: 'Australian Dollar';
  CAD: 'Canadian Dollar';
  CHF: 'Swiss Franc';
  CNY: 'Chinese Yuan';
  INR: 'Indian Rupee';
  NZD: 'New Zealand Dollar';

  // --- Europe (Active 2026) ---
  SEK: 'Swedish Krona';
  NOK: 'Norwegian Krone';
  DKK: 'Danish Krone';
  PLN: 'Polish Zloty';
  CZK: 'Czech Koruna';
  HUF: 'Hungarian Forint';
  RON: 'Romanian Leu';
  RSD: 'Serbian Dinar';
  ALL: 'Albanian Lek';
  MKD: 'Macedonian Denar';
  BAM: 'Bosnia-Herzegovina Convertible Mark';
  ISK: 'Icelandic Krona';
  UAH: 'Ukrainian Hryvnia';
  GEL: 'Georgian Lari';
  AMD: 'Armenian Dram';
  AZN: 'Azerbaijani Manat';
  TRY: 'Turkish Lira';
  RUB: 'Russian Ruble';

  // --- Asia & Pacific ---
  SGD: 'Singapore Dollar';
  HKD: 'Hong Kong Dollar';
  KRW: 'South Korean Won';
  TWD: 'New Taiwan Dollar';
  THB: 'Thai Baht';
  MYR: 'Malaysian Ringgit';
  IDR: 'Indonesian Rupiah';
  PHP: 'Philippine Peso';
  VND: 'Vietnamese Dong';
  PKR: 'Pakistani Rupee';
  BDT: 'Bangladeshi Taka';
  LKR: 'Sri Lankan Rupee';
  NPR: 'Nepalese Rupee';
  AED: 'UAE Dirham';
  SAR: 'Saudi Riyal';
  QAR: 'Qatari Riyal';
  KWD: 'Kuwaiti Dinar';
  BHD: 'Bahraini Dinar';
  OMR: 'Omani Rial';
  ILS: 'Israeli New Shekel';
  KZT: 'Kazakhstani Tenge';
  UZS: 'Uzbekistan Som';

  // --- Americas ---
  MXN: 'Mexican Peso';
  BRL: 'Brazilian Real';
  CLP: 'Chilean Peso';
  COP: 'Colombian Peso';
  ARS: 'Argentine Peso';
  UYU: 'Uruguayan Peso';
  PEN: 'Peruvian Sol';
  XCD: 'East Caribbean Dollar';
  XCG: 'Caribbean Guilder'; // New 2026 standard for Curaçao/Sint Maarten

  // --- Africa ---
  ZAR: 'South African Rand';
  EGP: 'Egyptian Pound';
  NGN: 'Nigerian Naira';
  KES: 'Kenyan Shilling';
  GHS: 'Ghanaian Cedi';
  MAD: 'Moroccan Dirham';
  DZD: 'Algerian Dinar';
  ZWG: 'Zimbabwe Gold'; // The official 2026 successor to ZWL
  ETB: 'Ethiopian Birr';
  TZS: 'Tanzanian Shilling';
  UGX: 'Ugandan Shilling';
  MUR: 'Mauritian Rupee';

  // --- Territorial & Niche ---
  GIP: 'Gibraltar Pound';
  JEP: 'Jersey Pound';
  IMP: 'Isle of Man Pound';
  FJD: 'Fijian Dollar';
  PGK: 'Papua New Guinean Kina';
}

// --- Crypto Types ---

export interface CryptoConversionResult {
  from: string;
  to: string;
  amount: number;
  result: number;
  rate: number;
  timestamp: Date;
  source: 'google' | 'coinpaprika' | 'cache';
  conversionType: 'crypto-to-fiat' | 'fiat-to-crypto' | 'crypto-to-crypto';
  metadata?: {
    method?: string;
    precision?: 'high' | 'standard';
    marketCap?: number;
    volume24h?: number;
    change24h?: number;
  };
}

export interface CryptoConversionOptions {
  amount?: number;
  timeout?: number;
  source?: 'google' | 'coinpaprika' | 'auto';
}

export type CryptoCode = keyof typeof PopularCryptocurrencies | (string & {});

export const PopularCryptocurrencies = {
  // --- Top Market / Core ---
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  BNB: 'BNB',
  XRP: 'XRP',
  SOL: 'Solana',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  AVAX: 'Avalanche',
  DOT: 'Polkadot',
  TRX: 'TRON',
  TON: 'Toncoin',

  // --- Stablecoins ---
  USDT: 'Tether',
  USDC: 'USD Coin',
  DAI: 'Dai',
  FDUSD: 'First Digital USD',
  TUSD: 'TrueUSD',

  // --- Layer 1 / Infra ---
  LINK: 'Chainlink',
  MATIC: 'Polygon',
  LTC: 'Litecoin',
  XLM: 'Stellar',
  ALGO: 'Algorand',
  NEAR: 'NEAR Protocol',
  ATOM: 'Cosmos',
  ICP: 'Internet Computer',
  HBAR: 'Hedera',
  VET: 'VeChain',
  EGLD: 'MultiversX',
  XTZ: 'Tezos',
  FLOW: 'Flow',
  FIL: 'Filecoin',

  // --- Layer 2 / Scaling ---
  ARB: 'Arbitrum',
  OP: 'Optimism',
  STRK: 'Starknet',

  // --- DeFi ---
  UNI: 'Uniswap',
  AAVE: 'Aave',
  MKR: 'Maker',
  SNX: 'Synthetix',
  COMP: 'Compound',
  CRV: 'Curve DAO Token',
  LDO: 'Lido DAO',
  GRT: 'The Graph',

  // --- Gaming / Metaverse ---
  SAND: 'The Sandbox',
  MANA: 'Decentraland',
  AXS: 'Axie Infinity',

  // --- Meme / Community ---
  SHIB: 'Shiba Inu',

  // --- Exchange Tokens ---
  CRO: 'Cronos',
  OKB: 'OKB',
  HT: 'Huobi Token',
  KCS: 'KuCoin Token',

  // --- Emerging / Trending ---
  APT: 'Aptos',
  SUI: 'Sui',
  SEI: 'Sei',
  TIA: 'Celestia',
  PYTH: 'Pyth Network',
  JUP: 'Jupiter',
} as const;

export type CryptoSymbol = keyof typeof PopularCryptocurrencies;
export type CryptoName = typeof PopularCryptocurrencies[CryptoSymbol];