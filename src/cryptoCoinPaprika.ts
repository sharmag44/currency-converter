import axios from 'axios';
import { CryptoConversionResult } from './types';

// Map common crypto symbols to CoinPaprika IDs
const COINPAPRIKA_ID_MAP: Record<string, string> = {
  BTC: 'btc-bitcoin',
  ETH: 'eth-ethereum',
  SOL: 'sol-solana',
  BNB: 'bnb-binance-coin',
  XRP: 'xrp-xrp',
  ADA: 'ada-cardano',
  DOGE: 'doge-dogecoin',
  AVAX: 'avax-avalanche',
  DOT: 'dot-polkadot',
  LINK: 'link-chainlink',
  MATIC: 'matic-polygon',
  SHIB: 'shib-shiba-inu',
  LTC: 'ltc-litecoin',
  UNI: 'uni-uniswap',
  ATOM: 'atom-cosmos',
  XLM: 'xlm-stellar',
  ALGO: 'algo-algorand',
  NEAR: 'near-near-protocol',
  APT: 'apt-aptos',
  SUI: 'sui-sui',
  ARB: 'arb-arbitrum',
  OP: 'op-optimism',
  FIL: 'fil-filecoin',
  AAVE: 'aave-new',
  GRT: 'grt-the-graph',
  SAND: 'sand-the-sandbox',
  MANA: 'mana-decentraland',
  AXS: 'axs-axie-infinity',
  CRO: 'cro-cronos',
  TRX: 'trx-tron',
};

export class CoinPaprikaScraper {
  private readonly baseUrl = 'https://api.coinpaprika.com/v1';
  private readonly userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  /**
   * Get the USD price and market metadata for a crypto symbol.
   */
  async getCryptoUsdPrice(
    symbol: string
  ): Promise<{
    priceUsd: number;
    marketCap: number;
    volume24h: number;
    change24h: number;
  }> {
    const id = this.resolveId(symbol);
    const url = `${this.baseUrl}/tickers/${id}`;

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        timeout: 10000,
      });

      const data = response.data;
      const quotes = data?.quotes?.USD;

      if (!quotes || typeof quotes.price !== 'number') {
        throw new Error(
          `Could not find USD price in CoinPaprika response for ${symbol}`
        );
      }

      return {
        priceUsd: quotes.price,
        marketCap: quotes.market_cap || 0,
        volume24h: quotes.volume_24h || 0,
        change24h: quotes.percent_change_24h || 0,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(
          `Cryptocurrency "${symbol}" not found on CoinPaprika. ` +
            `Try using a valid symbol like BTC, ETH, SOL, etc.`
        );
      }
      throw new Error(
        `CoinPaprika API failed for ${symbol}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Convert crypto to fiat (USD-denominated, caller handles non-USD conversion).
   */
  async convertToUsd(
    symbol: string,
    amount: number
  ): Promise<CryptoConversionResult> {
    const data = await this.getCryptoUsdPrice(symbol);

    return {
      from: symbol.toUpperCase(),
      to: 'USD',
      amount,
      result: data.priceUsd * amount,
      rate: data.priceUsd,
      timestamp: new Date(),
      source: 'coinpaprika',
      conversionType: 'crypto-to-fiat',
      metadata: {
        method: 'coinpaprika_api',
        precision: 'high',
        marketCap: data.marketCap,
        volume24h: data.volume24h,
        change24h: data.change24h,
      },
    };
  }

  /**
   * Resolve a crypto symbol to a CoinPaprika ID.
   * Falls back to lowercase symbol-based guess if not in the map.
   */
  private resolveId(symbol: string): string {
    const upper = symbol.toUpperCase();
    if (COINPAPRIKA_ID_MAP[upper]) {
      return COINPAPRIKA_ID_MAP[upper];
    }
    // Fallback: try lowercase symbol as prefix (e.g., "pepe" -> "pepe-pepe")
    const lower = symbol.toLowerCase();
    return `${lower}-${lower}`;
  }
}
