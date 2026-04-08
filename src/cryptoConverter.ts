import { GoogleCurrencyScraper } from './googleScraper';
import { CoinPaprikaScraper } from './cryptoCoinPaprika';
import { ExchangeRateCache } from './cache';
import {
  CryptoConversionResult,
  CryptoConversionOptions,
  CryptoCode,
  CurrencyCode,
} from './types';

// Known fiat currency codes (3-letter ISO 4217) to distinguish from crypto
const FIAT_CODES = new Set([
  'USD','EUR','GBP','JPY','AUD','CAD','CHF','CNY','INR','NZD',
  'SEK','NOK','DKK','PLN','CZK','HUF','RON','RSD','ALL','MKD',
  'BAM','ISK','UAH','GEL','AMD','AZN','TRY','RUB','SGD','HKD',
  'KRW','TWD','THB','MYR','IDR','PHP','VND','PKR','BDT','LKR',
  'NPR','AED','SAR','QAR','KWD','BHD','OMR','ILS','KZT','UZS',
  'MXN','BRL','CLP','COP','ARS','UYU','PEN','XCD','XCG','ZAR',
  'EGP','NGN','KES','GHS','MAD','DZD','ZWG','ETB','TZS','UGX',
  'MUR','GIP','JEP','IMP','FJD','PGK',
]);

function isFiat(code: string): boolean {
  return FIAT_CODES.has(code.toUpperCase());
}

export class CryptoConverter {
  private googleScraper: GoogleCurrencyScraper;
  private coinPaprikaScraper: CoinPaprikaScraper;
  private cache: ExchangeRateCache;

  constructor() {
    this.googleScraper = new GoogleCurrencyScraper();
    this.coinPaprikaScraper = new CoinPaprikaScraper();
    // 5-minute TTL for crypto (more volatile than fiat)
    this.cache = new ExchangeRateCache(300);
  }

