import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface StatComparisonProps {
  homeValue: number;
  awayValue: number;
  label: string;
  homeTeam: string;
  awayTeam: string;
  format?: 'number' | 'percent' | 'decimal';
  higherIsBetter?: boolean;
}

export function StatComparisonBar({
  homeValue,
  awayValue,
  label,
  format = 'decimal',
  higherIsBetter = true,
}: Omit<StatComparisonProps, 'homeTeam' | 'awayTeam'>) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = 100 - homePercent;

  const homeWins = higherIsBetter ? homeValue > awayValue : homeValue < awayValue;
  const awayWins = higherIsBetter ? awayValue > homeValue : awayValue < homeValue;

  const formatValue = (val: number) => {
    if (format === 'percent') return `${(val * 100).toFixed(1)}%`;
    if (format === 'decimal') return val.toFixed(1);
    return val.toLocaleString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={cn("font-medium", homeWins ? "text-success" : "text-slate-400")}>
          {formatValue(homeValue)}
        </span>
        <span className="text-slate-400 text-xs uppercase tracking-wide">{label}</span>
        <span className={cn("font-medium", awayWins ? "text-success" : "text-slate-400")}>
          {formatValue(awayValue)}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-surface-base">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homePercent}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            "rounded-l-full",
            homeWins ? "bg-primary-red" : "bg-slate-600"
          )}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayPercent}%` }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={cn(
            "rounded-r-full",
            awayWins ? "bg-accent-blue" : "bg-slate-600"
          )}
        />
      </div>
    </div>
  );
}

interface StatGridProps {
  stats: Array<{
    label: string;
    homeValue: number;
    awayValue: number;
    format?: 'number' | 'percent' | 'decimal';
    higherIsBetter?: boolean;
  }>;
  homeTeam: string;
  awayTeam: string;
}

export function StatComparisonGrid({ stats, homeTeam, awayTeam }: StatGridProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between text-sm font-medium">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-red" />
          <span className="text-white">{homeTeam}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white">{awayTeam}</span>
          <div className="w-3 h-3 rounded-full bg-accent-blue" />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        {stats.map((stat) => (
          <StatComparisonBar
            key={stat.label}
            homeValue={stat.homeValue}
            awayValue={stat.awayValue}
            label={stat.label}
            format={stat.format}
            higherIsBetter={stat.higherIsBetter}
          />
        ))}
      </div>
    </div>
  );
}

interface RecentFormProps {
  homeRecord: string;
  awayRecord: string;
  homeStreak: string;
  awayStreak: string;
  homeTeam: string;
  awayTeam: string;
}

export function RecentFormComparison({
  homeRecord,
  awayRecord,
  homeStreak,
  awayStreak,
  homeTeam,
  awayTeam,
}: RecentFormProps) {
  const parseRecord = (record: string) => {
    const [wins, losses] = record.split('-').map(Number);
    return { wins, losses, pct: wins / (wins + losses) };
  };

  const home = parseRecord(homeRecord);
  const away = parseRecord(awayRecord);

  const isHomeHot = home.pct > 0.6;
  const isAwayHot = away.pct > 0.6;
  const isHomeCold = home.pct < 0.4;
  const isAwayCold = away.pct < 0.4;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={cn(
        "p-4 rounded-xl border",
        isHomeHot ? "bg-success/5 border-success/20" :
        isHomeCold ? "bg-error/5 border-error/20" :
        "bg-surface-elevated border-surface-border"
      )}>
        <div className="text-sm text-slate-400 mb-1">{homeTeam}</div>
        <div className={cn(
          "text-2xl font-bold",
          isHomeHot ? "text-success" : isHomeCold ? "text-error" : "text-white"
        )}>
          {homeRecord}
        </div>
        <div className="text-sm text-slate-500">Last 10 • {homeStreak}</div>
      </div>

      <div className={cn(
        "p-4 rounded-xl border",
        isAwayHot ? "bg-success/5 border-success/20" :
        isAwayCold ? "bg-error/5 border-error/20" :
        "bg-surface-elevated border-surface-border"
      )}>
        <div className="text-sm text-slate-400 mb-1">{awayTeam}</div>
        <div className={cn(
          "text-2xl font-bold",
          isAwayHot ? "text-success" : isAwayCold ? "text-error" : "text-white"
        )}>
          {awayRecord}
        </div>
        <div className="text-sm text-slate-500">Last 10 • {awayStreak}</div>
      </div>
    </div>
  );
}
