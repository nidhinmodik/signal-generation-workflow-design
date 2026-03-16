# Binance API Integration - Technical Reference

## Overview

The Trading Signal System uses Binance REST API to fetch real-time market data. This document provides technical implementation details.

---

## API Endpoints

### Base URL
```
https://api.binance.com/api/v3
```

### 1. Klines (Candlestick Data)

**Endpoint**: `GET /klines`

**Purpose**: Fetch OHLCV (Open, High, Low, Close, Volume) candlestick data

**Parameters**:
```
symbol      : string   (BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT)
interval    : string   (5m, 15m, 1h)
startTime   : long     (optional, milliseconds since epoch)
endTime     : long     (optional, milliseconds since epoch)
limit       : int      (1-1000, default 500)
```

**Example Request**:
```
GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=50
```

**Response Structure**:
```json
[
  [
    1234567890,      // 0  - Open time (milliseconds)
    "65234.50",      // 1  - Open price
    "65500.00",      // 2  - High price
    "65100.00",      // 3  - Low price
    "65400.00",      // 4  - Close price
    "123456.789",    // 5  - Asset volume
    1234567999,      // 6  - Close time (milliseconds)
    "8073924.50",    // 7  - Quote asset volume
    1234,            // 8  - Number of trades
    "50123.456",     // 9  - Taker buy base asset volume
    "3289123.12",    // 10 - Taker buy quote asset volume
    "0"              // 11 - Ignore
  ],
  // ... more candles
]
```