  async convert(
    from: string,
    to: string,
    options: CryptoConversionOptions = {}
  ): Promise<CryptoConversionResult> {
    const { amount = 1, timeout = 45000, source = 'auto' } = options;
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();

    if (fromUpper === toUpper) {
      return {
        from: fromUpper,
        to: toUpper,
        amount,
        result: amount,
        rate: 1,
        timestamp: new Date(),
        source: 'cache',
        conversionType: 'crypto-to-crypto',
      };
    }

    // Check cache
    const cacheKey = `CRYPTO_${fromUpper}_${toUpper}`;
    const cachedRate = this.cache.get(cacheKey, '');
    if (cachedRate !== null) {
      return {
        from: fromUpper,
        to: toUpper,
        amount,
        result: amount * cachedRate,
        rate: cachedRate,
        timestamp: new Date(),
        source: 'cache',
        conversionType: this.getConversionType(fromUpper, toUpper),
      };
    }

    // Determine conversion type and execute
    const fromIsFiat = isFiat(fromUpper);
    const toIsFiat = isFiat(toUpper);

    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Crypto conversion timeout')), timeout);
    });

    try {
      let result: CryptoConversionResult;

      if (!fromIsFiat && toIsFiat) {
        // Crypto → Fiat
        result = await Promise.race([
          this.cryptoToFiat(fromUpper, toUpper, amount, source),
          timeoutPromise,
        ]);
      } else if (fromIsFiat && !toIsFiat) {
        // Fiat → Crypto
        result = await Promise.race([
          this.fiatToCrypto(fromUpper, toUpper, amount, source),
          timeoutPromise,
        ]);
      } else {
        // Crypto → Crypto
        result = await Promise.race([
          this.cryptoToCrypto(fromUpper, toUpper, amount, source),
          timeoutPromise,
        ]);
      }

      // Cache the rate
      if (result && result.rate) {
        this.cache.set(cacheKey, '', result.rate);
      }

      return result;
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * Crypto → Fiat conversion (e.g., BTC → USD, ETH → INR)
   */
  private async cryptoToFiat(
    crypto: string,
    fiat: string,
    amount: number,
    source: string
  ): Promise<CryptoConversionResult> {
    const sources = this.getSourceOrder(source);

    for (const s of sources) {
      try {
        if (s === 'google') {
          // Google Finance supports direct crypto-fiat pairs like BTC-USD, BTC-INR
          const result = await this.googleScraper.convertCurrency(crypto, fiat, amount);
          return {
            from: crypto,
            to: fiat,
            amount,
            result: result.result,
            rate: result.rate,
            timestamp: new Date(),
            source: 'google',
            conversionType: 'crypto-to-fiat',
            metadata: {
              method: result.metadata?.method || 'google_finance',
              precision: 'high',
            },
          };
        } else if (s === 'coinpaprika') {
          // CoinPaprika gives USD price; if target is non-USD, we need a fiat conversion
          const cryptoData = await this.coinPaprikaScraper.getCryptoUsdPrice(crypto);

          if (fiat === 'USD') {
            return {
              from: crypto,
              to: fiat,
              amount,
              result: cryptoData.priceUsd * amount,
              rate: cryptoData.priceUsd,
              timestamp: new Date(),
              source: 'coinpaprika',
              conversionType: 'crypto-to-fiat',
              metadata: {
                method: 'coinpaprika_api',
                precision: 'high',
                marketCap: cryptoData.marketCap,
                volume24h: cryptoData.volume24h,
                change24h: cryptoData.change24h,
              },
            };
          }

          // Non-USD: get USD price, then convert USD → target fiat via Google
          const usdAmount = cryptoData.priceUsd * amount;
          const fiatResult = await this.googleScraper.convertCurrency('USD', fiat, usdAmount);

          return {
            from: crypto,
            to: fiat,
            amount,
            result: fiatResult.result,
            rate: fiatResult.result / amount,
            timestamp: new Date(),
            source: 'coinpaprika',
            conversionType: 'crypto-to-fiat',
            metadata: {
              method: 'coinpaprika_api+google_fiat',
              precision: 'standard',
              marketCap: cryptoData.marketCap,
              volume24h: cryptoData.volume24h,
              change24h: cryptoData.change24h,
            },
          };
        }
      } catch (error) {
        console.warn(`Crypto source ${s} failed:`, (error as any).message);
      }
    }

    throw new Error(`All crypto conversion sources failed for ${crypto} → ${fiat}`);
  }

  /**
   * Fiat → Crypto conversion (e.g., USD → BTC, INR → ETH)
   */
  private async fiatToCrypto(
    fiat: string,
    crypto: string,
    amount: number,
    source: string
  ): Promise<CryptoConversionResult> {
    // Get crypto price in the fiat currency, then invert
    const cryptoToFiatResult = await this.cryptoToFiat(crypto, fiat, 1, source);
    const rate = 1 / cryptoToFiatResult.rate;

    return {
      from: fiat,
      to: crypto,
      amount,
      result: amount * rate,
      rate,
      timestamp: new Date(),
      source: cryptoToFiatResult.source,
      conversionType: 'fiat-to-crypto',
      metadata: {
        ...cryptoToFiatResult.metadata,
        method: `inverse_${cryptoToFiatResult.metadata?.method || 'unknown'}`,
      },
    };
  }

  /**
   * Crypto → Crypto conversion (e.g., BTC → ETH)
   * Fetches both in USD, then computes cross-rate.
   */
  private async cryptoToCrypto(
    fromCrypto: string,
    toCrypto: string,
    amount: number,
    source: string
  ): Promise<CryptoConversionResult> {
    // Fetch both prices in USD in parallel
    const [fromResult, toResult] = await Promise.all([
      this.cryptoToFiat(fromCrypto, 'USD', 1, source),
      this.cryptoToFiat(toCrypto, 'USD', 1, source),
    ]);

    const crossRate = fromResult.rate / toResult.rate;

    return {
      from: fromCrypto,
      to: toCrypto,
      amount,
      result: amount * crossRate,
      rate: crossRate,
      timestamp: new Date(),
      source: fromResult.source,
      conversionType: 'crypto-to-crypto',
      metadata: {
        method: 'cross_rate_via_usd',
        precision: 'standard',
      },
    };
  }

  private getSourceOrder(preferredSource: string): string[] {
    if (preferredSource === 'google') return ['google'];
    if (preferredSource === 'coinpaprika') return ['coinpaprika'];
    // Default: Google first, CoinPaprika fallback
    return ['google', 'coinpaprika'];
  }

  private getConversionType(
    from: string,
    to: string
  ): 'crypto-to-fiat' | 'fiat-to-crypto' | 'crypto-to-crypto' {
    const fromIsFiat = isFiat(from);
    const toIsFiat = isFiat(to);
    if (!fromIsFiat && toIsFiat) return 'crypto-to-fiat';
    if (fromIsFiat && !toIsFiat) return 'fiat-to-crypto';
    return 'crypto-to-crypto';
  }

  async close(): Promise<void> {
    await this.googleScraper.close();
  }
}

// Global shared instance
export const defaultCryptoConverter = new CryptoConverter();

// Convenience function
export async function convertCrypto(
  from: CryptoCode | CurrencyCode,
  to: CryptoCode | CurrencyCode,
  amount: number = 1,
  options?: CryptoConversionOptions
): Promise<CryptoConversionResult> {
  return defaultCryptoConverter.convert(String(from), String(to), { amount, ...options });
}
