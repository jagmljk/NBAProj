import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useSpring, useTransform } from 'framer-motion';
import {
  Target,
  Award,
  ChevronRight,
  Activity,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { SkeletonGameCard } from '../components/ui/skeleton';
import { GameCard } from '../components/prediction/GameCard';
import { TeamSelector } from '../components/prediction/TeamSelector';
import { ProbabilityMeter } from '../components/prediction/ProbabilityMeter';
import { TrendingTeamsGrid } from '../components/prediction/TrendChart';
import { cn, formatPercentage } from '../lib/utils';
import {
  useTeams,
  useScoreboard,
  useModelPerformance,
  useTeamTrends,
  usePrediction,
} from '../hooks/useApi';
import { useAppStore } from '../store';
import type { Team } from '../types';

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return unsubscribe;
  }, [value, spring, display]);

  return (
    <span>
      {displayValue}
      {suffix}
    </span>
  );
}

// Hero section component
function HeroSection() {
  const { data: performance } = useModelPerformance();
  const accuracy = performance?.test_accuracy ?? 0.65;

  return (
    <section className="relative overflow-hidden py-16 lg:py-24 bg-hero-pattern">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary-red/10 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight"
          >
            NBA Game{' '}
            <span className="text-primary-red">Predictions</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-content-secondary mb-8 max-w-2xl mx-auto"
          >
            <span className="text-primary-red font-bold">
              <AnimatedCounter value={Math.round(accuracy * 100)} suffix="%" />
            </span>{' '}
            prediction accuracy • Trained on 27,000+ games
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/predict">
              <Button size="xl">
                <Target className="w-5 h-5 mr-2" />
                Make a Prediction
              </Button>
            </Link>
            <Link to="/games">
              <Button variant="outline" size="xl">
                <Calendar className="w-5 h-5 mr-2" />
                View Today's Games
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Quick predict widget
function QuickPredict() {
  const { data: teamsData, isLoading: teamsLoading } = useTeams();
  const { favoriteTeams, setTeams } = useAppStore();
  const predictionMutation = usePrediction();

  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);

  useEffect(() => {
    if (teamsData?.teams) {
      setTeams(teamsData.teams);
    }
  }, [teamsData, setTeams]);

  const handlePredict = () => {
    if (homeTeam && awayTeam) {
      predictionMutation.mutate({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        include_explanation: false,
      });
    }
  };

  const teams = teamsData?.teams ?? [];

  return (
    <Card variant="default" className="overflow-visible">
      <CardHeader className="border-b border-surface-border">
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-red" />
          Quick Predict
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          <TeamSelector
            teams={teams}
            selectedTeam={homeTeam}
            onSelect={setHomeTeam}
            label="Home Team"
            placeholder="Select home team..."
            favoriteTeamIds={favoriteTeams}
            excludeTeamId={awayTeam?.id}
            disabled={teamsLoading}
          />

          <div className="hidden md:flex items-center justify-center py-8">
            <span className="text-2xl font-bold text-content-tertiary">VS</span>
          </div>

          <TeamSelector
            teams={teams}
            selectedTeam={awayTeam}
            onSelect={setAwayTeam}
            label="Away Team"
            placeholder="Select away team..."
            favoriteTeamIds={favoriteTeams}
            excludeTeamId={homeTeam?.id}
            disabled={teamsLoading}
          />
        </div>

        {/* Prediction result */}
        {predictionMutation.data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl bg-surface-elevated border border-surface-border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-content-secondary">Predicted Winner</p>
                <p className="text-lg font-bold text-white">
                  {predictionMutation.data.predicted_winner === 'home'
                    ? homeTeam?.full_name
                    : awayTeam?.full_name}
                </p>
              </div>
              <ProbabilityMeter
                probability={
                  predictionMutation.data.predicted_winner === 'home'
                    ? predictionMutation.data.home_win_prob
                    : 1 - predictionMutation.data.home_win_prob
                }
                size="sm"
              />
            </div>
          </motion.div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            onClick={handlePredict}
            disabled={!homeTeam || !awayTeam || predictionMutation.isPending}
            loading={predictionMutation.isPending}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-2" />
            Predict Winner
          </Button>
          <Link to="/predict">
            <Button variant="outline">
              Full Analysis
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Today's games section
function TodaysGames() {
  const { data: scoreboard, isLoading } = useScoreboard();

  const games = scoreboard?.games ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Today's Games</h2>
          <p className="text-content-secondary">
            {scoreboard?.date ?? 'Loading...'} • {games.length} games
          </p>
        </div>
        <Link to="/games">
          <Button variant="ghost">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonGameCard key={i} />
          ))}
        </div>
      ) : games.length === 0 ? (
        <Card variant="glass" className="p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Decorative icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary-red/10 rounded-full blur-xl scale-150" />
              <div className="relative w-16 h-16 rounded-full bg-surface-elevated border border-surface-border flex items-center justify-center">
                <Calendar className="w-8 h-8 text-content-tertiary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-white mb-1">No Games Today</h3>
              <p className="text-content-secondary text-sm mb-4">
                The NBA schedule has no games for today. Check out the standings or make a custom prediction.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center md:justify-start">
                <Link to="/standings">
                  <Button variant="outline" size="sm">
                    View Standings
                  </Button>
                </Link>
                <Link to="/predict">
                  <Button size="sm">
                    <Target className="w-4 h-4 mr-1" />
                    Make Prediction
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.slice(0, 6).map((game) => (
            <GameCard key={game.game_id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}

// Model performance stats
function ModelStats() {
  const { data: performance, isLoading } = useModelPerformance();

  const stats = [
    {
      label: 'Accuracy',
      value: performance?.test_accuracy ?? 0,
      format: 'percent',
      icon: Target,
      color: 'text-primary-red',
      bgColor: 'bg-primary-red/10',
    },
    {
      label: 'AUC Score',
      value: performance?.test_auc ?? 0,
      format: 'decimal',
      icon: Activity,
      color: 'text-accent-blue',
      bgColor: 'bg-accent-blue/10',
    },
    {
      label: 'Total Games',
      value: performance?.total_games ?? 0,
      format: 'number',
      icon: Award,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <section>
      <h2 className="text-2xl font-bold text-white mb-6">Model Performance</h2>

      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card variant="default" className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-content-secondary mb-1">{stat.label}</p>
                    {isLoading ? (
                      <div className="h-8 w-20 skeleton" />
                    ) : (
                      <p className={cn("text-3xl font-bold", stat.color)}>
                        {stat.format === 'percent'
                          ? formatPercentage(stat.value)
                          : stat.format === 'decimal'
                          ? stat.value.toFixed(3)
                          : stat.value.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bgColor, stat.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// Trending insights section
function TrendingInsights() {
  const { data: trends, isLoading } = useTeamTrends();

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Trending Teams</h2>
          <p className="text-content-secondary">Performance trends based on last 10 games</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2].map((col) => (
            <div key={col} className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-28 skeleton rounded-xl" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <TrendingTeamsGrid
          hotTeams={trends?.hot_teams ?? []}
          coldTeams={trends?.cold_teams ?? []}
          limit={5}
        />
      )}
    </section>
  );
}

// Main Home page component
export function Home() {
  return (
    <div className="space-y-12 pb-12">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <QuickPredict />
        <TodaysGames />
        <ModelStats />
        <TrendingInsights />
      </div>
    </div>
  );
}