**Implementation** (`src/services/marketDataService.ts`):
```typescript
export const fetchCandleData = async (
  asset: Asset,
  timeframe: Timeframe,
  limit: number = 50
): Promise<CandleData[]> => {
  const pair = assetToPair(asset);      // "BTC" → "BTCUSDT"
  const interval = timeframeToInterval(timeframe); // "5min" → "5m"
  
  const url = `${BINANCE_API_BASE}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);
  const data: BinanceCandle[] = await response.json();
  
  // Convert to CandleData format
  return data.map((candle) => ({
    timestamp: new Date(candle[0]),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
};
```

---

### 2. Ticker Price

**Endpoint**: `GET /ticker/price`

**Purpose**: Get current market price for a symbol

**Parameters**:
```
symbol: string (BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT)
```

**Example Request**:
```
GET https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
```

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "price": "65234.50"
}
```

**Use Case**: Real-time exit checking (validate if price hit TP/SL)

---

### 3. 24-Hour Ticker Statistics

**Endpoint**: `GET /ticker/24hr`

**Purpose**: Get 24-hour price statistics and volume

**Parameters**:
```
symbol: string (BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT)
```

**Example Request**:
```
GET https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT
```

**Response**:
```json
{
  "symbol": "BTCUSDT",
  "priceChange": "523.50",
  "priceChangePercent": "0.8043",
  "weightedAvgPrice": "65123.45",
  "prevClosePrice": "64710.00",
  "lastPrice": "65234.50",
  "lastQty": "12.34567",
  "bidPrice": "65234.40",
  "bidQty": "123.45",
  "askPrice": "65234.50",
  "askQty": "456.78",
  "openPrice": "64710.00",
  "highPrice": "65789.00",
  "lowPrice": "64500.00",
  "volume": "123456789.12",
  "quoteVolume": "8073924567.89",
  "openTime": 1234567890000,
  "closeTime": 1234654290000,
  "firstId": 123456,
  "lastId": 654321,
  "count": 456789
}
```

**Use Case**: Volatility detection, 24h volume analysis

---

## Rate Limits

### Public API Rate Limits
```
1200 requests per minute
```

### Per-Weight-Minute Limit
```
10,000 weight per minute
```

**Current System Usage**:
```
Request frequency: Every 2 seconds
Requests per cycle:
  - 4 assets × 3 timeframes = 12 klines requests
  - (Optional) 4 ticker requests
  - (Optional) 4 24hr ticker requests
  
Total: ~12 requests per 2 seconds
= 360 requests per minute
= 30% of 1,200 limit

Safety margin: 3.3x
```

---

## Trading Pairs Supported

| Asset | Pair ID | Quote | Decimal |
|-------|---------|-------|---------|
| Bitcoin | BTCUSDT | USDT | 2 |
| Ethereum | ETHUSDT | USDT | 2 |
| Ripple | XRPUSDT | USDT | 4 |
| Solana | SOLUSDT | USDT | 2 |

**Why USDT?**
- Most liquid quote currency on Binance
- Consistent decimal precision
- Best for candlestick data quality
- Widely adopted in crypto trading

---

## Interval Specifications

| Timeframe | Interval Code | Binance Duration |
|-----------|---------------|-----------------|
| 5 minutes | 5m | 5 min |
| 15 minutes | 15m | 15 min |
| 1 hour | 1h | 1 hour |

**Note**: System uses 100 candles per timeframe for indicator calculation (50 minimum for MACD)

---

## Data Processing Pipeline

### Step 1: Fetch Raw Data
```typescript
const rawData = await fetch(
  'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=100'
);
const binanceCandles: BinanceCandle[] = await rawData.json();
```

### Step 2: Convert to Internal Format
```typescript
const candles: CandleData[] = binanceCandles.map((b) => ({
  timestamp: new Date(b[0]),      // b[0] = Open time
  open: parseFloat(b[1]),         // b[1] = Open price
  high: parseFloat(b[2]),         // b[2] = High price
  low: parseFloat(b[3]),          // b[3] = Low price
  close: parseFloat(b[4]),        // b[4] = Close price
  volume: parseFloat(b[5]),       // b[5] = Base asset volume
}));
```

### Step 3: Calculate Indicators
```typescript
// MACD calculation on close prices
const prices = candles.map(c => c.close);
const { macdLine, signalLine, histogram } = calculateMACD(prices);

// Volume analysis
const volumes = candles.map(c => c.volume);
const avgVolume = volumes.slice(-20).reduce((a,b) => a+b) / 20;
const volumeRatio = currentVolume / avgVolume;
```

### Step 4: Detect Signals
```typescript
// Check MACD crossover
const macdCrossover = prevMACD <= prevSignal && currentMACD > currentSignal;

// Check volume breakout
const volumeBreakout = currentVolume > avgVolume * 1.5;

// Check price action
const priceBreakout = currentPrice > recentHigh;

// Generate signal if all criteria met
if (macdCrossover && volumeBreakout && priceBreakout) {
  // Create signal with 1:3 risk/reward
}
```

### Step 5: Check Exits
```typescript
// For each active signal, compare current price to SL/TP
if (currentPrice >= signal.takeProfit) {
  // Close signal at profit
  signal.status = 'CLOSED_TP';
} else if (currentPrice <= signal.stopLoss) {
  // Close signal at loss
  signal.status = 'CLOSED_SL';
}
```

---

## Error Handling

### Network Errors
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.json();
} catch (error) {
  console.error(`API error: ${error.message}`);
  // Return empty array or cached data
  return [];
}
```

### Data Validation
```typescript
// Validate OHLCV integrity
const candles = data.map((c) => ({
  timestamp: new Date(c[0]),
  open: parseFloat(c[1]),
  high: parseFloat(c[2]),
  low: parseFloat(c[3]),
  close: parseFloat(c[4]),
  volume: parseFloat(c[5]),
}));

// Check: high >= low, all prices valid
const isValid = candle.high >= candle.low && 
                candle.volume > 0 &&
                !isNaN(candle.close);
```

---

## Binance API Status

### Checking API Health
```
https://api.binance.com/api/v3/ping
```

### Server Time
```
https://api.binance.com/api/v3/time
```

**Response**:
```json
{
  "serverTime": 1234567890000
}
```

---

## WebSocket Alternative (Future Enhancement)

While current system uses REST polling (every 2 seconds), Binance also offers WebSocket for true real-time:

```
wss://stream.binance.com:9443/ws
```

**Kline Stream** (would replace HTTP polling):
```
BTCUSDT@kline_5m
ETHUSDT@kline_15m
XRPUSDT@kline_1h
SOLUSDT@kline_5m
```

**Advantages**:
- True real-time (vs 2-second polling)
- Lower latency
- More efficient bandwidth
- Better scalability

**Current Implementation**: REST polling every 2 seconds (simpler, sufficient)

---

## Example Curl Requests

### Get Latest 50 BTC 5min Candles
```bash
curl -X GET "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m&limit=50"
```

### Get Current BTC Price
```bash
curl -X GET "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
```

### Get 24h BTC Statistics
```bash
curl -X GET "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
```

---

## Data Precision

| Asset | Price Decimal | Volume Decimal |
|-------|---------------|-----------------|
| BTC | 2 places | 8 places |
| ETH | 2 places | 8 places |
| XRP | 4 places | 8 places |
| SOL | 2 places | 8 places |

**Implementation**:
```typescript
// BTC: $65,234.50
const btcPrice = parseFloat("65234.50").toFixed(2);

// ETH: $3,500.25
const ethPrice = parseFloat("3500.25").toFixed(2);

// XRP: $0.5234
const xrpPrice = parseFloat("0.5234").toFixed(4);

// SOL: $150.75
const solPrice = parseFloat("150.75").toFixed(2);
```

---

## Trading Pairs Details

### BTCUSDT
- **Min Price**: $0.01
- **Max Price**: Unlimited
- **Min Quantity**: 0.00001 BTC
- **Price Precision**: 2 decimals
- **Volume**: Highest liquidity
- **Spread**: <$0.01 typical

### ETHUSDT
- **Min Price**: $0.01
- **Max Price**: Unlimited
- **Min Quantity**: 0.001 ETH
- **Price Precision**: 2 decimals
- **Volume**: Very high liquidity
- **Spread**: <$0.01 typical

### XRPUSDT
- **Min Price**: $0.0001
- **Max Price**: Unlimited
- **Min Quantity**: 1 XRP
- **Price Precision**: 4 decimals
- **Volume**: High liquidity
- **Spread**: <$0.0001 typical

### SOLUSDT
- **Min Price**: $0.01
- **Max Price**: Unlimited
- **Min Quantity**: 0.01 SOL
- **Price Precision**: 2 decimals
- **Volume**: Good liquidity
- **Spread**: <$0.01 typical

---

## Monitoring Checklist

- [ ] API responding within 500ms
- [ ] Data timestamps current (< 5 seconds old)
- [ ] OHLCV values valid (H >= L, V > 0)
- [ ] No duplicate candles
- [ ] Volume > 0 (market active)
- [ ] Rate limit headroom > 30%
- [ ] Error responses logged
- [ ] Network timeouts retried

---

## Documentation Links

- **Binance API Docs**: https://developers.binance.com/docs/binance-spot-api
- **Rate Limits**: https://developers.binance.com/docs/binance-spot-api#general-info
- **Klines Endpoint**: https://developers.binance.com/docs/binance-spot-api#klines
- **Status Page**: https://status.binance.com/

---

## Code References

- **Service**: `src/services/marketDataService.ts`
- **Usage in Dashboard**: `src/components/Dashboard.tsx`
- **Trading Logic**: `src/utils/tradingLogic.ts`
- **Type Definitions**: `src/types.ts`

---

**Status**: ✅ Fully functional Binance API integration
**Last Updated**: 2024
