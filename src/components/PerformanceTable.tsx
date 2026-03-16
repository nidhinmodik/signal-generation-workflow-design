import { PerformanceMetrics, AggregatedMetrics } from '../types';
import { Award, Target } from 'lucide-react';

interface PerformanceTableProps {
  metrics: PerformanceMetrics[];
  aggregated: AggregatedMetrics;
}

export function PerformanceTable({ metrics, aggregated }: PerformanceTableProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-semibold">Aggregated Performance</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Signals</p>
            <p className="text-2xl font-bold">{aggregated.totalSignals}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Wins</p>
            <p className="text-2xl font-bold text-green-200">{aggregated.totalWins}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Total Losses</p>
            <p className="text-2xl font-bold text-red-200">{aggregated.totalLosses}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4">
            <p className="text-sm opacity-90 mb-1">Win/Loss Ratio</p>
            <p className="text-2xl font-bold">{aggregated.winLossRatio.toFixed(2)}:1</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Target className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Signals Executed Summary</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Asset</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Timeframe</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Signals</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Wins</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Losses</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Win Rate</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Avg R:R</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {metrics.map((metric, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="font-medium text-slate-900">{metric.asset}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-sm font-medium">
                      {metric.timeframe}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-900 font-medium">
                    {metric.totalSignals || '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-semibold">
                      {metric.wins || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600 font-semibold">
                      {metric.losses || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {metric.totalSignals > 0 ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                            style={{ width: `${metric.winRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {metric.winRate.toFixed(1)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-sm font-medium">
                      1:{metric.averageRiskReward}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 max-w-xs">
                    {metric.confirmationRobustness}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}