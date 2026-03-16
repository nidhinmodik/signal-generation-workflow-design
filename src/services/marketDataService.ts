import { Asset, Timeframe, CandleData } from '../types';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

export const assetToPair = (asset: Asset): string => {
  const pairs: Record<Asset, string> = {
    BTC: 'BTCUSDT',
    ETH: 'ETHUSDT',
    XRP: 'XRPUSDT',
    SOL: 'SOLUSDT',
  };
  return pairs[asset];
};

export const timeframeToInterval = (timeframe: Timeframe): string => {
  const intervals: Record<Timeframe, string> = {
    '5min': '5m',
    '15min': '15m',
    '1hour': '1h',
  };
  return intervals[timeframe];
};

export interface BinanceCandle {
  0: number; // Open time
  1: string; // Open
  2: string; // High
  3: string; // Low
  4: string; // Close
  5: string; // Volume
  6: number; // Close time
  7: string; // Quote asset volume
  8: number; // Number of trades
  9: string; // Taker buy base asset volume
  10: string; // Taker buy quote asset volume
  11: string; // Ignore
}

/**
 * Fetch klines (candlestick data) from Binance API
 * @param asset - Asset symbol (BTC, ETH, XRP, SOL)
 * @param timeframe - Timeframe (5min, 15min, 1hour)
 * @param limit - Number of candles to fetch (default 50)
 */
export const fetchCandleData = async (
  asset: Asset,
  timeframe: Timeframe,
  limit: number = 50
): Promise<CandleData[]> => {
  try {
    const pair = assetToPair(asset);
    const interval = timeframeToInterval(timeframe);

    const url = `${BINANCE_API_BASE}/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BinanceCandle[] = await response.json();

    const candles: CandleData[] = data.map((candle) => ({
      timestamp: new Date(candle[0]),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));

    return candles;
  } catch (error) {
    console.error(`Error fetching candle data for ${asset} ${timeframe}:`, error);
    return [];
  }
};

/**
 * Fetch ticker price for a specific asset
 */
export const fetchTickerPrice = async (asset: Asset): Promise<number | null> => {
  try {
    const pair = assetToPair(asset);
    const url = `${BINANCE_API_BASE}/ticker/price?symbol=${pair}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: { symbol: string; price: string } = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Error fetching ticker price for ${asset}:`, error);
    return null;
  }
};

/**
 * Fetch 24h ticker data including volume information
 */
export const fetch24hTickerData = async (
  asset: Asset
): Promise<{ price: number; volume: number; priceChange: number } | null> => {
  try {
    const pair = assetToPair(asset);
    const url = `${BINANCE_API_BASE}/ticker/24hr?symbol=${pair}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: any = await response.json();
    return {
      price: parseFloat(data.lastPrice),
      volume: parseFloat(data.volume),
      priceChange: parseFloat(data.priceChangePercent),
    };
  } catch (error) {
    console.error(`Error fetching 24h ticker data for ${asset}:`, error);
    return null;
  }
};

/**
 * Check if market is in a major liquidation event (unusual volume spike)
 */
export const checkMarketVolatility = async (asset: Asset): Promise<boolean> => {
  try {
    const pair = assetToPair(asset);
    // Fetch 1h data to check for volume spikes
    const url = `${BINANCE_API_BASE}/klines?symbol=${pair}&interval=1h&limit=5`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: BinanceCandle[] = await response.json();
    
    // Calculate average volume from last 4 candles
    const recentVolumes = data.slice(0, 4).map(c => parseFloat(c[5]));
    const avgVolume = recentVolumes.reduce((a, b) => a + b, 0) / recentVolumes.length;
    
    // Check if current volume is 2x the average (high volatility)
    const currentVolume = parseFloat(data[data.length - 1][5]);
    const isHighVolatility = currentVolume > avgVolume * 2;

    return isHighVolatility;
  } catch (error) {
    console.error(`Error checking market volatility for ${asset}:`, error);
    return false;
  }
};
