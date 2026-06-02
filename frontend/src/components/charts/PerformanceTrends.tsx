import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TrendDataPoint {
  game_num: number;
  date: string;
  rolling_ppg: number;
  rolling_opp_ppg: number;
  rolling_win_pct: number;
  rolling_plus_minus: number;
}

interface PerformanceTrendsProps {
  trends: TrendDataPoint[];
  teamColor: string;
}

export const PerformanceTrends = ({
  trends,
  teamColor,
}: PerformanceTrendsProps) => {
  // Calculate trend direction
  const getTrendDirection = () => {
    if (trends.length < 5) return 'neutral';
    const recent = trends.slice(-5);
    const earlier = trends.slice(-10, -5);
    if (earlier.length === 0) return 'neutral';

    const recentAvg = recent.reduce((sum, t) => sum + t.rolling_plus_minus, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, t) => sum + t.rolling_plus_minus, 0) / earlier.length;

    if (recentAvg > earlierAvg + 1) return 'up';
    if (recentAvg < earlierAvg - 1) return 'down';
    return 'neutral';
  };

  const trendDirection = getTrendDirection();
  const latestData = trends.length > 0 ? trends[trends.length - 1] : null;

  // Get performance rating based on plus/minus
  const getPerformanceRating = () => {
    if (!latestData) return { label: 'No Data', color: 'text-slate-400' };
    const pm = latestData.rolling_plus_minus;
    if (pm >= 8) return { label: 'Dominant', color: 'text-green-400' };
    if (pm >= 3) return { label: 'Strong', color: 'text-blue-400' };
    if (pm >= -3) return { label: 'Average', color: 'text-yellow-400' };
    if (pm >= -8) return { label: 'Struggling', color: 'text-orange-400' };
    return { label: 'Rebuilding', color: 'text-red-400' };
  };

  const rating = getPerformanceRating();

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${teamColor}20` }}
          >
            <Activity className="w-5 h-5" style={{ color: teamColor }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Performance Trends</h3>
            <p className="text-sm text-slate-400">Rolling 10-Game Average</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 ${rating.color}`}>
            {trendDirection === 'up' && <TrendingUp className="w-4 h-4" />}
            {trendDirection === 'down' && <TrendingDown className="w-4 h-4" />}
            <span className="font-semibold">{rating.label}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trends} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <defs>
              {/* Team color gradient for area */}
              <linearGradient id="teamGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={teamColor} stopOpacity={0.4} />
                <stop offset="100%" stopColor={teamColor} stopOpacity={0} />
              </linearGradient>
              {/* Opponent gradient */}
              <linearGradient id="oppGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              {/* Glow filters */}
              <filter id="teamGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />

            <XAxis
              dataKey="game_num"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
              axisLine={{ stroke: '#475569' }}
              label={{
                value: 'Game Number',
                position: 'bottom',
                fill: '#94a3b8',
                offset: 20,
                style: { fontSize: 13, fontWeight: 500 }
              }}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
              axisLine={{ stroke: '#475569' }}
              domain={['dataMin - 3', 'dataMax + 3']}
            />

            <Tooltip
              content={({ payload, label }) => {
                if (payload && payload.length) {
                  const data = payload[0].payload as TrendDataPoint;
                  const diff = data.rolling_ppg - data.rolling_opp_ppg;
                  return (
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-600 shadow-xl">
                      <p className="font-bold text-white mb-2">Game {label}</p>
                      <p className="text-sm text-slate-400 mb-3">{data.date}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-300">Team PPG:</span>
                          <span className="font-semibold" style={{ color: teamColor }}>
                            {data.rolling_ppg.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-300">Opp PPG:</span>
                          <span className="font-semibold text-red-400">
                            {data.rolling_opp_ppg.toFixed(1)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-slate-600">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-slate-300">Differential:</span>
                            <span className={`font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Reference line at average */}
            <ReferenceLine
              y={110}
              stroke="#f97316"
              strokeDasharray="5 5"
              strokeWidth={1}
              label={{ value: 'Avg ~110', fill: '#f97316', fontSize: 10, position: 'right' }}
            />

            {/* Area fills */}
            <Area
              type="monotone"
              dataKey="rolling_ppg"
              fill="url(#teamGradient)"
              stroke="none"
            />
            <Area
              type="monotone"
              dataKey="rolling_opp_ppg"
              fill="url(#oppGradient)"
              stroke="none"
            />

            {/* Lines with glow */}
            <Line
              type="monotone"
              dataKey="rolling_ppg"
              stroke={teamColor}
              strokeWidth={3}
              name="Team PPG"
              dot={false}
              activeDot={{ r: 6, fill: teamColor, stroke: '#fff', strokeWidth: 2 }}
              filter="url(#teamGlow)"
            />
            <Line
              type="monotone"
              dataKey="rolling_opp_ppg"
              stroke="#ef4444"
              strokeWidth={3}
              name="Opp PPG"
              dot={false}
              activeDot={{ r: 6, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded" style={{ backgroundColor: teamColor }} />
          <span className="text-sm text-slate-300">Team PPG</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded bg-red-500" />
          <span className="text-sm text-slate-300">Opponent PPG</span>
        </div>
      </div>

      {/* Stats Grid */}
      {latestData && (
        <div className="grid grid-cols-4 gap-3 mt-6">
          <div
            className="text-center p-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
              border: `1px solid ${teamColor}30`,
            }}
          >
            <div className="text-2xl font-bold" style={{ color: teamColor }}>
              {latestData.rolling_ppg.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Current PPG</div>
          </div>
          <div
            className="text-center p-3 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, #ef444415 0%, #ef444405 100%)',
              border: '1px solid #ef444430',
            }}
          >
            <div className="text-2xl font-bold text-red-400">
              {latestData.rolling_opp_ppg.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Opp PPG</div>
          </div>
          <div
            className="text-center p-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
              border: `1px solid ${teamColor}30`,
            }}
          >
            <div className="text-2xl font-bold" style={{ color: teamColor }}>
              {latestData.rolling_win_pct.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">Win Rate</div>
          </div>
          <div
            className="text-center p-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${latestData.rolling_plus_minus >= 0 ? '#22c55e' : '#ef4444'}15 0%, ${latestData.rolling_plus_minus >= 0 ? '#22c55e' : '#ef4444'}05 100%)`,
              border: `1px solid ${latestData.rolling_plus_minus >= 0 ? '#22c55e' : '#ef4444'}30`,
            }}
          >
            <div className={`text-2xl font-bold ${latestData.rolling_plus_minus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {latestData.rolling_plus_minus >= 0 ? '+' : ''}{latestData.rolling_plus_minus.toFixed(1)}
            </div>
            <div className="text-xs text-slate-400 mt-1">+/- Avg</div>
          </div>
        </div>
      )}
    </div>
  );
};
