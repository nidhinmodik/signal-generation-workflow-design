# Real-Time Market Data Integration

## Overview

The Trading Signal System now uses **real-time market data directly from the Binance API** instead of demo/mock data. All signals are generated based on actual live market conditions.

## Data Source

- **API Provider**: Binance REST API (`https://api.binance.com/api/v3`)
- **Assets**: BTC, ETH, XRP, SOL (USDT pairs)
- **Timeframes**: 5-minute, 15-minute, 1-hour candles
- **Update Frequency**: Every 2 seconds when system is running
- **Historical Data**: 100 candles per timeframe/asset

## Real-Time Data Flow

```
Binance API
    ↓
fetchCandleData() service
    ↓
Dashboard effect (every 2 seconds)
    ↓
Signal detection & exit checking
    ↓
Live performance metrics update
```

## API Endpoints Used

### 1. Klines (Candlestick Data)
```
GET /api/v3/klines
Parameters:
  - symbol: BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT
  - interval: 5m, 15m, 1h
  - limit: 100
```
Returns: Open, High, Low, Close, Volume, and more for each candle

### 2. Ticker Price (Optional)
```
GET /api/v3/ticker/price
Parameters:
  - symbol: BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT
```
Returns: Current price

### 3. 24-Hour Ticker (Optional)
```
GET /api/v3/ticker/24hr
Parameters:
  - symbol: BTCUSDT, ETHUSDT, XRPUSDT, SOLUSDT
```
Returns: Price, volume, 24h change percentage

## Implementation Details

### Market Data Service (`src/services/marketDataService.ts`)

**Key Functions:**

1. **fetchCandleData(asset, timeframe, limit)**
   - Fetches historical candlestick data from Binance
   - Returns array of CandleData objects with OHLCV
   - Handles API errors gracefully

2. **fetchTickerPrice(asset)**
   - Gets current market price for an asset
   - Used for real-time exit checking

3. **fetch24hTickerData(asset)**
   - Retrieves 24h volume and price change
   - Can be used for volatility filtering

4. **checkMarketVolatility(asset)**
   - Detects unusual volume spikes (2x+ normal volume)
   - Used to identify high-volatility conditions

### Dashboard Integration (`src/components/Dashboard.tsx`)

**Initialization:**
```typescript
// Fetches live market data when component mounts
useEffect(() => {
  initializeMarketData();
}, []);
```

**Real-Time Update Loop:**
```typescript
// Refreshes data every 2 seconds when running
useEffect(() => {
  const interval = setInterval(async () => {
    // Fetch fresh data from Binance
    // Process signals
    // Update exits
    // Detect new opportunities
  }, 2000);
}, [isRunning]);
```

## Signal Generation on Live Data

### Detection Criteria

Signals are generated when **all** conditions are met:

1. **MACD Crossover**
   - BUY: MACD line crosses above signal line AND MACD > 50
   - SELL: MACD line crosses below signal line AND MACD < 50

2. **Volume Confirmation**
   - Current candle volume > 1.5x average (20-period)
   - Prevents signals on low-volume bars

3. **Price Action**
   - BUY: Price breaks above recent resistance + close > previous close
   - SELL: Price breaks below recent support + close < previous close

4. **Signal Gating**
   - Only ONE active position per asset/timeframe
   - Next signal only after previous closes at TP or SL

## Exit Management

Real-time exit checking validates every signal against live prices:

```typescript
// For BUY signals
- TP Hit: currentPrice >= takeProfit → CLOSED_TP (Profit)
- SL Hit: currentPrice <= stopLoss → CLOSED_SL (Loss)

// For SELL signals
- TP Hit: currentPrice <= takeProfit → CLOSED_TP (Profit)
- SL Hit: currentPrice >= stopLoss → CLOSED_SL (Loss)
```

## Risk/Reward on Real Data

Every signal enforces **1:3 risk-to-reward ratio**:

```
Risk = Entry - SL
Reward = TP - Entry = 3 × Risk

Example (BTC):
- Entry: $65,000
- SL: $64,500 (Risk = $500)
- TP: $66,500 (Reward = $1,500 = 3 × $500)
```

## Error Handling

### Network Failures
- System displays connection error banner
- Continues with last cached data if available
- Auto-retries on next 2-second cycle

### API Rate Limits
- Binance public API: 1,200 requests per minute
- Current system uses ~12 requests per cycle (4 assets × 3 timeframes)
- Safe margin: 24 requests per 2 seconds = 720 req/min

### Data Validation
- Checks for empty/invalid responses
- Validates OHLCV data structure
- Skips corrupted candles

## Live Performance Tracking

The dashboard displays real-time metrics based on actual closes:

| Metric | Calculation |
|--------|------------|
| Total Signals | Count of all signals generated |
| Wins (TP) | Signals closed at take profit |
| Losses (SL) | Signals closed at stop loss |
| Win Rate | Wins / (Wins + Losses) |
| Risk/Reward | Always 1:3 (enforced) |
| Win:Loss Ratio | Wins / Losses |

## Trading Pairs

All pairs use USDT (Tether) as the quote currency:

| Asset | Pair ID | Decimal Places |
|-------|---------|-----------------|
| Bitcoin | BTCUSDT | 2 |
| Ethereum | ETHUSDT | 2 |
| Ripple | XRPUSDT | 4 |
| Solana | SOLUSDT | 2 |

## Key Features

✅ **Real-time data** - Updated every 2 seconds
✅ **No demo data** - 100% live market signals
✅ **Binance API** - Direct market data source
✅ **Exact execution** - Exit when TP/SL hit
✅ **Live metrics** - Win/loss tracking on real closes
✅ **Error recovery** - Handles network issues gracefully
✅ **Signal gating** - Prevents overlapping positions

## Testing the Live System

1. **Start the system** - Click "Start" button
2. **Monitor candles** - New data fetches every 2 seconds
3. **Watch signals** - Generated from actual market conditions
4. **Track exits** - TP/SL triggered by real prices
5. **Review metrics** - Based on live trade results

## Troubleshooting

### No signals appearing
- Ensure system is running (green "Running" status)
- Check browser console for API errors
- Verify Binance API is accessible
- Wait 2-3 cycles for data collection

### Signals disappearing
- Likely closed by TP or SL (check "Recent Closed Signals")
- Check performance table for closed trades
- This is normal behavior - signals are gated

### API connection errors
- Check browser internet connection
- Verify Binance API is not down
- Try refreshing the page
- Errors are displayed in red banner at top

## Performance Notes

- **Data fetch time**: ~200-500ms per cycle
- **Signal detection**: Real-time with 50-candle minimum
- **Exit checking**: Instant when price crosses levels
- **Refresh rate**: 2 seconds for new data + analysis

## Future Enhancements

- [ ] WebSocket streaming (replace polling)
- [ ] Multiple timeframe confirmation
- [ ] Liquidation cascade detection
- [ ] Funding rate alerts
- [ ] Order book imbalance detection
- [ ] Historical backtest module

## API Documentation

For more details about Binance API:
- Official Docs: https://developers.binance.com/docs/binance-spot-api
- Rate Limits: 1,200 requests per minute (public endpoints)
- Status: https://status.binance.com/
