import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Target,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { cn, formatPercentage } from '../lib/utils';
import { useValidateRecent, useAccuracyStats } from '../hooks/useApi';
import type { ValidatedGame, TierAccuracy } from '../services/api';

// Tier colors and styling
const TIER_CONFIG = {
  HIGH: {
    color: 'text-success',
    bgColor: 'bg-success/10',
    borderColor: 'border-success/30',
    progressColor: 'bg-success',
    label: 'High Confidence',
  },
  MEDIUM: {
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    borderColor: 'border-warning/30',
    progressColor: 'bg-warning',
    label: 'Medium Confidence',
  },
  LOW: {
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
    progressColor: 'bg-slate-500',
    label: 'Low Confidence',
  },
};

// Stats card component
function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bgColor,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  bgColor: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card variant="glass" className="p-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', bgColor)}>
          <Icon className={cn('w-5 h-5', color)} />
        </div>
        <div className={cn('text-2xl font-bold', color)}>{value}</div>
        <div className="text-sm text-slate-400">{label}</div>
        {subValue && <div className="text-xs text-slate-500 mt-1">{subValue}</div>}
      </Card>
    </motion.div>
  );
}

// Tier accuracy bar component
function TierAccuracyBar({
  tier,
  stats,
  delay = 0,
}: {
  tier: string;
  stats: TierAccuracy;
  delay?: number;
}) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.LOW;
  const accuracy = stats.accuracy ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={cn('p-4 rounded-xl border', config.bgColor, config.borderColor)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className={cn('w-4 h-4', config.color)} />
          <span className="font-medium text-white">{config.label}</span>
        </div>
        <div className="text-right">
          <span className={cn('text-lg font-bold', config.color)}>
            {accuracy ? `${accuracy.toFixed(1)}%` : 'N/A'}
          </span>
          <span className="text-sm text-slate-500 ml-2">
            ({stats.correct}/{stats.total})
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-surface-base rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${accuracy}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
          className={cn('h-full rounded-full', config.progressColor)}
        />
      </div>
    </motion.div>
  );
}

// Game result row component
function GameResultRow({ game, index }: { game: ValidatedGame; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'p-3 rounded-lg border transition-colors',
        game.is_correct
          ? 'bg-success/5 border-success/20 hover:border-success/40'
          : 'bg-error/5 border-error/20 hover:border-error/40'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {game.is_correct ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <XCircle className="w-5 h-5 text-error" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {game.away_team_abbr} @ {game.home_team_abbr}
              </span>
              <Badge
                variant={
                  game.confidence_tier === 'HIGH'
                    ? 'success'
                    : game.confidence_tier === 'MEDIUM'
                    ? 'warning'
                    : 'secondary'
                }
                className="text-xs"
              >
                {game.confidence_tier}
              </Badge>
            </div>
            <div className="text-sm text-slate-400">
              Final: {game.away_score} - {game.home_score}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm">
            <span className="text-slate-400">Predicted: </span>
            <span className={cn(
              game.is_correct ? 'text-success' : 'text-error',
              'font-medium'
            )}>
              {game.predicted_winner === 'home' ? game.home_team_abbr : game.away_team_abbr}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {formatPercentage(game.home_win_prob)} home win prob
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PredictionAccuracyDashboard() {
  const [showAllGames, setShowAllGames] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);

  const { data: recentData, isLoading: recentLoading, refetch } = useValidateRecent(selectedDays);
  const { data: statsData, isLoading: statsLoading } = useAccuracyStats();

  const isLoading = recentLoading || statsLoading;

  // Get yesterday's results from recent data
  const yesterdayResult = recentData?.daily_results?.[recentData.daily_results.length - 1];

  // Collect all games from recent data
  const allGames = recentData?.daily_results?.flatMap(day => day.games) ?? [];
  const displayGames = showAllGames ? allGames : allGames.slice(0, 10);

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-gold" />
            Prediction Accuracy Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="bg-surface-elevated border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
            >
              <option value={3}>Last 3 days</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Yesterday's Performance Banner */}
        {yesterdayResult && !isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'p-4 rounded-xl border-2',
              (yesterdayResult.accuracy ?? 0) >= 60
                ? 'bg-success/10 border-success/30'
                : (yesterdayResult.accuracy ?? 0) >= 50
                ? 'bg-warning/10 border-warning/30'
                : 'bg-error/10 border-error/30'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-slate-300" />
                <div>
                  <div className="text-lg font-bold text-white">
                    Yesterday's Performance
                  </div>
                  <div className="text-sm text-slate-400">{yesterdayResult.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  'text-3xl font-bold',
                  (yesterdayResult.accuracy ?? 0) >= 60
                    ? 'text-success'
                    : (yesterdayResult.accuracy ?? 0) >= 50
                    ? 'text-warning'
                    : 'text-error'
                )}>
                  {yesterdayResult.accuracy?.toFixed(1) ?? 'N/A'}%
                </div>
                <div className="text-sm text-slate-400">
                  {yesterdayResult.correct_predictions}/{yesterdayResult.validated_games} correct
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Overall Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={BarChart3}
              label="Total Validated"
              value={recentData?.total_games ?? 0}
              subValue={`${recentData?.days_with_games ?? 0} days with games`}
              color="text-secondary-blue"
              bgColor="bg-secondary-blue/10"
              delay={0}
            />
            <StatCard
              icon={CheckCircle2}
              label="Correct"
              value={recentData?.correct_predictions ?? 0}
              color="text-success"
              bgColor="bg-success/10"
              delay={0.05}
            />
            <StatCard
              icon={XCircle}
              label="Incorrect"
              value={(recentData?.total_games ?? 0) - (recentData?.correct_predictions ?? 0)}
              color="text-error"
              bgColor="bg-error/10"
              delay={0.1}
            />
            <StatCard
              icon={TrendingUp}
              label="Accuracy"
              value={recentData?.overall_accuracy ? `${recentData.overall_accuracy.toFixed(1)}%` : 'N/A'}
              subValue={statsData?.total_validated ? `${statsData.total_validated} all-time` : undefined}
              color="text-primary-gold"
              bgColor="bg-primary-gold/10"
              delay={0.15}
            />
          </div>
        )}

        {/* Accuracy by Tier */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Accuracy by Confidence Tier</h3>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {['HIGH', 'MEDIUM', 'LOW'].map((tier, index) => {
                const stats = recentData?.accuracy_by_tier?.[tier] ?? { correct: 0, total: 0, accuracy: null };
                return (
                  <TierAccuracyBar
                    key={tier}
                    tier={tier}
                    stats={stats}
                    delay={index * 0.1}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Games */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Predictions</h3>
            <Badge variant="secondary">
              {allGames.length} games
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : allGames.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              No validated games found for this period
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {displayGames.map((game, index) => (
                  <GameResultRow key={game.game_id} game={game} index={index} />
                ))}
              </div>

              {allGames.length > 10 && (
                <Button
                  variant="ghost"
                  className="w-full mt-4 gap-2"
                  onClick={() => setShowAllGames(!showAllGames)}
                >
                  {showAllGames ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show All {allGames.length} Games
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>

        {/* Info footer */}
        <div className="p-3 rounded-lg bg-surface-base text-xs text-slate-400">
          <strong className="text-slate-300">How it works:</strong> Predictions are validated against
          actual game outcomes once games are completed. High confidence predictions (65%+ win probability)
          should historically show higher accuracy than low confidence predictions.
        </div>
      </CardContent>
    </Card>
  );
}
