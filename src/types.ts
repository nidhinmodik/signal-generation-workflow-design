export type Asset = 'BTC' | 'ETH' | 'XRP' | 'SOL';
export type Timeframe = '5min' | '15min' | '1hour';
export type SignalDirection = 'BUY' | 'SELL';
export type SignalStatus = 'ACTIVE' | 'CLOSED_TP' | 'CLOSED_SL' | 'PENDING';

export interface Signal {
  id: string;
  asset: Asset;
  timeframe: Timeframe;
  direction: SignalDirection;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timestamp: Date;
  status: SignalStatus;
  exitPrice?: number;
  exitTimestamp?: Date;
  riskRewardRatio: number;
  macdConfirmation: boolean;
  volumeConfirmation: boolean;
  priceActionConfirmation: boolean;
  notes?: string;
  macdValue?: number;
  volumeRatio?: number;
}

export interface PerformanceMetrics {
  asset: Asset;
  timeframe: Timeframe;
  totalSignals: number;
  wins: number;
  losses: number;
  winRate: number;
  averageRiskReward: number;
  confirmationRobustness: string;
}

export interface AggregatedMetrics {
  totalSignals: number;
  totalWins: number;
  totalLosses: number;
  winLossRatio: number;
  overallWinRate: number;
}

export interface CandleData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDData {
  macdLine: number;
  signalLine: number;
  histogram: number;
}

export interface ChartDataPoint {
  timestamp: string;
  price: number;
  macd: number;
  signal: number;
  histogram: number;
  volume: number;
}