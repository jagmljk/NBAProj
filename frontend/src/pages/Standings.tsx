import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  ChevronDown,
  Flame,
  Snowflake,
  Calendar,
  Check,
  AlertCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { TeamLogo } from '../components/ui/team-logo';
import { cn } from '../lib/utils';
import { useStandings } from '../hooks/useApi';
import type { StandingsTeam } from '../types';

// Available seasons
const seasons = [
  { value: '2025-26', label: '2025-26', isCurrent: true },
  { value: '2024-25', label: '2024-25', isCurrent: false },
  { value: '2023-24', label: '2023-24', isCurrent: false },
  { value: '2022-23', label: '2022-23', isCurrent: false },
];

// Season selector dropdown
function SeasonSelector({
  selectedSeason,
  onSeasonChange,
}: {
  selectedSeason: string;
  onSeasonChange: (season: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSeason = seasons.find(s => s.value === selectedSeason) || seasons[0];

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-400 whitespace-nowrap">Season:</label>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="min-w-[180px] justify-between bg-slate-800 border-slate-700"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-white">{currentSeason.label}</span>
            {currentSeason.isCurrent && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">Current</Badge>
            )}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 ml-2 transition-transform text-slate-400",
            isOpen && "rotate-180"
          )} />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 mt-2 right-0 w-[200px] bg-surface-card rounded-lg shadow-xl overflow-hidden border border-surface-border"
          >
            <div className="py-1">
              {seasons.map((season) => (
                <button
                  key={season.value}
                  onClick={() => {
                    onSeasonChange(season.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-surface-elevated transition-colors",
                    selectedSeason === season.value && "bg-primary-red/10"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-white">{season.label}</span>
                    {season.isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary-red text-white rounded">Current</span>
                    )}
                  </span>
                  {selectedSeason === season.value && (
                    <Check className="w-4 h-4 text-primary-red" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Conference selector dropdown
function ConferenceSelector({
  selectedConference,
  onConferenceChange,
}: {
  selectedConference: 'All' | 'Eastern' | 'Western';
  onConferenceChange: (conf: 'All' | 'Eastern' | 'Western') => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-slate-400 whitespace-nowrap">Conference:</label>
      <select
        value={selectedConference}
        onChange={(e) => onConferenceChange(e.target.value as 'All' | 'Eastern' | 'Western')}
        className="bg-surface-card border border-surface-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-red min-w-[140px] hover:bg-surface-elevated cursor-pointer transition-colors"
      >
        <option value="All">All</option>
        <option value="Eastern">Eastern</option>
        <option value="Western">Western</option>
      </select>
    </div>
  );
}

function StreakBadge({ streak }: { streak: string }) {
  // Handle numeric streak format (e.g., "3" for W3 or "-2" for L2)
  const numericStreak = parseInt(streak);
  let isWinStreak = false;
  let isLossStreak = false;
  let displayStreak = streak;
  let count = 0;

  if (!isNaN(numericStreak)) {
    isWinStreak = numericStreak > 0;
    isLossStreak = numericStreak < 0;
    count = Math.abs(numericStreak);
    displayStreak = isWinStreak ? `W${count}` : isLossStreak ? `L${count}` : '-';
  } else {
    isWinStreak = streak.startsWith('W');
    isLossStreak = streak.startsWith('L');
    count = parseInt(streak.slice(1)) || 0;
    displayStreak = streak;
  }

  if (count >= 5) {
    return (
      <Badge
        variant={isWinStreak ? 'success' : 'error'}
        className="gap-1"
      >
        {isWinStreak ? <Flame className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
        {displayStreak}
      </Badge>
    );
  }

  return (
    <span className={cn(
      "text-sm font-medium",
      isWinStreak ? "text-green-400" : isLossStreak ? "text-red-400" : "text-slate-400"
    )}>
      {displayStreak}
    </span>
  );
}

function PlayoffIndicator({ rank, playoffCutoff, playinCutoff }: {
  rank: number;
  playoffCutoff: number;
  playinCutoff: number;
}) {
  if (rank <= playoffCutoff) {
    return (
      <div className="w-1.5 h-8 rounded-full bg-green-500" title="Playoff position" />
    );
  }
  if (rank <= playinCutoff) {
    return (
      <div className="w-1.5 h-8 rounded-full bg-yellow-500" title="Play-in position" />
    );
  }
  return (
    <div className="w-1.5 h-8 rounded-full bg-slate-600" title="Out of playoffs" />
  );
}

// Skeleton row for loading state
function SkeletonRow() {
  return (
    <div className="grid grid-cols-[auto,1fr,repeat(6,minmax(50px,80px))] gap-2 px-4 py-3 items-center animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-8 bg-slate-700 rounded-full" />
        <div className="w-4 h-4 bg-slate-700 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-700 rounded-full" />
        <div className="space-y-1">
          <div className="w-24 h-4 bg-slate-700 rounded" />
          <div className="w-16 h-3 bg-slate-700 rounded" />
        </div>
      </div>
      <div className="flex justify-center"><div className="w-8 h-4 bg-slate-700 rounded" /></div>
      <div className="flex justify-center"><div className="w-8 h-4 bg-slate-700 rounded" /></div>
      <div className="flex justify-center"><div className="w-10 h-4 bg-slate-700 rounded" /></div>
      <div className="flex justify-center"><div className="w-8 h-4 bg-slate-700 rounded" /></div>
      <div className="flex justify-center"><div className="w-8 h-4 bg-slate-700 rounded" /></div>
      <div className="flex justify-center"><div className="w-10 h-4 bg-slate-700 rounded" /></div>
    </div>
  );
}

// Standings table component
function StandingsTable({
  conference,
  teams,
  playoffCutoff,
  playinCutoff,
  showConferenceHeader = true,
}: {
  conference: string;
  teams: StandingsTeam[];
  playoffCutoff: number;
  playinCutoff: number;
  showConferenceHeader?: boolean;
}) {
  return (
    <Card variant="glass" className="overflow-hidden">
      {showConferenceHeader && (
        <CardHeader className="border-b border-surface-border">
          <CardTitle className="flex items-center gap-2">
            <Trophy className={cn(
              "w-5 h-5",
              conference === 'Eastern' ? 'text-blue-400' : 'text-red-400'
            )} />
            {conference} Conference
          </CardTitle>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 grid grid-cols-[auto,1fr,repeat(6,minmax(50px,80px))] gap-2 px-4 py-3 bg-slate-800 text-xs font-medium text-slate-400 border-b border-slate-700">
          <div className="w-10 text-center">#</div>
          <div>Team</div>
          <div className="text-center">W</div>
          <div className="text-center">L</div>
          <div className="text-center">PCT</div>
          <div className="text-center">GB</div>
          <div className="text-center">Streak</div>
          <div className="text-center">L10</div>
        </div>

        {/* Teams */}
        <div className="overflow-x-auto">
          {teams.map((team, index) => (
            <motion.div
              key={team.team_id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className={cn(
                "grid grid-cols-[auto,1fr,repeat(6,minmax(50px,80px))] gap-2 px-4 py-3 items-center transition-colors",
                // Alternating row colors
                index % 2 === 0 ? "bg-slate-900/30" : "bg-slate-800/30",
                // Hover effect
                "hover:bg-slate-700/50",
                // Playoff/Play-in borders
                index === playoffCutoff - 1 && "border-b-2 border-green-500/50",
                index === playinCutoff - 1 && "border-b-2 border-yellow-500/50"
              )}
            >
              {/* Rank & playoff indicator */}
              <div className="flex items-center gap-2 w-10">
                <PlayoffIndicator
                  rank={team.conference_rank}
                  playoffCutoff={playoffCutoff}
                  playinCutoff={playinCutoff}
                />
                <span className="text-sm font-bold text-slate-400 w-4 text-center">
                  {team.conference_rank}
                </span>
              </div>

              {/* Team info - clickable */}
              <Link
                to={`/teams/${team.team_id}`}
                className="flex items-center gap-3 min-w-0 group cursor-pointer"
              >
                <TeamLogo
                  teamAbbr={team.team_abbreviation}
                  teamId={team.team_id}
                  teamName={team.team_name}
                  size="sm"
                  className="group-hover:scale-110 transition-transform"
                />
                <div className="min-w-0">
                  <div className="font-medium text-white text-sm truncate group-hover:text-orange-400 transition-colors">
                    {team.team_name}
                  </div>
                  <div className="text-xs text-slate-500">{team.division}</div>
                </div>
                {team.clinched && (
                  <Badge variant="success" className="text-[10px] px-1.5 shrink-0">
                    {team.clinched}
                  </Badge>
                )}
              </Link>

              {/* Stats */}
              <div className="text-center text-sm font-semibold text-green-400">{team.wins}</div>
              <div className="text-center text-sm font-semibold text-red-400">{team.losses}</div>
              <div className="text-center text-sm font-medium text-white">
                .{(team.win_pct * 1000).toFixed(0).padStart(3, '0')}
              </div>
              <div className="text-center text-sm text-slate-400">
                {team.games_back === 0 ? '-' : team.games_back.toFixed(1)}
              </div>
              <div className="text-center">
                <StreakBadge streak={team.streak} />
              </div>
              <div className="text-center text-sm text-slate-400">{team.last_10}</div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StandingsLegend() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span>Playoff Position (1-6)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <span>Play-In Position (7-10)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-slate-600" />
        <span>Out of Playoffs</span>
      </div>
    </div>
  );
}

export function Standings() {
  const [selectedSeason, setSelectedSeason] = useState('2025-26');
  const [selectedConference, setSelectedConference] = useState<'All' | 'Eastern' | 'Western'>('All');

  const { data, isLoading, isError, refetch, isFetching } = useStandings(selectedSeason);

  // Filter indicator text
  const hasFilters = selectedConference !== 'All';
  const filterText = hasFilters
    ? `Showing: ${selectedSeason} Season • ${selectedConference} Conference`
    : null;

  // Reset filters
  const resetFilters = () => {
    setSelectedSeason('2025-26');
    setSelectedConference('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Standings</h1>
        <p className="text-slate-400">
          {data?.season ?? selectedSeason} Season • Updated {data?.date ?? 'today'}
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <SeasonSelector
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
        />
        <ConferenceSelector
          selectedConference={selectedConference}
          onConferenceChange={setSelectedConference}
        />

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="md:ml-auto">
            <Filter className="w-4 h-4 mr-1" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Filter Indicator */}
      {filterText && (
        <div className="mb-4 text-sm text-slate-400">
          {filterText}
        </div>
      )}

      {/* Legend */}
      <div className="mb-6">
        <StandingsLegend />
      </div>

      {/* Error State */}
      {isError && (
        <Card variant="glass" className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Couldn't Load Standings</h3>
          <p className="text-slate-400 mb-6">
            There was an error loading the standings data. Please try again.
          </p>
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} />
            Try Again
          </Button>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !isError && (
        <div className="space-y-6">
          {(selectedConference === 'All' ? [1, 2] : [1]).map((i) => (
            <Card key={i} variant="glass" className="overflow-hidden">
              <CardHeader className="border-b border-surface-border">
                <div className="h-6 w-48 bg-slate-700 rounded animate-pulse" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="sticky top-0 grid grid-cols-[auto,1fr,repeat(6,minmax(50px,80px))] gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                  <div className="w-10" />
                  <div className="h-4 w-12 bg-slate-700 rounded" />
                  {[1,2,3,4,5,6].map(j => (
                    <div key={j} className="h-4 w-8 bg-slate-700 rounded mx-auto" />
                  ))}
                </div>
                {[...Array(15)].map((_, j) => (
                  <SkeletonRow key={j} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Standings Tables */}
      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {(selectedConference === 'All' || selectedConference === 'Eastern') && data.eastern && (
            <StandingsTable
              conference="Eastern"
              teams={data.eastern.teams}
              playoffCutoff={data.eastern.playoff_cutoff}
              playinCutoff={data.eastern.playin_cutoff}
              showConferenceHeader={selectedConference === 'All'}
            />
          )}
          {(selectedConference === 'All' || selectedConference === 'Western') && data.western && (
            <StandingsTable
              conference="Western"
              teams={data.western.teams}
              playoffCutoff={data.western.playoff_cutoff}
              playinCutoff={data.western.playin_cutoff}
              showConferenceHeader={selectedConference === 'All'}
            />
          )}
        </div>
      )}
    </div>
  );
}
