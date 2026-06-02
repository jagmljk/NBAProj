import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface FourFactorsRadarProps {
  fourFactors: {
    efg_pct: number;
    tov_pct: number;
    orb_pct: number;
    ftr: number;
    ts_pct: number;
  };
  teamColor: string;
}

export const FourFactorsRadar = ({
  fourFactors,
  teamColor,
}: FourFactorsRadarProps) => {
  // Normalize data to 0-100 scale for radar chart
  // Higher is better for all metrics in this visualization
  const data = [
    {
      factor: 'eFG%',
      value: Math.min(100, (fourFactors.efg_pct / 60) * 100), // Normalize to 100 (60% is elite)
      rawValue: fourFactors.efg_pct,
      unit: '%',
      description: 'Effective Field Goal %',
    },
    {
      factor: 'Low TOV',
      value: Math.min(100, ((20 - fourFactors.tov_pct) / 12) * 100), // Inverse (lower is better)
      rawValue: fourFactors.tov_pct,
      unit: '%',
      description: 'Turnover Rate (lower = better)',
    },
    {
      factor: 'ORB%',
      value: Math.min(100, (fourFactors.orb_pct / 35) * 100), // Normalize (35% is elite)
      rawValue: fourFactors.orb_pct,
      unit: '%',
      description: 'Offensive Rebound %',
    },
    {
      factor: 'FT Rate',
      value: Math.min(100, (fourFactors.ftr / 0.35) * 100), // Normalize (0.35 is elite)
      rawValue: fourFactors.ftr,
      unit: '',
      description: 'Free Throw Rate',
    },
    {
      factor: 'TS%',
      value: Math.min(100, (fourFactors.ts_pct / 65) * 100), // Normalize (65% is elite)
      rawValue: fourFactors.ts_pct,
      unit: '%',
      description: 'True Shooting %',
    },
  ];

  // Calculate overall rating
  const avgScore = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const rating = avgScore >= 80 ? 'Elite' : avgScore >= 60 ? 'Good' : avgScore >= 40 ? 'Average' : 'Below Average';
  const ratingColor = avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-blue-400' : avgScore >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">Four Factors</h3>
          <p className="text-sm text-slate-400">Dean Oliver's winning metrics</p>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${ratingColor}`}>{rating}</div>
          <div className="text-xs text-slate-500">Overall</div>
        </div>
      </div>

      {/* Radar Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={teamColor} stopOpacity={0.8} />
              <stop offset="100%" stopColor={teamColor} stopOpacity={0.2} />
            </linearGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <PolarGrid stroke="#475569" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="factor"
            stroke="#94a3b8"
            tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickCount={5}
          />

          <Tooltip
            content={({ payload }) => {
              if (payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-xl">
                    <p className="font-bold text-white mb-1">{d.description}</p>
                    <p className="text-lg font-semibold" style={{ color: teamColor }}>
                      {d.rawValue.toFixed(d.unit === '' ? 3 : 1)}{d.unit}
                    </p>
                    <div className="text-xs text-slate-400 mt-1">
                      Score: {d.value.toFixed(0)}/100
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Radar
            name="Team Performance"
            dataKey="value"
            stroke={teamColor}
            strokeWidth={2}
            fill="url(#radarGradient)"
            filter="url(#glow)"
            dot={{
              r: 4,
              fill: teamColor,
              stroke: '#fff',
              strokeWidth: 2,
            }}
            activeDot={{
              r: 6,
              fill: teamColor,
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-2 mt-4">
        {[
          { label: 'eFG%', value: fourFactors.efg_pct, format: (v: number) => `${v}%` },
          { label: 'TOV%', value: fourFactors.tov_pct, format: (v: number) => `${v}%`, inverse: true },
          { label: 'ORB%', value: fourFactors.orb_pct, format: (v: number) => `${v}%` },
          { label: 'FT Rate', value: fourFactors.ftr, format: (v: number) => v.toFixed(3) },
          { label: 'TS%', value: fourFactors.ts_pct, format: (v: number) => `${v}%` },
        ].map((stat, i) => (
          <div
            key={i}
            className="text-center p-2 rounded-lg bg-slate-700/30"
          >
            <div className="text-lg font-bold" style={{ color: teamColor }}>
              {stat.format(stat.value)}
            </div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 text-xs text-slate-500 text-center">
        Higher scores indicate better performance (TOV% is inverted - lower is better)
      </div>
    </div>
  );
};
