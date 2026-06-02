import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Star,
  ChevronRight,
  AlertCircle,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { TeamLogo } from '../components/ui/team-logo';
import { cn } from '../lib/utils';
import { useTeams, useStandings } from '../hooks/useApi';
import { useAppStore } from '../store';
import { getTeamColors } from '../constants/teamColors';
import type { Team } from '../types';

// Available seasons
const seasons = ['2025-26', '2024-25', '2023-24', '2022-23'];

// Division mapping by conference
const divisions = {
  Eastern: ['Atlantic', 'Central', 'Southeast'],
  Western: ['Northwest', 'Pacific', 'Southwest'],
};

// Team to conference/division mapping (based on NBA structure)
const teamConferences: Record<number, { conference: string; division: string }> = {
  // Eastern Conference - Atlantic
  1610612738: { conference: 'Eastern', division: 'Atlantic' }, // Celtics
  1610612751: { conference: 'Eastern', division: 'Atlantic' }, // Nets
  1610612752: { conference: 'Eastern', division: 'Atlantic' }, // Knicks
  1610612755: { conference: 'Eastern', division: 'Atlantic' }, // 76ers
  1610612761: { conference: 'Eastern', division: 'Atlantic' }, // Raptors
  // Eastern Conference - Central
  1610612741: { conference: 'Eastern', division: 'Central' }, // Bulls
  1610612739: { conference: 'Eastern', division: 'Central' }, // Cavaliers
  1610612765: { conference: 'Eastern', division: 'Central' }, // Pistons
  1610612754: { conference: 'Eastern', division: 'Central' }, // Pacers
  1610612749: { conference: 'Eastern', division: 'Central' }, // Bucks
  // Eastern Conference - Southeast
  1610612737: { conference: 'Eastern', division: 'Southeast' }, // Hawks
  1610612766: { conference: 'Eastern', division: 'Southeast' }, // Hornets
  1610612748: { conference: 'Eastern', division: 'Southeast' }, // Heat
  1610612753: { conference: 'Eastern', division: 'Southeast' }, // Magic
  1610612764: { conference: 'Eastern', division: 'Southeast' }, // Wizards
  // Western Conference - Northwest
  1610612743: { conference: 'Western', division: 'Northwest' }, // Nuggets
  1610612750: { conference: 'Western', division: 'Northwest' }, // Timberwolves
  1610612760: { conference: 'Western', division: 'Northwest' }, // Thunder
  1610612757: { conference: 'Western', division: 'Northwest' }, // Trail Blazers
  1610612762: { conference: 'Western', division: 'Northwest' }, // Jazz
  // Western Conference - Pacific
  1610612744: { conference: 'Western', division: 'Pacific' }, // Warriors
  1610612746: { conference: 'Western', division: 'Pacific' }, // Clippers
  1610612747: { conference: 'Western', division: 'Pacific' }, // Lakers
  1610612756: { conference: 'Western', division: 'Pacific' }, // Suns
  1610612758: { conference: 'Western', division: 'Pacific' }, // Kings
  // Western Conference - Southwest
  1610612742: { conference: 'Western', division: 'Southwest' }, // Mavericks
  1610612745: { conference: 'Western', division: 'Southwest' }, // Rockets
  1610612763: { conference: 'Western', division: 'Southwest' }, // Grizzlies
  1610612740: { conference: 'Western', division: 'Southwest' }, // Pelicans
  1610612759: { conference: 'Western', division: 'Southwest' }, // Spurs
};

interface TeamStanding {
  team_id: number;
  team_name: string;
  wins: number;
  losses: number;
  win_pct: number;
  last_10: string;
  streak: string;
  conference_rank: number;
  division_rank: number;
  home_record: string;
  road_record: string;
}

