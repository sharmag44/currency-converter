import { CryptoConverter } from '../src/cryptoConverter';

// Increase timeout for integration tests since they hit real APIs
jest.setTimeout(30000);

describe('CryptoConverter Integration Tests', () => {
  let converter: CryptoConverter;

  beforeAll(() => {
    // We intentionally do not mock any scrapers here
    // These tests will hit the actual Google Finance and CoinPaprika APIs
    converter = new CryptoConverter();
  });

  afterAll(async () => {
    await converter.close();
  });

  describe('Crypto to Fiat via Google Finance (Primary)', () => {
    it('should successfully convert BTC to USD', async () => {
      const result = await converter.convert('BTC', 'USD', { amount: 1 });
      
      expect(result.from).toBe('BTC');
      expect(result.to).toBe('USD');
      expect(result.rate).toBeGreaterThan(10000); // BTC is well over $10K
      expect(result.result).toBe(result.rate);
      expect(result.conversionType).toBe('crypto-to-fiat');
      expect(result.source).toBe('google');
    });

    it('should successfully convert ETH to INR', async () => {
      const result = await converter.convert('ETH', 'INR', { amount: 2 });
      
      expect(result.from).toBe('ETH');
      expect(result.to).toBe('INR');
      expect(result.rate).toBeGreaterThan(10000); // 1 ETH in INR
      expect(result.result).toBe(result.rate * 2);
      expect(result.conversionType).toBe('crypto-to-fiat');
    });
  });

  describe('Crypto to Fiat via CoinPaprika (Fallback)', () => {
    it('should successfully fetch using CoinPaprika when explicitly chosen', async () => {
      // Force the source to be coinpaprika to test the fallback directly
      const result = await converter.convert('SOL', 'USD', { amount: 10, source: 'coinpaprika' });
      
      expect(result.from).toBe('SOL');
      expect(result.to).toBe('USD');
      expect(result.rate).toBeGreaterThan(0.1); 
      expect(result.result).toBe(result.rate * 10);
      expect(result.conversionType).toBe('crypto-to-fiat');
      expect(result.source).toBe('coinpaprika');
      
      // CoinPaprika returns metadata
      expect(result.metadata?.marketCap).toBeGreaterThan(0);
      expect(result.metadata?.volume24h).toBeDefined();
    });

    it('should convert crypto to non-USD fiat using CoinPaprika + Google', async () => {
      // CoinPaprika gives USD. The script then uses Google to convert USD to EUR.
      const result = await converter.convert('ADA', 'EUR', { amount: 100, source: 'coinpaprika' });
      
      expect(result.from).toBe('ADA');
      expect(result.to).toBe('EUR');
      expect(result.rate).toBeGreaterThan(0); 
      expect(result.result).toBe(result.rate * 100);
      expect(result.conversionType).toBe('crypto-to-fiat');
      expect(result.source).toBe('coinpaprika'); // main source
    });
  });

  describe('Fiat to Crypto', () => {
    it('should convert USD to BTC', async () => {
      const result = await converter.convert('USD', 'BTC', { amount: 1000 });
      
      expect(result.from).toBe('USD');
      expect(result.to).toBe('BTC');
      expect(result.conversionType).toBe('fiat-to-crypto');
      // $1000 is a fraction of a BTC
      expect(result.rate).toBeLessThan(0.1);
      expect(result.result).toBe(result.rate * 1000);
    });
  });

  describe('Crypto to Crypto', () => {
    it('should compute cross-rate between BTC and ETH', async () => {
      const result = await converter.convert('BTC', 'ETH', { amount: 1 });
      
      expect(result.from).toBe('BTC');
      expect(result.to).toBe('ETH');
      expect(result.conversionType).toBe('crypto-to-crypto');
      // 1 BTC represents many ETH (usually > 10)
      expect(result.rate).toBeGreaterThan(5);
      expect(result.result).toBe(result.rate);
    });
  });

  describe('Error Handling on Real Endpoints', () => {
    it('should throw when providing a non-existent crypto symbol', async () => {
      // Google fails then CoinPaprika fails
      await expect(
        converter.convert('INVALIDCOIN123', 'USD', { timeout: 15000 })
      ).rejects.toThrow(/All crypto conversion sources failed/);
    });
  });

  describe('Caching Real API calls', () => {
    it('should use cache for identical subsequent calls', async () => {
      // Clear cache from any previous tests
      (converter as any).cache.clear();

      const start1 = Date.now();
      const res1 = await converter.convert('DOT', 'USD', { amount: 1 });
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const res2 = await converter.convert('DOT', 'USD', { amount: 2 });
      const time2 = Date.now() - start2;

      expect(res1.source).not.toBe('cache');
      expect(res2.source).toBe('cache');
      
      // The second request should be significantly faster and exactly double the result
      expect(time2).toBeLessThan(100); 
      expect(res2.result).toBeCloseTo(res1.rate * 2, 5);
      expect(res2.rate).toBe(res1.rate);
    });
  });
});
