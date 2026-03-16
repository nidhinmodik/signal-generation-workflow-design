import { Signal } from '../types';
import { TrendingUp, TrendingDown, Target, Shield, Activity, BarChart3, CheckCircle2 } from 'lucide-react';

interface SignalDetailsProps {
  signal: Signal;
}

export function SignalDetails({ signal }: SignalDetailsProps) {
  const isBuy = signal.direction === 'BUY';
  const riskAmount = Math.abs(signal.entryPrice - signal.stopLoss);
  const rewardAmount = Math.abs(signal.takeProfit - signal.entryPrice);
  const potentialProfit = (rewardAmount / signal.entryPrice) * 100;
  const potentialLoss = (riskAmount / signal.entryPrice) * 100;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${isBuy ? 'bg-green-100' : 'bg-red-100'}`}>
          {isBuy ? (
            <TrendingUp className="w-6 h-6 text-green-600" />
          ) : (
            <TrendingDown className="w-6 h-6 text-red-600" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">
            {signal.asset} {signal.direction} Signal
          </h3>
          <p className="text-sm text-slate-500">{signal.timeframe} timeframe</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-medium text-slate-500 uppercase">Entry Price</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">${signal.entryPrice.toFixed(2)}</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-red-600" />
            <p className="text-xs font-medium text-red-600 uppercase">Stop Loss</p>
          </div>
          <p className="text-2xl font-bold text-red-700">${signal.stopLoss.toFixed(2)}</p>
          <p className="text-xs text-red-600 mt-1">Risk: {potentialLoss.toFixed(2)}%</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-600 uppercase">Take Profit</p>
          </div>
          <p className="text-2xl font-bold text-green-700">${signal.takeProfit.toFixed(2)}</p>
          <p className="text-xs text-green-600 mt-1">Reward: +{potentialProfit.toFixed(2)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-slate-200 mb-4">
        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Confirmation Checklist
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                signal.macdConfirmation ? 'bg-green-100' : 'bg-slate-100'
              }`}>
                {signal.macdConfirmation && <CheckCircle2 className="w-3 h-3 text-green-600" />}
              </div>
              <span className="text-sm text-slate-700">MACD Crossover</span>
            </div>
            <div className="flex items-center gap-2">
              {signal.macdValue && (
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                  {signal.macdValue.toFixed(2)}
                </span>
              )}
              <span className={`text-xs font-medium ${
                signal.macdConfirmation ? 'text-green-600' : 'text-slate-400'
              }`}>
                {signal.macdConfirmation ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                signal.volumeConfirmation ? 'bg-green-100' : 'bg-slate-100'
              }`}>
                {signal.volumeConfirmation && <CheckCircle2 className="w-3 h-3 text-green-600" />}
              </div>
              <span className="text-sm text-slate-700">Volume Breakout</span>
            </div>
            <div className="flex items-center gap-2">
              {signal.volumeRatio && (
                <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded font-medium">
                  {signal.volumeRatio.toFixed(2)}x avg
                </span>
              )}
              <span className={`text-xs font-medium ${
                signal.volumeConfirmation ? 'text-green-600' : 'text-slate-400'
              }`}>
                {signal.volumeConfirmation ? 'Confirmed' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                signal.priceActionConfirmation ? 'bg-green-100' : 'bg-slate-100'
              }`}>
                {signal.priceActionConfirmation && <CheckCircle2 className="w-3 h-3 text-green-600" />}
              </div>
              <span className="text-sm text-slate-700">Price Action Breakout</span>
            </div>
            <span className={`text-xs font-medium ${
              signal.priceActionConfirmation ? 'text-green-600' : 'text-slate-400'
            }`}>
              {signal.priceActionConfirmation ? 'Confirmed' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-4 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-indigo-600 uppercase mb-1">Risk : Reward Ratio</p>
            <p className="text-3xl font-bold text-indigo-700">1:{signal.riskRewardRatio}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-indigo-600 mb-1">Signal Time</p>
            <p className="text-sm font-medium text-indigo-900">
              {signal.timestamp.toLocaleTimeString()}
            </p>
            <p className="text-xs text-indigo-600">
              {signal.timestamp.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {signal.notes && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600">{signal.notes}</p>
        </div>
      )}
    </div>
  );
}