import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar } from 'recharts';
import { CandleData, Signal } from '../types';
import { calculateMACD } from '../utils/tradingLogic';

interface PriceChartProps {
  candles: CandleData[];
  signal?: Signal;
  asset: string;
}

export function PriceChart({ candles, signal, asset }: PriceChartProps) {
  if (candles.length < 50) return null;

  const prices = candles.map(c => c.close);
  const { macdLine, signalLine, histogram } = calculateMACD(prices);

  const chartData = candles.slice(-50).map((candle, idx) => {
    const dataIdx = candles.length - 50 + idx;
    return {
      timestamp: candle.timestamp.toLocaleTimeString(),
      price: candle.close,
      high: candle.high,
      low: candle.low,
      macd: macdLine[dataIdx] || 0,
      signal: signalLine[dataIdx] || 0,
      histogram: histogram[dataIdx] || 0,
      volume: candle.volume / 1000000
    };
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900">{asset} Price & MACD</h3>
        {signal && (
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            signal.direction === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {signal.direction} Signal Active
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-2">Price Action</p>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 10 }} 
                stroke="#64748b"
                interval={9}
              />
              <YAxis 
                domain={['dataMin - 100', 'dataMax + 100']}
                tick={{ fontSize: 10 }} 
                stroke="#64748b"
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={false}
                name="Price"
              />
              {signal && (
                <>
                  <ReferenceLine 
                    y={signal.entryPrice} 
                    stroke="#3b82f6" 
                    strokeDasharray="5 5"
                    label={{ value: 'Entry', fill: '#3b82f6', fontSize: 10 }}
                  />
                  <ReferenceLine 
                    y={signal.takeProfit} 
                    stroke="#10b981" 
                    strokeDasharray="5 5"
                    label={{ value: 'TP', fill: '#10b981', fontSize: 10 }}
                  />
                  <ReferenceLine 
                    y={signal.stopLoss} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    label={{ value: 'SL', fill: '#ef4444', fontSize: 10 }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-slate-500 mb-2">MACD (12, 26, 9)</p>
          <ResponsiveContainer width="100%" height={150}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="timestamp" 
                tick={{ fontSize: 10 }} 
                stroke="#64748b"
                interval={9}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                stroke="#64748b"
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="histogram" fill="#94a3b8" name="Histogram" />
              <Line 
                type="monotone" 
                dataKey="macd" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                name="MACD"
              />
              <Line 
                type="monotone" 
                dataKey="signal" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                name="Signal"
              />
              <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
              <ReferenceLine y={50} stroke="#10b981" strokeDasharray="3 3" />
              <ReferenceLine y={-50} stroke="#ef4444" strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}