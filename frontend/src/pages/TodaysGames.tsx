import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { format, addDays, subDays, isToday, isYesterday, isTomorrow } from 'date-fns';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { SkeletonGameCard } from '../components/ui/skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { GameCard } from '../components/prediction/GameCard';
import { cn } from '../lib/utils';
import { useScoreboard, useTodaysPredictions } from '../hooks/useApi';

// Helper function to get smart date title
function getDateTitle(date: Date): string {
  if (isToday(date)) return "Today's Games";
  if (isYesterday(date)) return "Yesterday's Games";
  if (isTomorrow(date)) return "Tomorrow's Games";
  return format(date, 'EEEE, MMMM d') + ' Games';
}

// Helper function to get appropriate section title based on date
function getScheduledSectionTitle(date: Date): string {
  if (isToday(date)) return 'Upcoming';
  if (isTomorrow(date)) return 'Scheduled';
  if (isYesterday(date)) return 'Was Scheduled';
  return 'Scheduled';
}

export function TodaysGames() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confidenceFilter, setConfidenceFilter] = useState<string[]>([
    'HIGH',
    'MEDIUM',
    'LOW',
  ]);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: scoreboard, isLoading, isError, refetch, isFetching } = useScoreboard(dateString);
  const { data: predictions } = useTodaysPredictions();

  const games = scoreboard?.games ?? [];

  // Combine games with predictions
  const gamesWithPredictions = games.map((game) => {
    const prediction = predictions?.games.find(
      (g) => g.game_id === game.game_id
    )?.prediction;
    return { ...game, prediction };
  });

  // Filter by confidence
  const filteredGames = gamesWithPredictions.filter((game) => {
    if (confidenceFilter.length === 3) return true;
    const tier = game.prediction?.confidence_tier ?? 'LOW';
    return confidenceFilter.includes(tier);
  });

  // Group games by status
  const liveGames = filteredGames.filter((g) => g.game_status === 'in_progress');
  const scheduledGames = filteredGames.filter((g) => g.game_status === 'scheduled');
  const completedGames = filteredGames.filter((g) => g.game_status === 'final');

  const toggleConfidenceFilter = (tier: string) => {
    setConfidenceFilter((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{getDateTitle(selectedDate)}</h1>
          <p className="text-slate-400">
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">Confidence:</span>
        </div>
        {['HIGH', 'MEDIUM', 'LOW'].map((tier) => (
          <button
            key={tier}
            onClick={() => toggleConfidenceFilter(tier)}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-all",
              confidenceFilter.includes(tier)
                ? tier === 'HIGH'
                  ? 'bg-success/20 text-success border border-success/30'
                  : tier === 'MEDIUM'
                  ? 'bg-warning/20 text-warning border border-warning/30'
                  : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                : 'bg-white/5 text-slate-500 border border-transparent'
            )}
          >
            {tier}
          </button>
        ))}
      </div>


      {/* Error state */}
      {isError ? (
        <ErrorState
          message="Couldn't load games. Please try again."
          onRetry={() => refetch()}
        />
      ) : /* Loading state */
      isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonGameCard key={i} />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        <Card variant="glass" className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* Decorative background */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary-red/10 rounded-full blur-2xl scale-150" />
              <div className="relative w-20 h-20 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center">
                <Calendar className="w-10 h-10 text-content-tertiary" />
              </div>
            </div>

            <h3 className="text-xl font-semibold text-white mb-2">
              {games.length === 0 ? 'No Games Scheduled' : 'No Matching Games'}
            </h3>
            <p className="text-content-secondary mb-6">
              {games.length === 0
                ? 'The NBA has no games scheduled for this date. Try checking another day or browse upcoming matchups.'
                : `No games match your current confidence filters. Try adjusting your filters or view all ${games.length} games.`}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {games.length === 0 ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous Day
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    Next Day
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  onClick={() => setConfidenceFilter(['HIGH', 'MEDIUM', 'LOW'])}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Show All Games
                </Button>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Live games */}
          {liveGames.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <h2 className="text-xl font-bold text-white">Live Now</h2>
                <Badge variant="success">{liveGames.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveGames.map((game, index) => (
                  <motion.div
                    key={game.game_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GameCard game={game} prediction={game.prediction} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Scheduled games */}
          {scheduledGames.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary-red" />
                <h2 className="text-xl font-bold text-white">{getScheduledSectionTitle(selectedDate)}</h2>
                <Badge variant="default">{scheduledGames.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scheduledGames.map((game, index) => (
                  <motion.div
                    key={game.game_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GameCard
                      game={game}
                      prediction={game.prediction}
                                          />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Completed games */}
          {completedGames.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-slate-400" />
                <h2 className="text-xl font-bold text-white">Final</h2>
                <Badge variant="outline">{completedGames.length}</Badge>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedGames.map((game, index) => (
                  <motion.div
                    key={game.game_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GameCard game={game} prediction={game.prediction} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
