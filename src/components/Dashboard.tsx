import { useState, useEffect } from 'react';
import { Signal, PerformanceMetrics, AggregatedMetrics, Asset, Timeframe, CandleData } from '../types';
import { detectSignal, checkSignalExit } from '../utils/tradingLogic';
import { fetchCandleData } from '../services/marketDataService';
import { SignalCard } from './SignalCard';
import { PerformanceTable } from './PerformanceTable';
import { PriceChart } from './PriceChart';
import { SignalDetails } from './SignalDetails';
import { Activity, PlayCircle, PauseCircle, RefreshCw, BarChart3, Eye } from 'lucide-react';

const ASSETS: Asset[] = ['BTC', 'ETH', 'XRP', 'SOL'];
const TIMEFRAMES: Timeframe[] = ['5min', '15min', '1hour'];

export function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [candles, setCandles] = useState<Record<string, CandleData[]>>({});
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'detailed'>('grid');
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...');
  const [dataError, setDataError] = useState<string | null>(null);

  // Initialize real-time market data from Binance
  useEffect(() => {
    const initializeMarketData = async () => {
      try {
        setLoadingStatus('Fetching live market data from Binance...');
        const initialCandles: Record<string, CandleData[]> = {};
        
        for (const asset of ASSETS) {
          for (const tf of TIMEFRAMES) {
            const key = `${asset}-${tf}`;
            try {
              const data = await fetchCandleData(asset, tf, 100);
              if (data && data.length > 0) {
                initialCandles[key] = data;
              } else {
                throw new Error(`No data received for ${asset} ${tf}`);
              }
            } catch (err) {
              console.error(`Failed to fetch ${asset} ${tf}:`, err);
              initialCandles[key] = [];
            }
          }
        }
        
        setCandles(initialCandles);
        setLoadingStatus('');
        setDataError(null);
      } catch (error) {
        const errorMsg = `Failed to initialize market data: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(errorMsg);
        setDataError(errorMsg);
        setLoadingStatus('');
      }
    };

    initializeMarketData();
  }, []);

  // Fetch fresh data every 2 seconds when running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        // Fetch latest data from Binance for all assets/timeframes
        const newCandles = { ...candles };
        
        for (const asset of ASSETS) {
          for (const tf of TIMEFRAMES) {
            const key = `${asset}-${tf}`;
            try {
              const freshData = await fetchCandleData(asset, tf, 100);
              if (freshData && freshData.length > 0) {
                newCandles[key] = freshData;
              }
            } catch (err) {
              // Keep existing data if fetch fails
              console.warn(`Failed to refresh ${asset} ${tf}:`, err);
            }
          }
        }
        
        setCandles(newCandles);

        // Process signals with fresh data
        setSignals(prevSignals => {
          let updatedSignals = [...prevSignals];
          
          ASSETS.forEach(asset => {
            TIMEFRAMES.forEach(tf => {
              const key = `${asset}-${tf}`;
              const assetCandles = newCandles[key] || [];
              if (assetCandles.length < 50) return;
              
              const currentPrice = assetCandles[assetCandles.length - 1]?.close;
              if (!currentPrice) return;
              
              // Check exits for active signals
              updatedSignals = updatedSignals.map(signal => {
                if (signal.asset === asset && signal.timeframe === tf) {
                  return checkSignalExit(signal, currentPrice);
                }
                return signal;
              });
              
              // Detect new signals
              const newSignal = detectSignal(assetCandles, asset, tf, updatedSignals);
              if (newSignal) {
                updatedSignals.push(newSignal);
              }
            });
          });
          
          return updatedSignals;
        });
      } catch (error) {
        console.error('Error in data refresh cycle:', error);
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [isRunning]);

  const calculateMetrics = (): { metrics: PerformanceMetrics[], aggregated: AggregatedMetrics } => {
    const metrics: PerformanceMetrics[] = [];
    
    ASSETS.forEach(asset => {
      TIMEFRAMES.forEach(tf => {
        const assetSignals = signals.filter(s => s.asset === asset && s.timeframe === tf);
        const closedSignals = assetSignals.filter(s => s.status !== 'ACTIVE' && s.status !== 'PENDING');
        const wins = closedSignals.filter(s => s.status === 'CLOSED_TP').length;
        const losses = closedSignals.filter(s => s.status === 'CLOSED_SL').length;
        const total = wins + losses;
        
        metrics.push({
          asset,
          timeframe: tf,
          totalSignals: total,
          wins,
          losses,
          winRate: total > 0 ? (wins / total) * 100 : 0,
          averageRiskReward: 3,
          confirmationRobustness: getConfirmationNote(asset, tf)
        });
      });
    });
    
    const totalWins = metrics.reduce((sum, m) => sum + m.wins, 0);
    const totalLosses = metrics.reduce((sum, m) => sum + m.losses, 0);
    const totalSignals = totalWins + totalLosses;
    
    const aggregated: AggregatedMetrics = {
      totalSignals,
      totalWins,
      totalLosses,
      winLossRatio: totalLosses > 0 ? totalWins / totalLosses : totalWins,
      overallWinRate: totalSignals > 0 ? (totalWins / totalSignals) * 100 : 0
    };
    
    return { metrics, aggregated };
  };

  const getConfirmationNote = (asset: Asset, tf: Timeframe): string => {
    const notes: Record<string, string> = {
      'BTC-5min': 'MACD 9/21 vs 50/100, volume breakout, breakout candle closes above resistance',
      'BTC-15min': 'Same as above and higher timeframe structure alignment',
      'BTC-1hour': 'Same with confirmed trend structure and credible breakout beyond resistance',
      'ETH-5min': 'Same confirmation layers',
      'ETH-15min': 'Same plus clean swing levels',
      'ETH-1hour': 'Same plus breakout validation',
      'XRP-5min': 'Same',
      'XRP-15min': 'Same',
      'XRP-1hour': 'Same',
      'SOL-5min': 'Same',
      'SOL-15min': 'Same',
      'SOL-1hour': 'Same'
    };
    return notes[`${asset}-${tf}`] || 'Standard confirmation layers';
  };

  const { metrics, aggregated } = calculateMetrics();
  const activeSignals = signals.filter(s => s.status === 'ACTIVE');
  const closedSignals = signals.filter(s => s.status !== 'ACTIVE').slice(-12).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-zinc-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {dataError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="text-red-600 mt-0.5">⚠️</div>
            <div>
              <p className="font-semibold text-red-900">Connection Error</p>
              <p className="text-sm text-red-700">{dataError}</p>
              <p className="text-xs text-red-600 mt-1">The system will continue with cached data if available.</p>
            </div>
          </div>
        )}

        {loadingStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <div className="text-blue-600 mt-0.5 animate-spin">⚙️</div>
            <p className="text-blue-700 font-medium">{loadingStatus}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Trading Signal System</h1>
                <p className="text-slate-500 flex items-center gap-2">MACD + Volume + Price Action Confirmation
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">Live Binance API</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                    viewMode === 'detailed' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  isRunning
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200'
                }`}
              >
                {isRunning ? (
                  <>
                    <PauseCircle className="w-5 h-5" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Start
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setSignals([]);
                  setSelectedSignal(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              <p className="text-xl font-bold text-slate-900">{isRunning ? 'Running' : 'Stopped'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Active Signals</p>
            <p className="text-xl font-bold text-blue-600">{activeSignals.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Win Rate</p>
            <p className="text-xl font-bold text-green-600">{aggregated.overallWinRate.toFixed(1)}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <p className="text-sm text-slate-500 mb-1">Risk:Reward</p>
            <p className="text-xl font-bold text-indigo-600">1:3</p>
          </div>
        </div>

        {viewMode === 'detailed' && selectedSignal && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SignalDetails signal={selectedSignal} />
            <PriceChart 
              candles={candles[`${selectedSignal.asset}-${selectedSignal.timeframe}`] || []} 
              signal={selectedSignal}
              asset={selectedSignal.asset}
            />
          </div>
        )}

        {viewMode === 'detailed' && !selectedSignal && activeSignals.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-blue-700">Click on an active signal below to view detailed analysis</p>
          </div>
        )}

        {activeSignals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSignals.map(signal => (
                <div 
                  key={signal.id} 
                  onClick={() => setSelectedSignal(signal)}
                  className={`cursor-pointer transition-all ${
                    selectedSignal?.id === signal.id ? 'ring-2 ring-indigo-500 rounded-xl' : ''
                  }`}
                >
                  <SignalCard signal={signal} />
                </div>
              ))}
            </div>
          </div>
        )}

        {closedSignals.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Closed Signals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          </div>
        )}

        <PerformanceTable metrics={metrics} aggregated={aggregated} />

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Workflow Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">1. Signal Detection</h4>
              <p className="text-slate-600">MACD crossover + Volume breakout + Price action confirmation across 5min, 15min, 1hour timeframes</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">2. Risk/Reward Design</h4>
              <p className="text-slate-600">Enforced 1:3 ratio with SL beyond swing levels to avoid noise-based stop outs</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2">3. Signal Gating</h4>
              <p className="text-slate-600">Only one active position per asset/timeframe. Next signal only after TP/SL closure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}