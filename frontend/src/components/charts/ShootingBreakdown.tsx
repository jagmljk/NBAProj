import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Target } from 'lucide-react';

interface ShootingBreakdownProps {
  threePointAttempts: number;
  twoPointAttempts: number;
  freeThrowAttempts: number;
  teamColor: string;
}

export const ShootingBreakdown = ({
  threePointAttempts,
  twoPointAttempts,
  freeThrowAttempts,
  teamColor,
}: ShootingBreakdownProps) => {
  const total = threePointAttempts + twoPointAttempts + freeThrowAttempts;

  const data = [
    {
      name: '3-Pointers',
      fullName: '3-Point Attempts',
      value: threePointAttempts,
      pct: ((threePointAttempts / total) * 100),
      icon: '🎯',
    },
    {
      name: '2-Pointers',
      fullName: '2-Point Attempts',
      value: twoPointAttempts,
      pct: ((twoPointAttempts / total) * 100),
      icon: '🏀',
    },
    {
      name: 'Free Throws',
      fullName: 'Free Throw Attempts',
      value: freeThrowAttempts,
      pct: ((freeThrowAttempts / total) * 100),
      icon: '⭐',
    },
  ];

  // Create distinct colors
  const COLORS = [
    teamColor,           // Primary team color for 3PT
    '#22c55e',           // Green for 2PT
    '#f97316',           // Orange for FT
  ];

  // Determine team style based on 3PT rate
  const threePointRate = (threePointAttempts / total) * 100;
  const getTeamStyle = () => {
    if (threePointRate >= 40) return { label: 'Modern Pace', desc: 'Heavy 3PT emphasis', color: 'text-blue-400' };
    if (threePointRate >= 30) return { label: 'Balanced', desc: 'Mix of inside-out', color: 'text-green-400' };
    return { label: 'Paint Focus', desc: 'Traditional style', color: 'text-orange-400' };
  };
  const teamStyle = getTeamStyle();

  // Custom label renderer
  const renderCustomizedLabel = (props: {
    cx?: number;
    cy?: number;
    midAngle?: number;
    innerRadius?: number;
    outerRadius?: number;
    percent?: number;
  }) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) return null;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.08) return null; // Don't show label if segment is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: '14px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${teamColor}20` }}
          >
            <Target className="w-5 h-5" style={{ color: teamColor }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Shot Distribution</h3>
            <p className="text-sm text-slate-400">Attempts per game breakdown</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${teamStyle.color}`}>{teamStyle.label}</div>
          <div className="text-xs text-slate-500">{teamStyle.desc}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: '260px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {/* Gradients for each slice */}
              {COLORS.map((color, index) => (
                <linearGradient key={`gradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={1} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                </linearGradient>
              ))}
              {/* Glow filter */}
              <filter id="pieGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={2}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`url(#pieGradient-${index})`}
                  style={{ filter: 'url(#pieGlow)' }}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (payload && payload.length) {
                  const item = payload[0].payload as {
                    fullName: string;
                    value: number;
                    pct: number;
                    icon: string;
                  };
                  return (
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-xl">
                      <p className="font-bold text-white mb-1">{item.fullName}</p>
                      <p className="text-lg font-semibold" style={{ color: COLORS[data.findIndex(d => d.fullName === item.fullName)] }}>
                        {item.value.toFixed(1)} per game
                      </p>
                      <p className="text-sm text-slate-400">
                        {item.pct.toFixed(1)}% of total shots
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center stat */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{total.toFixed(0)}</div>
            <div className="text-xs text-slate-400">Total FGA</div>
          </div>
        </div>
      </div>

      {/* Legend/Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {data.map((item, i) => (
          <div
            key={i}
            className="text-center p-3 rounded-lg transition-transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${COLORS[i]}15 0%, ${COLORS[i]}05 100%)`,
              border: `1px solid ${COLORS[i]}30`,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[i] }}
              />
              <span className="text-xs text-slate-400">{item.name}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS[i] }}>
              {item.value.toFixed(1)}
            </div>
            <div className="text-xs text-slate-500">{item.pct.toFixed(1)}%</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        Modern NBA teams typically attempt 35-45% of shots from three
      </div>
    </div>
  );
};