// Streak indicator component
function StreakBadge({ streak }: { streak?: string }) {
  if (!streak) return null;

  const streakNum = parseInt(streak);
  const isWinStreak = streakNum > 0;
  const absStreak = Math.abs(streakNum);

  if (absStreak === 0) {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400">
        <Minus className="w-3 h-3" />
      </span>
    );
  }

  return (
    <span className={cn(
      "flex items-center gap-1 text-xs font-medium",
      isWinStreak ? "text-green-400" : "text-red-400"
    )}>
      {isWinStreak ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isWinStreak ? 'W' : 'L'}{absStreak}
    </span>
  );
}

// Form dots component
function FormDots({ last10 }: { last10?: string }) {
  if (!last10) return null;

  const match = last10.match(/(\d+)-(\d+)/);
  if (!match) return null;

  const wins = parseInt(match[1]);
  const losses = parseInt(match[2]);

  return (
    <div className="flex items-center gap-0.5">
      {Array(wins).fill(null).map((_, i) => (
        <div key={`w-${i}`} className="w-1.5 h-1.5 rounded-full bg-green-500" />
      ))}
      {Array(losses).fill(null).map((_, i) => (
        <div key={`l-${i}`} className="w-1.5 h-1.5 rounded-full bg-red-500" />
      ))}
    </div>
  );
}

