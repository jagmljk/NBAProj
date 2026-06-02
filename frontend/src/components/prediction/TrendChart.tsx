import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TeamTrend } from '../../types';

interface TrendSparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

export function TrendSparkline({ data, color = '#10B981', height = 40 }: TrendSparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`sparkline-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#sparkline-${color.replace('#', '')})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface MomentumIndicatorProps {
  direction: 'rising' | 'falling' | 'stable';
  score: number;
}

export function MomentumIndicator({ direction, score }: MomentumIndicatorProps) {
  const Icon = direction === 'rising' ? TrendingUp : direction === 'falling' ? TrendingDown : Minus;
  const color = direction === 'rising' ? 'text-success' : direction === 'falling' ? 'text-error' : 'text-slate-400';
  const bg = direction === 'rising' ? 'bg-success/10' : direction === 'falling' ? 'bg-error/10' : 'bg-slate-500/10';

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full", bg)}>
      <Icon className={cn("w-4 h-4", color)} />
      <span className={cn("text-sm font-medium", color)}>
        {direction === 'rising' ? '+' : direction === 'falling' ? '-' : ''}
        {Math.abs(score).toFixed(1)}
      </span>
    </div>
  );
}

interface TeamTrendCardProps {
  team: TeamTrend;
  rank: number;
}

export function TeamTrendCard({ team, rank }: TeamTrendCardProps) {
  const isHot = team.trend_type === 'hot';
  const isCold = team.trend_type === 'cold';

  // Generate fake sparkline data based on trend
  const generateSparklineData = () => {
    const base = 50;
    const trend = team.momentum_direction === 'rising' ? 2 : team.momentum_direction === 'falling' ? -2 : 0;
    return Array.from({ length: 10 }, (_, i) => {
      const noise = (Math.random() - 0.5) * 10;
      return base + (trend * i) + noise;
    });
  };

  const sparklineColor = isHot ? '#10B981' : isCold ? '#EF4444' : '#64748B';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={cn(
        "p-4 rounded-xl border transition-all hover:scale-[1.02]",
        isHot ? "bg-success/5 border-success/20 hover:border-success/40" :
        isCold ? "bg-error/5 border-error/20 hover:border-error/40" :
        "bg-surface-elevated border-surface-border hover:border-surface-hover"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold",
            isHot ? "bg-success/20 text-success" :
            isCold ? "bg-error/20 text-error" :
            "bg-slate-500/20 text-slate-400"
          )}>
            {rank}
          </div>
          <div>
            <div className="font-medium text-white">{team.team_name}</div>
            <div className="text-xs text-slate-400">
              {team.last_10_record} L10 • {team.current_streak}
            </div>
          </div>
        </div>
        <MomentumIndicator direction={team.momentum_direction} score={team.trend_score} />
      </div>

      {/* Sparkline */}
      <div className="h-10 mt-2">
        <TrendSparkline data={generateSparklineData()} color={sparklineColor} />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 text-xs">
        <div>
          <span className="text-slate-500">Avg Margin L10</span>
          <span className={cn(
            "ml-2 font-medium",
            team.avg_margin_last_10 > 0 ? "text-success" : team.avg_margin_last_10 < 0 ? "text-error" : "text-slate-400"
          )}>
            {team.avg_margin_last_10 > 0 ? '+' : ''}{team.avg_margin_last_10.toFixed(1)}
          </span>
        </div>
        <div>
          <span className="text-slate-500">Season Win %</span>
          <span className="ml-2 font-medium text-white">
            {(team.season_win_pct * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

interface TrendingTeamsGridProps {
  hotTeams: TeamTrend[];
  coldTeams: TeamTrend[];
  limit?: number;
}

export function TrendingTeamsGrid({ hotTeams, coldTeams, limit = 5 }: TrendingTeamsGridProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Hot Teams */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <h3 className="text-lg font-semibold text-white">Hot Teams</h3>
        </div>
        <div className="space-y-3">
          {hotTeams.slice(0, limit).map((team, index) => (
            <TeamTrendCard key={team.team_id} team={team} rank={index + 1} />
          ))}
        </div>
      </div>

      {/* Cold Teams */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-error" />
          <h3 className="text-lg font-semibold text-white">Cold Teams</h3>
        </div>
        <div className="space-y-3">
          {coldTeams.slice(0, limit).map((team, index) => (
            <TeamTrendCard key={team.team_id} team={team} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
