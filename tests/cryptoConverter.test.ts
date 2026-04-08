import { CryptoConverter } from '../src/cryptoConverter';
import { GoogleCurrencyScraper } from '../src/googleScraper';
import { CoinPaprikaScraper } from '../src/cryptoCoinPaprika';

// Mock the scrapers
jest.mock('../src/googleScraper');
jest.mock('../src/cryptoCoinPaprika');

describe('CryptoConverter', () => {
  let converter: CryptoConverter;
  let mockGoogleScraper: jest.Mocked<GoogleCurrencyScraper>;
  let mockCoinPaprikaScraper: jest.Mocked<CoinPaprikaScraper>;

  beforeEach(() => {
    jest.clearAllMocks();

    converter = new CryptoConverter();

    // Access the private scrapers
    mockGoogleScraper = (converter as any).googleScraper as jest.Mocked<GoogleCurrencyScraper>;
    mockCoinPaprikaScraper = (converter as any).coinPaprikaScraper as jest.Mocked<CoinPaprikaScraper>;
  });

  describe('Same currency conversion', () => {
    it('should return amount as-is when from and to are the same', async () => {
      const result = await converter.convert('BTC', 'BTC', { amount: 5 });

      expect(result.from).toBe('BTC');
      expect(result.to).toBe('BTC');
      expect(result.result).toBe(5);
      expect(result.rate).toBe(1);
      expect(result.source).toBe('cache');
    });
  });

  describe('Crypto to Fiat (Google Finance primary)', () => {
    it('should convert BTC to USD using Google Finance', async () => {
      mockGoogleScraper.convertCurrency.mockResolvedValue({
        from: 'BTC',
        to: 'USD',
        amount: 1,
        result: 68420.5,
        rate: 68420.5,
        timestamp: new Date(),
        source: 'google',
        metadata: { method: 'fast_finance', precision: 'high' },
      });

      const result = await converter.convert('BTC', 'USD', { amount: 1 });

      expect(result.from).toBe('BTC');
      expect(result.to).toBe('USD');
      expect(result.rate).toBe(68420.5);
      expect(result.result).toBe(68420.5);
      expect(result.source).toBe('google');
      expect(result.conversionType).toBe('crypto-to-fiat');
      expect(mockGoogleScraper.convertCurrency).toHaveBeenCalledWith('BTC', 'USD', 1);
    });

    it('should convert ETH to INR using Google Finance', async () => {
      mockGoogleScraper.convertCurrency.mockResolvedValue({
        from: 'ETH',
        to: 'INR',
        amount: 5,
        result: 1500000,
        rate: 300000,
        timestamp: new Date(),
        source: 'google',
        metadata: { method: 'fast_finance', precision: 'high' },
      });

      const result = await converter.convert('ETH', 'INR', { amount: 5 });

      expect(result.from).toBe('ETH');
      expect(result.to).toBe('INR');
      expect(result.result).toBe(1500000);
      expect(result.conversionType).toBe('crypto-to-fiat');
    });
  });

  describe('Failover: Google → CoinPaprika', () => {
    it('should fall back to CoinPaprika when Google fails for crypto-to-USD', async () => {
      mockGoogleScraper.convertCurrency.mockRejectedValue(
        new Error('Google Finance blocked')
      );

      mockCoinPaprikaScraper.getCryptoUsdPrice.mockResolvedValue({
        priceUsd: 67000,
        marketCap: 1300000000000,
        volume24h: 25000000000,
        change24h: 2.5,
      });

      const result = await converter.convert('BTC', 'USD', { amount: 2 });

      expect(result.from).toBe('BTC');
      expect(result.to).toBe('USD');
      expect(result.result).toBe(134000);
      expect(result.rate).toBe(67000);
      expect(result.source).toBe('coinpaprika');
      expect(result.metadata?.marketCap).toBe(1300000000000);
    });
  });

  describe('Fiat to Crypto', () => {
    it('should convert USD to BTC (inverse)', async () => {
      // First call: crypto→fiat to get BTC price in USD
      mockGoogleScraper.convertCurrency.mockResolvedValue({
        from: 'BTC',
        to: 'USD',
        amount: 1,
        result: 68000,
        rate: 68000,
        timestamp: new Date(),
        source: 'google',
        metadata: { method: 'fast_finance', precision: 'high' },
      });

      const result = await converter.convert('USD', 'BTC', { amount: 1000 });

      expect(result.from).toBe('USD');
      expect(result.to).toBe('BTC');
      expect(result.conversionType).toBe('fiat-to-crypto');
      // $1000 / $68000 per BTC ≈ 0.0147 BTC
      expect(result.rate).toBeCloseTo(1 / 68000, 8);
      expect(result.result).toBeCloseTo(1000 / 68000, 8);
    });
  });

  describe('Crypto to Crypto', () => {
    it('should convert BTC to ETH via USD cross-rate', async () => {
      // Mock: BTC → USD = 68000, ETH → USD = 3400
      mockGoogleScraper.convertCurrency
        .mockResolvedValueOnce({
          from: 'BTC',
          to: 'USD',
          amount: 1,
          result: 68000,
          rate: 68000,
          timestamp: new Date(),
          source: 'google',
        })
        .mockResolvedValueOnce({
          from: 'ETH',
          to: 'USD',
          amount: 1,
          result: 3400,
          rate: 3400,
          timestamp: new Date(),
          source: 'google',
        });

      const result = await converter.convert('BTC', 'ETH', { amount: 1 });

      expect(result.from).toBe('BTC');
      expect(result.to).toBe('ETH');
      expect(result.conversionType).toBe('crypto-to-crypto');
      // 1 BTC = 68000/3400 = 20 ETH
      expect(result.rate).toBe(20);
      expect(result.result).toBe(20);
      expect(result.metadata?.method).toBe('cross_rate_via_usd');
    });
  });

  describe('Caching', () => {
    it('should return cached rate on second call', async () => {
      mockGoogleScraper.convertCurrency.mockResolvedValue({
        from: 'BTC',
        to: 'USD',
        amount: 1,
        result: 68420.5,
        rate: 68420.5,
        timestamp: new Date(),
        source: 'google',
        metadata: { method: 'fast_finance', precision: 'high' },
      });

      // First call - hits the API
      await converter.convert('BTC', 'USD', { amount: 1 });
      expect(mockGoogleScraper.convertCurrency).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await converter.convert('BTC', 'USD', { amount: 2 });
      expect(mockGoogleScraper.convertCurrency).toHaveBeenCalledTimes(1); // No additional calls
      expect(result.source).toBe('cache');
      expect(result.result).toBeCloseTo(68420.5 * 2, 2);
    });
  });

  describe('Error handling', () => {
    it('should throw when all sources fail', async () => {
      mockGoogleScraper.convertCurrency.mockRejectedValue(
        new Error('Google blocked')
      );
      mockCoinPaprikaScraper.getCryptoUsdPrice.mockRejectedValue(
        new Error('CoinPaprika error')
      );

      await expect(
        converter.convert('BTC', 'USD', { amount: 1 })
      ).rejects.toThrow('All crypto conversion sources failed');
    });
  });
});