// Team card component with color theme
function TeamCard({
  team,
  standing,
  isFavorite,
  onToggleFavorite,
  season,
}: {
  team: Team;
  standing?: TeamStanding;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  season: string;
}) {
  const colors = getTeamColors(team.full_name);
  const winPct = standing ? (standing.wins / (standing.wins + standing.losses)) * 100 : 0;

  return (
    <Link to={`/teams/${team.id}?season=${season}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: -8,
          transition: { duration: 0.2, ease: 'easeOut' }
        }}
        whileTap={{ scale: 0.98 }}
        className="h-full"
      >
        <div
          className="relative h-full rounded-xl overflow-hidden cursor-pointer group"
          style={{
            background: `linear-gradient(145deg, ${colors.primary}30 0%, ${colors.secondary}20 50%, ${colors.primary}15 100%)`,
          }}
        >
          {/* Animated gradient border */}
          <div
            className="absolute inset-0 rounded-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary}, ${colors.primary})`,
              backgroundSize: '200% 200%',
              padding: '2px',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'xor',
              WebkitMaskComposite: 'xor',
            }}
          />

          {/* Inner card with team color tint */}
          <div
            className="relative h-full backdrop-blur-sm rounded-xl p-5 border border-white/10"
            style={{
              background: `linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)`,
            }}
          >
            {/* Top accent line with gradient */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-xl"
              style={{
                background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
              }}
            />

            {/* Glow effect behind logo area */}
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity"
              style={{ background: colors.primary }}
            />

            {/* Favorite button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-10"
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-all",
                  isFavorite
                    ? "fill-yellow-400 text-yellow-400 drop-shadow-glow"
                    : "text-white/40 hover:text-yellow-400"
                )}
              />
            </button>

            {/* Conference rank badge */}
            {standing?.conference_rank && standing.conference_rank <= 3 && (
              <div className="absolute top-3 left-3">
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: standing.conference_rank === 1 ? 'linear-gradient(135deg, #FFD700, #FFA500)' :
                      standing.conference_rank === 2 ? 'linear-gradient(135deg, #C0C0C0, #A0A0A0)' :
                        'linear-gradient(135deg, #CD7F32, #8B4513)',
                    color: '#000',
                  }}
                >
                  <Trophy className="w-3 h-3" />
                  #{standing.conference_rank}
                </div>
              </div>
            )}

            {/* Team content */}
            <div className="flex flex-col items-center text-center pt-6">
              {/* Logo with glow effect */}
              <div
                className="relative mb-4"
                style={{
                  filter: `drop-shadow(0 0 20px ${colors.primary}40)`,
                }}
              >
                <TeamLogo
                  teamAbbr={team.abbreviation}
                  teamId={team.id}
                  teamName={team.full_name}
                  size="xl"
                />
              </div>

              {/* Team name */}
              <h3 className="font-bold text-white text-lg mb-1 group-hover:text-white transition-colors">
                {team.full_name}
              </h3>

              {/* Record with win percentage bar */}
              {standing ? (
                <div className="w-full mb-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span
                      className="text-2xl font-bold"
                      style={{ color: colors.primary }}
                    >
                      {standing.wins}
                    </span>
                    <span className="text-slate-500">-</span>
                    <span className="text-2xl font-bold text-slate-400">
                      {standing.losses}
                    </span>
                  </div>

                  {/* Win percentage bar */}
                  <div className="relative h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${winPct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="absolute top-0 left-0 h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {(winPct).toFixed(1)}% Win Rate
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm mb-3">No data</p>
              )}

              {/* Stats row */}
              {standing && (
                <div className="flex items-center justify-center gap-4 mb-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Last 10</p>
                    <FormDots last10={standing.last_10} />
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="text-center">
                    <p className="text-xs text-slate-500">Streak</p>
                    <StreakBadge streak={standing.streak} />
                  </div>
                </div>
              )}

              {/* Conference/Division */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
                >
                  {teamConferences[team.id]?.conference}
                </span>
                <span className="text-slate-600">•</span>
                <span>{teamConferences[team.id]?.division}</span>
              </div>

              {/* View Details */}
              <div className="flex items-center justify-center mt-4 text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                style={{ color: colors.primary }}
              >
                View Details
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Skeleton card for loading state
function SkeletonTeamCard() {
  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 animate-pulse">
        <div className="h-1 bg-slate-700 rounded-t-xl absolute top-0 left-0 right-0" />
        <div className="flex flex-col items-center pt-6">
          <div className="w-20 h-20 bg-slate-700 rounded-full mb-4" />
          <div className="h-5 w-32 bg-slate-700 rounded mb-3" />
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-slate-700 rounded" />
            <div className="h-4 w-4 bg-slate-700 rounded" />
            <div className="h-8 w-8 bg-slate-700 rounded" />
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full mb-3" />
          <div className="flex gap-4 mb-3">
            <div className="h-8 w-16 bg-slate-700 rounded" />
            <div className="h-8 w-16 bg-slate-700 rounded" />
          </div>
          <div className="h-4 w-24 bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export function Teams() {
  const [selectedSeason, setSelectedSeason] = useState('2025-26');
  const { data: teamsData, isLoading: teamsLoading } = useTeams();
  const { data: standingsData, isLoading: standingsLoading } = useStandings(selectedSeason);
  const { favoriteTeams, addFavorite, removeFavorite, isFavorite } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConference, setSelectedConference] = useState<'All' | 'Eastern' | 'Western'>('All');
  const [selectedDivision, setSelectedDivision] = useState<string>('All');
  const [showFavorites, setShowFavorites] = useState(false);

  const teams = teamsData?.teams ?? [];
  const isLoading = teamsLoading || standingsLoading;

  // Build standings lookup map
  const standingsMap = useMemo(() => {
    const map: Record<number, TeamStanding> = {};
    if (standingsData) {
      standingsData.eastern?.teams?.forEach((team: TeamStanding) => {
        map[team.team_id] = team;
      });
      standingsData.western?.teams?.forEach((team: TeamStanding) => {
        map[team.team_id] = team;
      });
    }
    return map;
  }, [standingsData]);

  // Get available divisions based on selected conference
  const availableDivisions = useMemo(() => {
    if (selectedConference === 'All') {
      return [...divisions.Eastern, ...divisions.Western];
    }
    return divisions[selectedConference];
  }, [selectedConference]);

  // Reset division when conference changes
  const handleConferenceChange = (conf: 'All' | 'Eastern' | 'Western') => {
    setSelectedConference(conf);
    setSelectedDivision('All');
  };

  // Filter and search teams
  const filteredTeams = useMemo(() => {
    let result = teams;

    if (showFavorites) {
      result = result.filter((team) => favoriteTeams.includes(team.id));
    }

    if (selectedConference !== 'All') {
      result = result.filter((team) =>
        teamConferences[team.id]?.conference === selectedConference
      );
    }

    if (selectedDivision !== 'All') {
      result = result.filter((team) =>
        teamConferences[team.id]?.division === selectedDivision
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (team) =>
          team.full_name.toLowerCase().includes(query) ||
          team.nickname.toLowerCase().includes(query) ||
          team.city.toLowerCase().includes(query) ||
          team.abbreviation.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then by wins, then alphabetically
    return result.sort((a, b) => {
      const aFav = favoriteTeams.includes(a.id);
      const bFav = favoriteTeams.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      const aWins = standingsMap[a.id]?.wins ?? 0;
      const bWins = standingsMap[b.id]?.wins ?? 0;
      if (aWins !== bWins) return bWins - aWins;

      return a.full_name.localeCompare(b.full_name);
    });
  }, [teams, searchQuery, selectedConference, selectedDivision, showFavorites, favoriteTeams, standingsMap]);

  const handleToggleFavorite = (teamId: number) => {
    if (isFavorite(teamId)) {
      removeFavorite(teamId);
    } else {
      addFavorite(teamId);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedConference('All');
    setSelectedDivision('All');
    setShowFavorites(false);
  };

  const hasActiveFilters = searchQuery || selectedConference !== 'All' || selectedDivision !== 'All' || showFavorites;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">NBA Teams</h1>
            <p className="text-slate-400">
              Browse all 30 NBA teams • {selectedSeason} Season
            </p>
          </div>

          {/* Season Tabs */}
          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-slate-500 ml-2" />
            {seasons.map((season) => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
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
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Conference dropdown */}
          <select
            value={selectedConference}
            onChange={(e) => handleConferenceChange(e.target.value as 'All' | 'Eastern' | 'Western')}
            className="bg-surface-card border border-surface-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-red hover:bg-surface-elevated cursor-pointer transition-colors"
          >
            <option value="All">All Conferences</option>
            <option value="Eastern">Eastern</option>
            <option value="Western">Western</option>
          </select>

          {/* Division dropdown */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            disabled={selectedConference === 'All'}
            className={cn(
              "bg-surface-card border border-surface-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-red hover:bg-surface-elevated cursor-pointer transition-colors",
              selectedConference === 'All' && "opacity-50 cursor-not-allowed"
            )}
          >
            <option value="All">All Divisions</option>
            {availableDivisions.map((div) => (
              <option key={div} value={div}>{div}</option>
            ))}
          </select>

          {/* Favorites toggle */}
          <Button
            variant={showFavorites ? 'default' : 'outline'}
            onClick={() => setShowFavorites(!showFavorites)}
            className="whitespace-nowrap"
          >
            <Star className={cn("w-4 h-4 mr-1", showFavorites && "fill-current")} />
            Favorites
          </Button>
        </div>
      </div>

      {/* Teams count and reset */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-400">
          Showing {filteredTeams.length} of {teams.length} teams
        </p>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <Filter className="w-4 h-4 mr-1" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Teams grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array(32).fill(null).map((_, i) => (
            <SkeletonTeamCard key={i} />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <Card variant="glass" className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Teams Found</h3>
          <p className="text-slate-400 mb-6">
            No teams found matching your filters
          </p>
          <Button onClick={resetFilters}>
            Reset Filters
          </Button>
        </Card>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.03
              }
            }
          }}
        >
          {filteredTeams.map((team) => (
            <motion.div
              key={team.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
            >
              <TeamCard
                team={team}
                standing={standingsMap[team.id]}
                isFavorite={isFavorite(team.id)}
                onToggleFavorite={() => handleToggleFavorite(team.id)}
                season={selectedSeason}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
