import { Signal } from '../types';
import { TrendingUp, TrendingDown, Target, Shield, Clock, CheckCircle, XCircle } from 'lucide-react';

interface SignalCardProps {
  signal: Signal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const isBuy = signal.direction === 'BUY';
  const isActive = signal.status === 'ACTIVE';
  const isWin = signal.status === 'CLOSED_TP';

  const statusColor = isActive ? 'bg-blue-500' : isWin ? 'bg-green-500' : 'bg-red-500';
  const statusText = isActive ? 'ACTIVE' : isWin ? 'TP HIT' : 'SL HIT';
  const StatusIcon = isActive ? Clock : isWin ? CheckCircle : XCircle;

  const profitLoss = signal.exitPrice 
    ? isBuy 
      ? ((signal.exitPrice - signal.entryPrice) / signal.entryPrice * 100)
      : ((signal.entryPrice - signal.exitPrice) / signal.entryPrice * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isBuy ? 'bg-green-100' : 'bg-red-100'}`}>
            {isBuy ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{signal.asset}</h3>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {signal.timeframe}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {signal.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusColor} bg-opacity-10`}>
          <StatusIcon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : isWin ? 'text-green-600' : 'text-red-600'}`} />
          <span className={`text-xs font-medium ${isActive ? 'text-blue-700' : isWin ? 'text-green-700' : 'text-red-700'}`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Entry</p>
          <p className="font-semibold text-slate-900">${signal.entryPrice.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <Shield className="w-3 h-3 text-red-600" />
            <p className="text-xs text-red-600">SL</p>
          </div>
          <p className="font-semibold text-red-700">${signal.stopLoss.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-1 mb-1">
            <Target className="w-3 h-3 text-green-600" />
            <p className="text-xs text-green-600">TP</p>
          </div>
          <p className="font-semibold text-green-700">${signal.takeProfit.toFixed(2)}</p>
        </div>
      </div>

      {signal.exitPrice && (
        <div className={`rounded-lg p-3 mb-3 ${isWin ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Exit Price</span>
            <span className="font-semibold text-slate-900">${signal.exitPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-slate-600">P&L</span>
            <span className={`font-bold ${isWin ? 'text-green-600' : 'text-red-600'}`}>
              {isWin ? '+' : ''}{profitLoss.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${signal.macdConfirmation ? 'bg-green-500' : 'bg-slate-300'}`} />
        <span className="text-slate-600">MACD</span>
        <div className={`w-2 h-2 rounded-full ml-2 ${signal.volumeConfirmation ? 'bg-green-500' : 'bg-slate-300'}`} />
        <span className="text-slate-600">Volume</span>
        <div className={`w-2 h-2 rounded-full ml-2 ${signal.priceActionConfirmation ? 'bg-green-500' : 'bg-slate-300'}`} />
        <span className="text-slate-600">Price Action</span>
        <span className="ml-auto font-medium text-slate-700">1:{signal.riskRewardRatio}</span>
      </div>
    </div>
  );
}