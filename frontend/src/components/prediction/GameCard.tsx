import { memo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Tv, ChevronRight, CheckCircle2, XCircle, TrendingUp, Trophy } from 'lucide-react';
import { cn, formatPercentage } from '../../lib/utils';
import { Card } from '../ui/card';
import { Badge, ConfidenceBadge } from '../ui/badge';
import { TeamLogo } from '../ui/team-logo';
import { ProbabilityBar } from './ProbabilityMeter';
import type { Game, Prediction } from '../../types';

interface GameCardProps {
  game: Game;
  prediction?: Prediction;
  onClick?: () => void;
  compact?: boolean;
  showPrediction?: boolean;
  className?: string;
}

// Memoized to prevent re-renders when parent updates but props haven't changed
// This is important because GameCard renders in lists (Today's Games, etc.)
export const GameCard = memo(function GameCard({
  game,
  prediction,
  onClick,
  compact = false,
  showPrediction = true,
  className,
}: GameCardProps) {
  const navigate = useNavigate();
  const isLive = game.game_status === 'in_progress';
  const isFinal = game.game_status === 'final';
  const isScheduled = game.game_status === 'scheduled';

  const homeWinProb = prediction?.home_win_prob ?? game.pre_game_home_prob ?? 0.5;
  const homeIsWinner = homeWinProb >= 0.5;

  // Calculate prediction result for completed games
  const hasScores = game.home_score !== undefined && game.away_score !== undefined;
  const actualHomeWon = isFinal && hasScores ? game.home_score! > game.away_score! : null;
  const predictedHomeWin = homeWinProb >= 0.5;
  const predictionCorrect = actualHomeWon !== null && prediction
    ? predictedHomeWin === actualHomeWon
    : null;

  // Calculate margin
  const margin = hasScores ? Math.abs(game.home_score! - game.away_score!) : 0;
  const actualWinnerName = actualHomeWon ? game.home_team_name : game.away_team_name;
  const actualWinnerAbbr = actualHomeWon ? game.home_team_abbreviation : game.away_team_abbreviation;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/predict?home=${game.home_team_id}&away=${game.away_team_id}`);
    }
  };

  // Card background based on prediction result
  const cardBgClass = isFinal && predictionCorrect !== null
    ? predictionCorrect
      ? "bg-gradient-to-br from-success/10 via-surface-card to-surface-card border-success/30"
      : "bg-gradient-to-br from-error/10 via-surface-card to-surface-card border-error/30"
    : "";

  return (
    <Card
      variant="glass"
      hover
      className={cn("overflow-hidden cursor-pointer transition-all duration-300", cardBgClass, className)}
      onClick={handleClick}
    >
      {/* Status bar - taller for completed with result */}
      <div
        className={cn(
          "h-1.5",
          isLive && "bg-success animate-pulse",
          isFinal && predictionCorrect === true && "bg-success",
          isFinal && predictionCorrect === false && "bg-error",
          isFinal && predictionCorrect === null && "bg-slate-500",
          isScheduled && "bg-primary-red"
        )}
      />

      <div className={cn("p-4", compact ? "space-y-3" : "space-y-4")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive && (
              <Badge variant="success" className="animate-pulse">
                LIVE
              </Badge>
            )}
            {isFinal && (
              <Badge variant="outline">FINAL</Badge>
            )}
            {isScheduled && (
              <div className="flex items-center gap-1 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                {game.game_time_et || game.game_status_text}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Prediction result badge for completed games */}
            {isFinal && predictionCorrect !== null && (
              predictionCorrect ? (
                <div className="flex items-center gap-1.5 bg-success/20 text-success px-2.5 py-1 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CORRECT</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-error/20 text-error px-2.5 py-1 rounded-full text-xs font-bold">
                  <XCircle className="w-4 h-4" />
                  <span>MISSED</span>
                </div>
              )
            )}
            {game.tv_broadcast && !isFinal && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Tv className="w-3 h-3" />
                {game.tv_broadcast}
              </div>
            )}
          </div>
        </div>

        {/* Teams with Scores - Enhanced for Final games */}
        <div className="space-y-3">
          {/* Away Team Row */}
          <div className="flex items-center justify-between">
            <Link
              to={`/teams/${game.away_team_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity flex-1"
            >
              <TeamLogo
                teamAbbr={game.away_team_abbreviation}
                teamId={game.away_team_id}
                teamName={game.away_team_name}
                size="md"
                className="group-hover:scale-110 transition-transform"
              />
              <div className="flex-1">
                <div className={cn(
                  "font-semibold group-hover:text-orange-400 transition-colors flex items-center gap-2",
                  isFinal && !actualHomeWon && "text-white",
                  isFinal && actualHomeWon && "text-slate-400",
                  isScheduled && !homeIsWinner && "text-white",
                  isScheduled && homeIsWinner && "text-slate-400"
                )}>
                  {compact ? game.away_team_abbreviation : game.away_team_name}
                  {isFinal && !actualHomeWon && (
                    <Trophy className="w-4 h-4 text-primary-gold" />
                  )}
                </div>
                {!compact && (
                  <div className="text-xs text-slate-500">Away</div>
                )}
              </div>
            </Link>

            {/* Score */}
            {(isLive || isFinal) && hasScores && (
              <div className={cn(
                "text-3xl font-bold tabular-nums",
                !actualHomeWon ? "text-white" : "text-slate-500"
              )}>
                {game.away_score}
              </div>
            )}

            {/* Prediction probability for scheduled */}
            {isScheduled && prediction && (
              <div className="text-right">
                <div className={cn(
                  "text-xl font-bold",
                  !homeIsWinner ? "text-primary-orange" : "text-slate-500"
                )}>
                  {formatPercentage(1 - homeWinProb)}
                </div>
              </div>
            )}
          </div>

          {/* Home Team Row */}
          <div className="flex items-center justify-between">
            <Link
              to={`/teams/${game.home_team_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity flex-1"
            >
              <TeamLogo
                teamAbbr={game.home_team_abbreviation}
                teamId={game.home_team_id}
                teamName={game.home_team_name}
                size="md"
                className="group-hover:scale-110 transition-transform"
              />
              <div className="flex-1">
                <div className={cn(
                  "font-semibold group-hover:text-orange-400 transition-colors flex items-center gap-2",
                  isFinal && actualHomeWon && "text-white",
                  isFinal && !actualHomeWon && "text-slate-400",
                  isScheduled && homeIsWinner && "text-white",
                  isScheduled && !homeIsWinner && "text-slate-400"
                )}>
                  {compact ? game.home_team_abbreviation : game.home_team_name}
                  {isFinal && actualHomeWon && (
                    <Trophy className="w-4 h-4 text-primary-gold" />
                  )}
                </div>
                {!compact && (
                  <div className="text-xs text-slate-500">Home</div>
                )}
              </div>
            </Link>

            {/* Score */}
            {(isLive || isFinal) && hasScores && (
              <div className={cn(
                "text-3xl font-bold tabular-nums",
                actualHomeWon ? "text-white" : "text-slate-500"
              )}>
                {game.home_score}
              </div>
            )}

            {/* Prediction probability for scheduled */}
            {isScheduled && prediction && (
              <div className="text-right">
                <div className={cn(
                  "text-xl font-bold",
                  homeIsWinner ? "text-primary-orange" : "text-slate-500"
                )}>
                  {formatPercentage(homeWinProb)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prediction Section for Scheduled Games */}
        {showPrediction && isScheduled && prediction && (
          <div className="space-y-3 pt-3 border-t border-white/10">
            <ProbabilityBar
              homeProb={homeWinProb}
              homeTeam={game.home_team_abbreviation}
              awayTeam={game.away_team_abbreviation}
              showLabels={false}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-orange" />
                <span className="text-sm text-slate-400">Predicted:</span>
                <span className="text-white font-semibold">
                  {homeIsWinner ? game.home_team_abbreviation : game.away_team_abbreviation}
                </span>
              </div>
              <ConfidenceBadge tier={prediction.confidence_tier} size="sm" />
            </div>
          </div>
        )}

        {/* Enhanced Prediction Result for Completed Games */}
        {showPrediction && isFinal && prediction && (
          <div className={cn(
            "rounded-lg p-3 mt-2",
            predictionCorrect
              ? "bg-success/10 border border-success/20"
              : "bg-error/10 border border-error/20"
          )}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {predictionCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-error" />
                )}
                <span className={cn(
                  "font-semibold",
                  predictionCorrect ? "text-success" : "text-error"
                )}>
                  {predictionCorrect ? "Prediction Correct!" : "Prediction Missed"}
                </span>
              </div>
              <ConfidenceBadge tier={prediction.confidence_tier} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-400">Predicted: </span>
                <span className={cn(
                  "font-medium",
                  predictionCorrect ? "text-white" : "text-error"
                )}>
                  {predictedHomeWin ? game.home_team_abbreviation : game.away_team_abbreviation}
                </span>
                <span className="text-slate-500 text-xs ml-1">
                  ({formatPercentage(Math.max(homeWinProb, 1 - homeWinProb))})
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Winner: </span>
                <span className="text-white font-medium">{actualWinnerAbbr}</span>
                <span className="text-slate-500 text-xs ml-1">
                  (+{margin})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Show margin for completed games without prediction */}
        {isFinal && !prediction && hasScores && (
          <div className="text-center text-sm text-slate-400 pt-2 border-t border-white/5">
            {actualWinnerName} won by {margin} points
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end text-sm text-slate-400 hover:text-white transition-colors pt-2">
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Card>
  );
});

// Compact game card for lists
interface CompactGameCardProps {
  game: Game;
  prediction?: Prediction;
  onClick?: () => void;
}

export const CompactGameCard = memo(function CompactGameCard({ game, prediction, onClick }: CompactGameCardProps) {
  const homeWinProb = prediction?.home_win_prob ?? game.pre_game_home_prob ?? 0.5;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg bg-surface-card/50 border border-white/5 cursor-pointer hover:border-primary-red/30 transition-all"
      )}
    >
      {/* Teams */}
      <div className="flex items-center gap-2 flex-1">
        <TeamLogo
          teamAbbr={game.home_team_abbreviation}
          teamId={game.home_team_id}
          teamName={game.home_team_name}
          size="sm"
        />
        <span className="text-slate-400 text-sm">vs</span>
        <TeamLogo
          teamAbbr={game.away_team_abbreviation}
          teamId={game.away_team_id}
          teamName={game.away_team_name}
          size="sm"
        />
      </div>

      {/* Probability */}
      <div className="text-right">
        <div className="text-sm font-medium text-white">
          {formatPercentage(homeWinProb)}
        </div>
        <div className="text-xs text-slate-400">
          {game.home_team_abbreviation}
        </div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-500" />
    </motion.div>
  );
});
