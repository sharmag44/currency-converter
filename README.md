# @sharmag44/currency-converter

A robust, **100% free-of-cost** currency and cryptocurrency conversion library for Node.js. It uses advanced stealth scraping from Google Finance and high-precision fallbacks from Yahoo Finance & CoinPaprika to provide real-time exchange rates without requiring API keys or paid subscriptions.

## 🚀 Key Features

- 🛑 **Anti-Bot Stealth**: Uses `puppeteer-extra-plugin-stealth` to bypass Google's bot detection.
- 📈 **Google Finance First**: Targets the stable Google Finance UI for high-precision live rates.
- 🔄 **Automatic Failover**: Transparently switches to Yahoo Finance / CoinPaprika if Google is blocked.
- ⚡ **Built-in Caching**: Internal TTL cache (1-hour for fiat, 5-min for crypto) to maximize performance.
- 🪙 **Crypto Support**: Convert between 30+ cryptocurrencies and 80+ fiat currencies.
- 🔌 **Plug-and-Play**: Zero configuration required. Just import and convert.
- 📦 **Dual Module**: Works with both CommonJS (`require`) and ESModules (`import`).

## 📦 Installation

```bash
npm install @sharmag44/currency-converter
```

---

## 💱 Currency Conversion

### Quick Start

```javascript
const { convertCurrency } = require('@sharmag44/currency-converter');

// Convert 100 USD to EUR
const result = await convertCurrency('USD', 'EUR', 100);
console.log(result.result); // 91.80
console.log(result.rate); // 0.918
```

### ESModules

```javascript
import { convertCurrency } from '@sharmag44/currency-converter';

const result = await convertCurrency('GBP', 'JPY', 50);
console.log(result.result);
```

### Custom Options

```javascript
const result = await convertCurrency('USD', 'EUR', 100, {
  timeout: 45000,
  source: 'google' // 'google' | 'yahoo' | 'auto'
});
```

### Result Object

```json
{
  "from": "USD", "to": "EUR", "amount": 100,
  "result": 91.80, "rate": 0.918,
  "source": "google",
  "metadata": { "method": "fast_finance", "precision": "high" }
}
```

---

## 🪙 Crypto Conversion (NEW)

Convert between cryptocurrencies and fiat currencies using the `convertCrypto()` function.

### Crypto → Fiat

```javascript
const { convertCrypto } = require('@sharmag44/currency-converter');

// Get BTC price in USD
const result = await convertCrypto('BTC', 'USD');
console.log(result.result); // 68420.50

// Get 5 ETH price in INR
const result2 = await convertCrypto('ETH', 'INR', 5);
console.log(result2.result); // 1500000
```

### Fiat → Crypto

```javascript
// How much BTC can I buy with $1000?
const result = await convertCrypto('USD', 'BTC', 1000);
console.log(result.result); // 0.01461988
```

### Crypto → Crypto

```javascript
// How many ETH is 1 BTC worth?
const result = await convertCrypto('BTC', 'ETH');
console.log(result.result); // 20.12
console.log(result.rate);   // 20.12
```

### Crypto Options

```javascript
const result = await convertCrypto('SOL', 'USD', 10, {
  timeout: 30000,
  source: 'auto' // 'google' | 'coinpaprika' | 'auto'
});
```

### Crypto Result Object

```json
{
  "from": "BTC", "to": "USD", "amount": 1,
  "result": 68420.50, "rate": 68420.50,
  "source": "google",
  "conversionType": "crypto-to-fiat",
  "metadata": {
    "method": "fast_finance",
    "precision": "high",
    "marketCap": 1300000000000,
    "volume24h": 25000000000,
    "change24h": 2.5
  }
}
```

### Supported Cryptocurrencies

BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, DOT, LINK, MATIC, SHIB, LTC, UNI, ATOM, XLM, ALGO, NEAR, APT, SUI, ARB, OP, FIL, AAVE, GRT, SAND, MANA, AXS, CRO, TRX — and any other symbol supported by Google Finance.

### Utility Functions

```javascript
import { formatCrypto, getCryptoSymbol } from '@sharmag44/currency-converter';

getCryptoSymbol('BTC'); // '₿'
getCryptoSymbol('ETH'); // 'Ξ'
formatCrypto(0.01461, 'BTC'); // '₿0.01461000'
```

---

## 🛡️ Reliability & Failover

### Fiat Conversion Pipeline
1. **Local Cache** (1-hour TTL) → instant return
2. **Google Finance (Fast)** → lightweight HTTP scrape
3. **Google Finance (Stealth)** → headless browser with stealth plugins
4. **Yahoo Finance API** → fallback via Yahoo's chart API

### Crypto Conversion Pipeline
1. **Local Cache** (5-minute TTL) → instant return
2. **Google Finance** → same scraping infrastructure as fiat
3. **CoinPaprika API** → free, no API key required

## 🔧 Dependencies

- `axios` - HTTP client for API requests and fast scraping
- `cheerio` - HTML parsing for lightweight extraction
- `puppeteer` - Headless browser for robust scraping
- `puppeteer-extra` - Enhanced wrapper (included)
- `puppeteer-extra-plugin-stealth` - Necessary for bypassing bot detection (included)

## 📜 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! If you find a selector has changed or a new free source is available, please feel free to submit a Pull Request.
