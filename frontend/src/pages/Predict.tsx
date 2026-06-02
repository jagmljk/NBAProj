import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Share2,
  Info,
  RotateCcw,
  Trophy,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ConfidenceBadge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { TeamLogo } from '../components/ui/team-logo';
import { TeamSelector } from '../components/prediction/TeamSelector';
import {
  ProbabilityMeter,
  ProbabilityBar,
} from '../components/prediction/ProbabilityMeter';
import { KeyFactorsList } from '../components/prediction/KeyFactorsList';
import { StatComparisonGrid, RecentFormComparison } from '../components/prediction/StatComparison';
import { cn } from '../lib/utils';
import { useTeams, usePrediction, useHeadToHead, useTeam } from '../hooks/useApi';
import { useAppStore } from '../store';
import type { Team, Prediction } from '../types';

export function Predict() {
  const [searchParams] = useSearchParams();
  const { data: teamsData, isLoading: teamsLoading } = useTeams();
  const { favoriteTeams, setTeams } = useAppStore();
  const predictionMutation = usePrediction();

  const [homeTeam, setHomeTeam] = useState<Team | null>(null);
  const [awayTeam, setAwayTeam] = useState<Team | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [autoPredict, setAutoPredict] = useState(false);

  // Fetch head-to-head when both teams selected
  const { data: h2hData, isLoading: h2hLoading } = useHeadToHead(
    homeTeam?.id ?? 0,
    awayTeam?.id ?? 0
  );

  // Fetch individual team data for stats comparison
  const { data: homeTeamData } = useTeam(homeTeam?.id ?? 0);
  const { data: awayTeamData } = useTeam(awayTeam?.id ?? 0);

  useEffect(() => {
    if (teamsData?.teams) {
      setTeams(teamsData.teams);
    }
  }, [teamsData, setTeams]);

  // Handle URL query params for pre-selecting teams
  useEffect(() => {
    if (teamsData?.teams && !homeTeam && !awayTeam) {
      const homeId = searchParams.get('home');
      const awayId = searchParams.get('away');

      if (homeId && awayId) {
        const home = teamsData.teams.find((t) => t.id === parseInt(homeId));
        const away = teamsData.teams.find((t) => t.id === parseInt(awayId));

        if (home && away) {
          setHomeTeam(home);
          setAwayTeam(away);
          setAutoPredict(true);
        }
      }
    }
  }, [teamsData, searchParams, homeTeam, awayTeam]);

  // Auto-trigger prediction when teams are pre-selected from URL
  useEffect(() => {
    if (autoPredict && homeTeam && awayTeam && !prediction && !predictionMutation.isPending) {
      setAutoPredict(false);
      predictionMutation.mutateAsync({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        include_explanation: true,
      }).then((result) => {
        setPrediction(result);
        setShowResult(true);
      }).catch((error) => {
        console.error('Auto-prediction failed:', error);
      });
    }
  }, [autoPredict, homeTeam, awayTeam, prediction, predictionMutation]);

  const handlePredict = async () => {
    if (!homeTeam || !awayTeam) return;

    try {
      const result = await predictionMutation.mutateAsync({
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        include_explanation: true,
      });
      setPrediction(result);
      setShowResult(true);
    } catch (error) {
      console.error('Prediction failed:', error);
    }
  };

  const handleReset = () => {
    setHomeTeam(null);
    setAwayTeam(null);
    setPrediction(null);
    setShowResult(false);
  };

  const teams = teamsData?.teams ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Game Prediction
        </h1>
        <p className="text-slate-400">
          Select two teams to predict the outcome based on current form and stats
        </p>
      </div>

      <div className="grid lg:grid-cols-[400px,1fr] gap-8">
        {/* Left panel - Team selection */}
        <div className="space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-red" />
                Select Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Home team */}
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

              {/* VS divider */}
              <div className="flex items-center justify-center py-4">
                <motion.div
                  animate={{ scale: homeTeam && awayTeam ? 1.1 : 1 }}
                  className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold",
                    homeTeam && awayTeam
                      ? "bg-gradient-to-br from-primary-orange to-primary-amber text-white"
                      : "bg-surface-elevated text-slate-500"
                  )}
                >
                  VS
                </motion.div>
              </div>

              {/* Away team */}
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

              {/* Action buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePredict}
                  disabled={!homeTeam || !awayTeam || predictionMutation.isPending}
                  loading={predictionMutation.isPending}
                  className="flex-1"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Predict
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={!homeTeam && !awayTeam}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Form Comparison */}
          {homeTeam && awayTeam && homeTeamData && awayTeamData && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Recent Form</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentFormComparison
                  homeRecord={homeTeamData.recent_form.last_10_record}
                  awayRecord={awayTeamData.recent_form.last_10_record}
                  homeStreak={homeTeamData.recent_form.streak}
                  awayStreak={awayTeamData.recent_form.streak}
                  homeTeam={homeTeam.abbreviation}
                  awayTeam={awayTeam.abbreviation}
                />
              </CardContent>
            </Card>
          )}

          {/* Head-to-head preview */}
          {homeTeam && awayTeam && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Head-to-Head</CardTitle>
              </CardHeader>
              <CardContent>
                {h2hLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : h2hData ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Total Games</span>
                      <span className="text-white font-medium">
                        {h2hData.stats.total_games}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{homeTeam.abbreviation} Wins</span>
                      <span className="text-white font-medium">
                        {h2hData.stats.home_wins}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{awayTeam.abbreviation} Wins</span>
                      <span className="text-white font-medium">
                        {h2hData.stats.away_wins}
                      </span>
                    </div>
                    {/* Average points */}
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Avg PPG vs {awayTeam.abbreviation}</span>
                        <span className="text-white font-medium">
                          {h2hData.stats.home_avg_pts?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-slate-400">Avg PPG vs {homeTeam.abbreviation}</span>
                        <span className="text-white font-medium">
                          {h2hData.stats.away_avg_pts?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No head-to-head data available</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Team Stats Comparison */}
          {homeTeam && awayTeam && homeTeamData && awayTeamData && (
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Season Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <StatComparisonGrid
                  homeTeam={homeTeam.abbreviation}
                  awayTeam={awayTeam.abbreviation}
                  stats={[
                    {
                      label: 'PPG',
                      homeValue: homeTeamData.stats.pts_per_game,
                      awayValue: awayTeamData.stats.pts_per_game,
                      format: 'decimal',
                      higherIsBetter: true,
                    },
                    {
                      label: 'FG%',
                      homeValue: homeTeamData.stats.fg_pct,
                      awayValue: awayTeamData.stats.fg_pct,
                      format: 'percent',
                      higherIsBetter: true,
                    },
                    {
                      label: '3P%',
                      homeValue: homeTeamData.stats.fg3_pct,
                      awayValue: awayTeamData.stats.fg3_pct,
                      format: 'percent',
                      higherIsBetter: true,
                    },
                    {
                      label: 'RPG',
                      homeValue: homeTeamData.stats.reb_per_game,
                      awayValue: awayTeamData.stats.reb_per_game,
                      format: 'decimal',
                      higherIsBetter: true,
                    },
                    {
                      label: 'APG',
                      homeValue: homeTeamData.stats.ast_per_game,
                      awayValue: awayTeamData.stats.ast_per_game,
                      format: 'decimal',
                      higherIsBetter: true,
                    },
                    {
                      label: '+/-',
                      homeValue: homeTeamData.stats.plus_minus,
                      awayValue: awayTeamData.stats.plus_minus,
                      format: 'decimal',
                      higherIsBetter: true,
                    },
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right panel - Results */}
        <div>
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center"
              >
                <Card variant="glass" className="w-full p-12 text-center">
                  <div className="w-24 h-24 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-6">
                    <Target className="w-12 h-12 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Select Teams to Predict
                  </h3>
                  <p className="text-slate-400 max-w-md mx-auto">
                    Choose a home and away team to get a detailed prediction
                    with win probabilities, key factors, and more.
                  </p>
                </Card>
              </motion.div>
            ) : prediction && homeTeam && awayTeam ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Main prediction card */}
                <Card variant="highlight" className="overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary-red via-primary-scarlet to-primary-crimson" />
                  <CardContent className="p-8">
                    {/* Teams and probabilities */}
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
                      {/* Home team - clickable */}
                      <Link
                        to={`/teams/${homeTeam.id}`}
                        className="text-center group cursor-pointer"
                      >
                        <TeamLogo
                          teamAbbr={homeTeam.abbreviation}
                          teamId={homeTeam.id}
                          teamName={homeTeam.full_name}
                          size="xl"
                          className="mx-auto mb-3 group-hover:scale-110 transition-transform"
                        />
                        <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                          {homeTeam.full_name}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-sm text-slate-400">Home</p>
                      </Link>

                      {/* Probability meter */}
                      <div className="flex-shrink-0">
                        <ProbabilityMeter
                          probability={
                            prediction.predicted_winner === 'home'
                              ? prediction.home_win_prob
                              : 1 - prediction.home_win_prob
                          }
                          size="xl"
                          teamName={
                            prediction.predicted_winner === 'home'
                              ? homeTeam.full_name
                              : awayTeam.full_name
                          }
                          label="Win Probability"
                        />
                      </div>

                      {/* Away team - clickable */}
                      <Link
                        to={`/teams/${awayTeam.id}`}
                        className="text-center group cursor-pointer"
                      >
                        <TeamLogo
                          teamAbbr={awayTeam.abbreviation}
                          teamId={awayTeam.id}
                          teamName={awayTeam.full_name}
                          size="xl"
                          className="mx-auto mb-3 group-hover:scale-110 transition-transform"
                        />
                        <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                          {awayTeam.full_name}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-sm text-slate-400">Away</p>
                      </Link>
                    </div>

                    {/* Prediction bar */}
                    <ProbabilityBar
                      homeProb={prediction.home_win_prob}
                      homeTeam={homeTeam.full_name}
                      awayTeam={awayTeam.full_name}
                    />

                    {/* Winner and confidence */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-warning" />
                        <div>
                          <p className="text-sm text-slate-400">Predicted Winner</p>
                          <p className="text-lg font-bold text-white">
                            {prediction.predicted_winner === 'home'
                              ? homeTeam.full_name
                              : awayTeam.full_name}
                          </p>
                        </div>
                      </div>
                      <ConfidenceBadge tier={prediction.confidence_tier} size="lg" />
                    </div>
                  </CardContent>
                </Card>

                {/* Key factors */}
                {prediction.key_factors && prediction.key_factors.length > 0 && (
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-red" />
                        Key Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <KeyFactorsList factors={prediction.key_factors} />
                    </CardContent>
                  </Card>
                )}

                {/* Explanation */}
                {prediction.explanation && (
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5 text-accent-blue" />
                        Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 leading-relaxed">
                        {prediction.explanation}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
