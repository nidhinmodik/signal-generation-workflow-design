import { Signal, Asset, Timeframe, SignalDirection, CandleData } from '../types';

export const calculateMACD = (prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const ema = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let emaValue = data[0];
    const result = [emaValue];
    for (let i = 1; i < data.length; i++) {
      emaValue = data[i] * k + emaValue * (1 - k);
      result.push(emaValue);
    }
    return result;
  };

  const fastEMA = ema(prices, fastPeriod);
  const slowEMA = ema(prices, slowPeriod);
  const macdLine = fastEMA.map((val, i) => val - slowEMA[i]);
  const signalLine = ema(macdLine, signalPeriod);
  const histogram = macdLine.map((val, i) => val - signalLine[i]);

  return { macdLine, signalLine, histogram };
};

export const detectSignal = (
  candles: CandleData[],
  asset: Asset,
  timeframe: Timeframe,
  existingSignals: Signal[]
): Signal | null => {
  if (candles.length < 50) return null;

  const prices = candles.map(c => c.close);
  const volumes = candles.map(c => c.volume);
  const { macdLine, signalLine } = calculateMACD(prices);

  const currentIdx = candles.length - 1;
  const prevIdx = currentIdx - 1;

  const currentMACD = macdLine[currentIdx];
  const prevMACD = macdLine[prevIdx];
  const currentSignal = signalLine[currentIdx];
  const prevSignal = signalLine[prevIdx];

  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const currentVolume = volumes[currentIdx];
  const volumeBreakout = currentVolume > avgVolume * 1.5;
  const volumeRatio = currentVolume / avgVolume;

  const recentHigh = Math.max(...candles.slice(-20).map(c => c.high));
  const recentLow = Math.min(...candles.slice(-20).map(c => c.low));
  const currentPrice = prices[currentIdx];
  const prevPrice = prices[prevIdx];

  const hasActiveSignal = existingSignals.some(
    s => s.asset === asset && s.timeframe === timeframe && s.status === 'ACTIVE'
  );

  if (hasActiveSignal) return null;

  let direction: SignalDirection | null = null;
  let macdConfirmation = false;
  let priceActionConfirmation = false;

  if (prevMACD <= prevSignal && currentMACD > currentSignal && currentMACD > 50) {
    direction = 'BUY';
    macdConfirmation = true;
    priceActionConfirmation = currentPrice > recentHigh * 0.99 && currentPrice > prevPrice;
  } else if (prevMACD >= prevSignal && currentMACD < currentSignal && currentMACD < 50) {
    direction = 'SELL';
    macdConfirmation = true;
    priceActionConfirmation = currentPrice < recentLow * 1.01 && currentPrice < prevPrice;
  }

  if (!direction || !macdConfirmation || !priceActionConfirmation || !volumeBreakout) {
    return null;
  }

  const entryPrice = currentPrice;
  const riskDistance = Math.abs(currentPrice - recentLow) * 0.02;
  
  let stopLoss: number;
  let takeProfit: number;

  if (direction === 'BUY') {
    stopLoss = recentLow - riskDistance;
    takeProfit = entryPrice + (entryPrice - stopLoss) * 3;
  } else {
    stopLoss = recentHigh + riskDistance;
    takeProfit = entryPrice - (stopLoss - entryPrice) * 3;
  }

  return {
    id: `${asset}-${timeframe}-${Date.now()}`,
    asset,
    timeframe,
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    timestamp: new Date(),
    status: 'ACTIVE',
    riskRewardRatio: 3,
    macdConfirmation,
    volumeConfirmation: volumeBreakout,
    priceActionConfirmation,
    notes: `${direction} signal: MACD crossover confirmed, volume breakout (${volumeRatio.toFixed(2)}x avg), price action breakout`,
    macdValue: currentMACD,
    volumeRatio
  };
};

export const checkSignalExit = (signal: Signal, currentPrice: number): Signal => {
  if (signal.status !== 'ACTIVE') return signal;

  if (signal.direction === 'BUY') {
    if (currentPrice >= signal.takeProfit) {
      return { ...signal, status: 'CLOSED_TP', exitPrice: currentPrice, exitTimestamp: new Date() };
    }
    if (currentPrice <= signal.stopLoss) {
      return { ...signal, status: 'CLOSED_SL', exitPrice: currentPrice, exitTimestamp: new Date() };
    }
  } else {
    if (currentPrice <= signal.takeProfit) {
      return { ...signal, status: 'CLOSED_TP', exitPrice: currentPrice, exitTimestamp: new Date() };
    }
    if (currentPrice >= signal.stopLoss) {
      return { ...signal, status: 'CLOSED_SL', exitPrice: currentPrice, exitTimestamp: new Date() };
    }
  }

  return signal;
};

export const generateMockCandles = (basePrice: number, count: number): CandleData[] => {
  const candles: CandleData[] = [];
  let price = basePrice;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * basePrice * 0.02;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * basePrice * 0.01;
    const low = Math.min(open, close) - Math.random() * basePrice * 0.01;
    const volume = 1000000 + Math.random() * 5000000;
    
    candles.push({
      timestamp: new Date(Date.now() - (count - i) * 5 * 60 * 1000),
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return candles;
};