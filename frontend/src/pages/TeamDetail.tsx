import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Target,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
  BarChart3,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TeamLogo } from '../components/ui/team-logo';
import {
  FourFactorsRadar,
  OffenseDefenseScatter,
  ShootingBreakdown,
  PerformanceTrends,
} from '../components/charts';
import { cn } from '../lib/utils';
import { useTeam, useTeamSchedule, useTeams, useHeadToHead } from '../hooks/useApi';
import { useAppStore } from '../store';
import { getTeamColors } from '../constants/teamColors';

// Available seasons
const seasons = ['2025-26', '2024-25', '2023-24', '2022-23'];

// Stat row with league rank badge
function StatRow({
  label,
  value,
  rank,
  format = 'number',
}: {
  label: string;
  value: number;
  rank?: number;
  format?: 'number' | 'percentage' | 'decimal';
}) {
  const getRankColor = (r: number) => {
    if (r <= 10) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (r <= 20) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const formatValue = () => {
    if (format === 'percentage') return `${(value * 100).toFixed(1)}%`;
    if (format === 'decimal') return value.toFixed(1);
    return value.toFixed(1);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-white font-medium">{formatValue()}</span>
        {rank && (
          <span className={cn(
            "text-xs px-2 py-0.5 rounded border",
            getRankColor(rank)
          )}>
            #{rank}
          </span>
        )}
      </div>
    </div>
  );
}

// Form circle (W/L indicator)
function FormCircle({ result, opponent, score, date }: {
  result: 'W' | 'L';
  opponent?: string;
  score?: string;
  date?: string;
}) {
  const isWin = result === 'W';

  return (
    <div className="group relative">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm transition-transform group-hover:scale-110",
        isWin ? "bg-green-500" : "bg-red-500"
      )}>
        {result}
      </div>
      {(opponent || score || date) && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {opponent && <p className="text-white text-sm font-medium">{opponent}</p>}
          {score && <p className="text-slate-400 text-xs">{score}</p>}
          {date && <p className="text-slate-500 text-xs">{date}</p>}
        </div>
      )}
    </div>
  );
}

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const parsedTeamId = parseInt(teamId || '0');
  const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null);

  // Get season from URL, default to current season
  const seasonParam = searchParams.get('season');
  const [selectedSeason, setSelectedSeason] = useState(seasonParam || '2025-26');

  // Update URL when season changes
  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    setSearchParams({ season });
  };

  // Sync with URL param changes
  useEffect(() => {
    if (seasonParam && seasonParam !== selectedSeason) {
      setSelectedSeason(seasonParam);
    }
  }, [seasonParam]);

  const { data: teamDetail, isLoading: teamLoading } = useTeam(parsedTeamId, selectedSeason);
  const { data: schedule } = useTeamSchedule(parsedTeamId, selectedSeason);
  const { data: teamsData } = useTeams();
  const { data: h2hData } = useHeadToHead(parsedTeamId, selectedOpponent || 0);

  const { addFavorite, removeFavorite, isFavorite } = useAppStore();
  const isTeamFavorite = isFavorite(parsedTeamId);

  // Get team colors
  const colors = teamDetail ? getTeamColors(teamDetail.info.full_name) : { primary: '#F97316', secondary: '#3B82F6', accent: '#FFFFFF' };

  // Get other teams for H2H selector
  const otherTeams = teamsData?.teams?.filter(t => t.id !== parsedTeamId) || [];

  const handleToggleFavorite = () => {
    if (isTeamFavorite) {
      removeFavorite(parsedTeamId);
    } else {
      addFavorite(parsedTeamId);
    }
  };

  // Calculate form from recent games
  const recentGamesForm = schedule?.recent_games?.slice(0, 10).map(g => ({
    result: g.result?.startsWith('W') ? 'W' : 'L',
    opponent: g.opponent_name,
    score: g.result,
    date: g.game_date,
  })) || [];

  const last10Wins = recentGamesForm.filter(g => g.result === 'W').length;
  const formLabel = last10Wins >= 7 ? 'HOT' : last10Wins >= 4 ? 'AVERAGE' : 'COLD';
  const formColor = last10Wins >= 7 ? 'bg-orange-500' : last10Wins >= 4 ? 'bg-blue-500' : 'bg-cyan-400';

  // Mock chart data (would come from API in production)
  const winPctTrendData = Array.from({ length: 20 }, (_, i) => ({
    game: i + 1,
    winPct: Math.min(100, Math.max(0, 50 + Math.random() * 30 - 10 + i * 0.5)),
  }));

  if (teamLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-32 bg-slate-700 rounded" />
          <div className="h-64 bg-slate-700 rounded-xl" />
          <div className="grid md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!teamDetail) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card variant="glass" className="p-12 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">Team Not Found</h3>
          <p className="text-slate-400 mb-4">The requested team could not be found.</p>
          <Button onClick={() => navigate('/teams')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Teams
          </Button>
        </Card>
      </div>
    );
  }

  const { info, stats, recent_form, ranking, advanced } = teamDetail;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link to="/" className="text-slate-400 hover:text-white">Home</Link>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <Link to="/teams" className="text-slate-400 hover:text-white">Teams</Link>
        <ChevronRight className="w-4 h-4 text-slate-600" />
        <span className="text-white">{info.full_name}</span>
      </nav>

      {/* Back button and Season selector */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/teams')}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Teams
        </Button>

        {/* Season Tabs */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
          <Calendar className="w-4 h-4 text-slate-500 ml-2" />
          {seasons.map((season) => (
            <button
              key={season}
              onClick={() => handleSeasonChange(season)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                selectedSeason === season
                  ? "bg-primary-red text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      {/* Team header with dynamic gradient */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card variant="elevated" className="overflow-hidden mb-8">
          <div
            className="relative h-48 md:h-64 p-8"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            }}
          >
            {/* Semi-transparent overlay */}
            <div className="absolute inset-0 bg-black/30" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 h-full">
              <TeamLogo
                teamAbbr={info.abbreviation}
                teamId={parsedTeamId}
                teamName={info.full_name}
                size="2xl"
                className="drop-shadow-lg"
              />

              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow">{info.full_name}</h1>
                  <button
                    onClick={handleToggleFavorite}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Star
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isTeamFavorite
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-white/70 hover:text-yellow-400"
                      )}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 text-white/80 mb-4">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {info.city}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <span className="text-3xl font-bold text-white">
                    {stats.wins}-{stats.losses}
                  </span>
                  <Badge
                    variant={recent_form.streak.startsWith('W') ? 'success' : 'error'}
                    className="px-3 text-lg"
                  >
                    {recent_form.streak}
                  </Badge>
                  {ranking?.conference_rank && (
                    <span className="text-white/80">
                      #{ranking.conference_rank} in {info.state === 'Eastern' ? 'East' : 'West'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link to={`/predict?home=${parsedTeamId}&away=`}>
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-0">
                    <Target className="w-4 h-4 mr-2" />
                    Predict Game
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Season Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card variant="default" style={{ borderLeftColor: colors.primary, borderLeftWidth: '4px' }}>
          <CardHeader className="border-b border-surface-border" style={{ backgroundColor: `${colors.primary}10` }}>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" style={{ color: colors.primary }} />
              Season Statistics ({stats.season})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Offensive Stats */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Offensive</h4>
                <div className="space-y-1">
                  <StatRow label="Points Per Game" value={stats.pts_per_game} rank={ranking?.pts_rank} format="decimal" />
                  <StatRow label="Field Goal %" value={stats.fg_pct} rank={ranking?.fg_pct_rank} format="percentage" />
                  <StatRow label="3-Point %" value={stats.fg3_pct} rank={ranking?.fg3_pct_rank} format="percentage" />
                  <StatRow label="Free Throw %" value={stats.ft_pct} rank={ranking?.ft_pct_rank} format="percentage" />
                </div>
              </div>

              {/* Rebounding & Playmaking */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Rebounding & Assists</h4>
                <div className="space-y-1">
                  <StatRow label="Rebounds/Game" value={stats.reb_per_game} rank={ranking?.reb_rank} format="decimal" />
                  <StatRow label="Assists/Game" value={stats.ast_per_game} rank={ranking?.ast_rank} format="decimal" />
                  <StatRow label="Plus/Minus" value={stats.plus_minus} format="decimal" />
                </div>
              </div>

              {/* Recent Form */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Recent Form</h4>
                <div className="space-y-1">
                  <StatRow label="Last 10" value={parseFloat(recent_form.last_10_record.split('-')[0]) / 10} format="percentage" />
                  <StatRow label="Home Record" value={parseFloat(recent_form.home_record.split('-')[0]) / (parseFloat(recent_form.home_record.split('-')[0]) + parseFloat(recent_form.home_record.split('-')[1]) || 1)} format="percentage" />
                  <StatRow label="Away Record" value={parseFloat(recent_form.away_record.split('-')[0]) / (parseFloat(recent_form.away_record.split('-')[0]) + parseFloat(recent_form.away_record.split('-')[1]) || 1)} format="percentage" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Games Visual Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <Card variant="default">
          <CardHeader className="border-b border-surface-border">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                Recent Form
              </span>
              <Badge className={cn("px-3 py-1", formColor)}>
                {formLabel === 'HOT' && '🔥'} {formLabel === 'COLD' && '🧊'} {formLabel} ({last10Wins}-{10 - last10Wins})
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Visual Timeline */}
            <div className="flex items-center justify-center gap-2 mb-6 overflow-x-auto pb-2">
              {recentGamesForm.slice(0, 10).reverse().map((game, idx) => (
                <FormCircle
                  key={idx}
                  result={game.result as 'W' | 'L'}
                  opponent={game.opponent}
                  score={game.score}
                  date={game.date}
                />
              ))}
            </div>

            {/* Games Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-surface-border">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Opponent</th>
                    <th className="text-center py-2 px-3">H/A</th>
                    <th className="text-center py-2 px-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule?.recent_games?.slice(0, 10).map((game) => {
                    const isWin = game.result?.startsWith('W');
                    return (
                      <tr
                        key={game.game_id}
                        className={cn(
                          "border-b border-surface-border/50",
                          isWin ? "bg-green-500/5" : "bg-red-500/5"
                        )}
                      >
                        <td className="py-2 px-3 text-slate-400">{game.game_date}</td>
                        <td className="py-2 px-3 text-white">{game.opponent_name}</td>
                        <td className="py-2 px-3 text-center text-slate-400">{game.is_home ? 'H' : 'A'}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge variant={isWin ? 'success' : 'error'} className="text-xs">
                            {game.result}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8"
      >
        <Card variant="default">
          <CardHeader className="border-b border-surface-border">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" style={{ color: colors.primary }} />
              Performance Charts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Win % Trend */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-4">Win Percentage Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={winPctTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="game" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="winPct"
                        stroke={colors.primary}
                        strokeWidth={2}
                        dot={false}
                        name="Win %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Home vs Away */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-4">Home vs Away Performance</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[{
                      name: 'Win %',
                      home: parseFloat(recent_form.home_record.split('-')[0]) / (parseFloat(recent_form.home_record.split('-')[0]) + parseFloat(recent_form.home_record.split('-')[1]) || 1) * 100,
                      away: parseFloat(recent_form.away_record.split('-')[0]) / (parseFloat(recent_form.away_record.split('-')[0]) + parseFloat(recent_form.away_record.split('-')[1]) || 1) * 100,
                    }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#94a3b8' }}
                      />
                      <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" />
                      <Bar dataKey="home" fill={colors.primary} name="Home" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="away" fill={colors.secondary} name="Away" radius={[4, 4, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Advanced Analytics Section */}
      {advanced && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6 mb-8"
        >
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6" style={{ color: colors.primary }} />
            <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Four Factors Radar Chart */}
            {advanced.four_factors && (
              <FourFactorsRadar
                fourFactors={advanced.four_factors}
                teamColor={colors.primary}
              />
            )}

            {/* Offense vs Defense Identity */}
            {advanced.ratings && advanced.ratings.off_rating && advanced.ratings.def_rating && (
              <OffenseDefenseScatter
                offRating={advanced.ratings.off_rating}
                defRating={advanced.ratings.def_rating}
                teamName={info.full_name}
                teamColor={colors.primary}
              />
            )}
          </div>

          {/* Shooting Breakdown */}
          {advanced.shooting_breakdown && (
            <ShootingBreakdown
              threePointAttempts={advanced.shooting_breakdown.three_point_attempts_pg}
              twoPointAttempts={
                (advanced.shooting_breakdown.points_per_game -
                  advanced.shooting_breakdown.three_point_makes_pg * 3 -
                  advanced.shooting_breakdown.free_throw_attempts_pg *
                    (advanced.shooting_breakdown.free_throw_pct / 100)) /
                2
              }
              freeThrowAttempts={advanced.shooting_breakdown.free_throw_attempts_pg}
              teamColor={colors.primary}
            />
          )}

          {/* Performance Trends */}
          {advanced.trends && advanced.trends.length > 0 && (
            <PerformanceTrends
              trends={advanced.trends}
              teamColor={colors.primary}
            />
          )}

          {/* Clutch Performance */}
          {advanced.clutch_stats && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Clutch Performance</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.clutch_stats.close_game_record}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Record in Close Games
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    (≤5 point margin)
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.clutch_stats.close_game_pct}%
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Close Game Win %
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4 text-center">
                  <div
                    className="text-3xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.clutch_stats.total_close_games}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    Total Close Games
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Metrics Summary */}
          {advanced.ratings && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Advanced Metrics Summary</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">True Shooting %</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.four_factors?.ts_pct}%
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Pace</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.ratings.pace?.toFixed(1)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">Net Rating</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.ratings.net_rating && advanced.ratings.net_rating > 0
                      ? '+'
                      : ''}
                    {advanced.ratings.net_rating?.toFixed(1)}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-sm text-slate-400 mb-1">eFG%</div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {advanced.four_factors?.efg_pct}%
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-400 space-y-1">
                <p>
                  <strong>Net Rating</strong> = Offensive Rating - Defensive Rating
                  (per 100 possessions)
                </p>
                <p>
                  <strong>Pace</strong> = Average possessions per 48 minutes
                </p>
                <p>
                  <strong>eFG%</strong> = Field Goal % adjusted for 3-pointers being
                  worth more
                </p>
                <p>
                  <strong>True Shooting%</strong> = Shooting efficiency including FTs
                  and 3-pointers
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Head-to-Head Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card variant="default">
          <CardHeader className="border-b border-surface-border">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: colors.primary }} />
              Compare vs Opponent
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {/* Opponent Selector */}
            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Select Opponent</label>
              <select
                value={selectedOpponent || ''}
                onChange={(e) => setSelectedOpponent(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full md:w-64 bg-white border border-slate-300 rounded-lg px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-red hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <option value="">Choose a team...</option>
                {otherTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* H2H Stats */}
            {selectedOpponent && h2hData && (
              <div className="space-y-6">
                {/* H2H Record */}
                <div className="p-4 rounded-lg bg-surface-elevated text-center">
                  <h4 className="text-lg font-bold text-white mb-2">
                    {info.full_name} vs {otherTeams.find(t => t.id === selectedOpponent)?.full_name}
                  </h4>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {h2hData.stats?.home_wins || 0} - {h2hData.stats?.away_wins || 0}
                  </p>
                  <p className="text-slate-400 text-sm">
                    ({h2hData.stats?.total_games || 0} total games)
                  </p>
                </div>

                {/* Stat Comparison */}
                {h2hData.stat_comparison && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(h2hData.stat_comparison).slice(0, 6).map(([stat, values]) => (
                      <div key={stat} className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated">
                        <span className="font-medium text-white">{(values as any)[parsedTeamId]?.toFixed(1) || '-'}</span>
                        <span className="text-slate-400 text-sm">{stat}</span>
                        <span className="font-medium text-white">{(values as any)[selectedOpponent]?.toFixed(1) || '-'}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Predict Button */}
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => navigate(`/predict?home=${parsedTeamId}&away=${selectedOpponent}`)}
                    style={{ backgroundColor: colors.primary }}
                    className="text-white"
                  >
                    <Target className="w-5 h-5 mr-2" />
                    Predict {info.nickname} vs {otherTeams.find(t => t.id === selectedOpponent)?.nickname}
                  </Button>
                </div>
              </div>
            )}

            {!selectedOpponent && (
              <p className="text-center text-slate-400 py-8">
                Select an opponent to see head-to-head comparison
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
