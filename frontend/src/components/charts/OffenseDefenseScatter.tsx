import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label,
} from 'recharts';

interface OffenseDefenseScatterProps {
  offRating: number;
  defRating: number;
  teamName: string;
  teamColor: string;
}

export const OffenseDefenseScatter = ({
  offRating,
  defRating,
  teamName,
  teamColor,
}: OffenseDefenseScatterProps) => {
  const data = [{ x: offRating, y: defRating, name: teamName }];

  // NBA average ~112 OffRtg, ~112 DefRtg
  const avgOffense = 112;
  const avgDefense = 112;

  // Determine quadrant with icon
  const getQuadrant = () => {
    if (offRating > avgOffense && defRating < avgDefense)
      return { label: 'Elite', desc: 'Top offense + Top defense', color: 'text-green-400' };
    if (offRating > avgOffense && defRating > avgDefense)
      return { label: 'Offensive Team', desc: 'Strong offense, needs defensive work', color: 'text-orange-400' };
    if (offRating < avgOffense && defRating < avgDefense)
      return { label: 'Defensive Team', desc: 'Strong defense, needs offensive boost', color: 'text-blue-400' };
    return { label: 'Rebuilding', desc: 'Room for improvement on both ends', color: 'text-slate-400' };
  };

  const quadrant = getQuadrant();
  const netRating = offRating - defRating;

  // Custom dot shape with glow
  const CustomDot = (props: { cx?: number; cy?: number }) => {
    const { cx, cy } = props;
    if (!cx || !cy) return null;

    return (
      <g>
        {/* Outer glow */}
        <circle cx={cx} cy={cy} r={20} fill={teamColor} opacity={0.15} />
        <circle cx={cx} cy={cy} r={14} fill={teamColor} opacity={0.3} />
        {/* Main dot */}
        <circle cx={cx} cy={cy} r={8} fill={teamColor} stroke="#fff" strokeWidth={2} />
        {/* Inner highlight */}
        <circle cx={cx - 2} cy={cy - 2} r={2} fill="#fff" opacity={0.6} />
      </g>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">Team Identity</h3>
          <p className={`text-sm font-medium ${quadrant.color}`}>{quadrant.label}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${netRating >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netRating >= 0 ? '+' : ''}{netRating.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500">Net Rating</div>
        </div>
      </div>

      {/* Chart with proper margins */}
      <div className="w-full" style={{ height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 70 }}>
            <defs>
              {/* Gradient for quadrants */}
              <linearGradient id="eliteGradient" x1="1" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

            <XAxis
              type="number"
              dataKey="x"
              name="Offensive Rating"
              domain={[105, 125]}
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
            >
              <Label
                value="Offensive Rating (Higher = Better)"
                position="bottom"
                offset={35}
                style={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }}
              />
            </XAxis>

            <YAxis
              type="number"
              dataKey="y"
              name="Defensive Rating"
              domain={[105, 125]}
              reversed
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickLine={{ stroke: '#475569' }}
            >
              <Label
                value="Defensive Rating (Lower = Better)"
                angle={-90}
                position="left"
                offset={50}
                style={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500, textAnchor: 'middle' }}
              />
            </YAxis>

            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: teamColor }}
              content={({ payload }) => {
                if (payload && payload.length) {
                  const item = payload[0].payload as {
                    name: string;
                    x: number;
                    y: number;
                  };
                  const net = item.x - item.y;
                  return (
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 shadow-xl">
                      <p className="font-bold text-white mb-2">{item.name}</p>
                      <div className="space-y-1 text-sm">
                        <p className="text-slate-300">
                          <span className="text-green-400">Off:</span> {item.x.toFixed(1)}
                        </p>
                        <p className="text-slate-300">
                          <span className="text-blue-400">Def:</span> {item.y.toFixed(1)}
                        </p>
                        <p className={`font-medium ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          Net: {net >= 0 ? '+' : ''}{net.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Reference lines for league average */}
            <ReferenceLine
              x={avgOffense}
              stroke="#f97316"
              strokeDasharray="5 5"
              strokeWidth={2}
            >
              <Label
                value="League Avg"
                position="top"
                fill="#f97316"
                fontSize={11}
              />
            </ReferenceLine>
            <ReferenceLine
              y={avgDefense}
              stroke="#f97316"
              strokeDasharray="5 5"
              strokeWidth={2}
            >
              <Label
                value="League Avg"
                position="right"
                fill="#f97316"
                fontSize={11}
              />
            </ReferenceLine>

            {/* Team point with custom glow shape */}
            <Scatter data={data} shape={<CustomDot />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div
          className="text-center p-4 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
            border: `1px solid ${teamColor}30`,
          }}
        >
          <div className="text-2xl font-bold" style={{ color: teamColor }}>
            {offRating.toFixed(1)}
          </div>
          <div className="text-sm text-slate-400 mt-1">Offensive Rating</div>
          <div className="text-xs text-slate-500">pts/100 poss</div>
        </div>
        <div
          className="text-center p-4 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${teamColor}15 0%, ${teamColor}05 100%)`,
            border: `1px solid ${teamColor}30`,
          }}
        >
          <div className="text-2xl font-bold" style={{ color: teamColor }}>
            {defRating.toFixed(1)}
          </div>
          <div className="text-sm text-slate-400 mt-1">Defensive Rating</div>
          <div className="text-xs text-slate-500">pts allowed/100 poss</div>
        </div>
        <div
          className="text-center p-4 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${netRating >= 0 ? '#22c55e' : '#ef4444'}15 0%, ${netRating >= 0 ? '#22c55e' : '#ef4444'}05 100%)`,
            border: `1px solid ${netRating >= 0 ? '#22c55e' : '#ef4444'}30`,
          }}
        >
          <div className={`text-2xl font-bold ${netRating >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {netRating >= 0 ? '+' : ''}{netRating.toFixed(1)}
          </div>
          <div className="text-sm text-slate-400 mt-1">Net Rating</div>
          <div className="text-xs text-slate-500">differential</div>
        </div>
      </div>

      {/* Quadrant explanation */}
      <div className="mt-4 text-sm text-slate-500 text-center">
        {quadrant.desc}
      </div>
    </div>
  );
};
