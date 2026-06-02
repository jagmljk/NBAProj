// Team types
export interface Team {
  id: number;
  full_name: string;
  abbreviation: string;
  nickname: string;
  city: string;
  state?: string;
  year_founded?: number;
}

export interface TeamStats {
  team_id: number;
  season: string;
  games_played: number;
  wins: number;
  losses: number;
  win_pct: number;
  pts_per_game: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  reb_per_game: number;
  ast_per_game: number;
  plus_minus: number;
}

export interface RecentForm {
  last_10_record: string;
  streak: string;
  avg_pts_last_10: number;
  avg_opp_pts_last_10: number;
  home_record: string;
  away_record: string;
}

// Advanced stats types
export interface FourFactors {
  efg_pct: number;
  tov_pct: number;
  orb_pct: number;
  ftr: number;
  ts_pct: number;
}

export interface TeamRatings {
  off_rating: number | null;
  def_rating: number | null;
  net_rating: number | null;
  pace: number | null;
}

export interface ShootingBreakdown {
  three_point_attempts_pg: number;
  three_point_makes_pg: number;
  three_point_pct: number;
  two_point_pct: number;
  free_throw_attempts_pg: number;
  free_throw_pct: number;
  points_per_game: number;
}

export interface DefensiveMetrics {
  steals_pg: number;
  blocks_pg: number;
  dreb_pg: number;
}

export interface ClutchStats {
  close_game_record: string;
  close_game_pct: number;
  total_close_games: number;
}

export interface TrendDataPoint {
  game_num: number;
  date: string;
  rolling_ppg: number;
  rolling_opp_ppg: number;
  rolling_win_pct: number;
  rolling_plus_minus: number;
}

export interface AdvancedStats {
  four_factors: FourFactors | null;
  ratings: TeamRatings | null;
  shooting_breakdown: ShootingBreakdown | null;
  defensive_metrics: DefensiveMetrics | null;
  clutch_stats: ClutchStats | null;
  trends: TrendDataPoint[] | null;
}

export interface TeamDetail {
  info: Team;
  stats: TeamStats;
  recent_form: RecentForm;
  ranking: Record<string, number>;
  advanced?: AdvancedStats;
}

// Prediction types
export interface PredictionRequest {
  home_team_id: number;
  away_team_id: number;
  game_date?: string;
  include_explanation?: boolean;
}

export interface Prediction {
  home_team_id: number;
  away_team_id: number;
  home_win_prob: number;
  away_win_prob: number;
  predicted_winner: 'home' | 'away';
  confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
  key_factors?: KeyFactor[];
  explanation?: string;
  game_date?: string;
}

export interface KeyFactor {
  name: string;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
  description?: string;
}

export interface BatchPredictionRequest {
  games: Array<{
    home_team_id: number;
    away_team_id: number;
    game_date?: string;
  }>;
}

// Game types
export interface Game {
  game_id: string;
  game_date: string;
  home_team_id: number;
  home_team_name: string;
  home_team_abbreviation: string;
  away_team_id: number;
  away_team_name: string;
  away_team_abbreviation: string;
  game_status: 'scheduled' | 'in_progress' | 'final';
  game_status_text: string;
  home_score?: number;
  away_score?: number;
  game_time_et?: string;
  tv_broadcast?: string;
  arena?: string;
  pre_game_home_prob?: number;
  predicted_winner?: string;
}

export interface GameWithPrediction extends Game {
  prediction?: Prediction;
}

// Analytics types
export interface UpsetWatchGame {
  game_id: string;
  game_date: string;
  favorite_team_id: number;
  favorite_team_name: string;
  underdog_team_id: number;
  underdog_team_name: string;
  underdog_win_prob: number;
  upset_score: number;
  is_home_favorite: boolean;
}

export interface ConfidenceTierGame {
  game_id: string;
  game_date: string;
  home_team_id: number;
  home_team_name: string;
  away_team_id: number;
  away_team_name: string;
  home_win_prob: number;
  predicted_winner: string;
  confidence_tier: string;
}

export interface ConfidenceTierStats {
  tier: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy: number;
  avg_probability: number;
}

export interface TeamTrend {
  team_id: number;
  team_name: string;
  trend_type: 'hot' | 'cold' | 'neutral';
  last_10_record: string;
  last_10_win_pct: number;
  season_win_pct: number;
  trend_score: number;
  momentum_direction: 'rising' | 'falling' | 'stable';
  avg_margin_last_10: number;
  current_streak: string;
}

// Model types
export interface ModelInfo {
  model_type: string;
  model_loaded: boolean;
  features_count: number;
  training_date?: string;
  model_version: string;
}

export interface ModelPerformance {
  model_name: string;
  train_accuracy: number;
  val_accuracy: number;
  test_accuracy: number;
  train_auc: number;
  val_auc: number;
  test_auc: number;
  val_precision?: number;
  val_recall?: number;
  val_f1?: number;
  test_precision?: number;
  test_recall?: number;
  test_f1?: number;
  val_brier?: number;
  val_log_loss?: number;
  total_games?: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  category?: string;
}

// Standings types
export interface StandingsTeam {
  team_id: number;
  team_name: string;
  team_abbreviation: string;
  conference: string;
  division: string;
  conference_rank: number;
  division_rank: number;
  wins: number;
  losses: number;
  win_pct: number;
  games_back: number;
  home_record: string;
  road_record: string;
  last_10: string;
  streak: string;
  clinched?: string;
}

export interface ConferenceStandings {
  conference: string;
  teams: StandingsTeam[];
  playoff_cutoff: number;
  playin_cutoff: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  components: Record<string, string>;
}

// Schedule types
export interface ScheduleGame {
  game_id: string;
  game_date: string;
  opponent_id: number;
  opponent_name: string;
  is_home: boolean;
  result?: string;
  prediction?: {
    win_prob: number;
    confidence: string;
  };
}

export interface TeamSchedule {
  team_id: number;
  team_name: string;
  upcoming_games: ScheduleGame[];
  recent_games: ScheduleGame[];
  rest_days_until_next: number;
}

// Head to head types
export interface HeadToHeadStats {
  home_team_id: number;
  away_team_id: number;
  total_games: number;
  home_wins: number;
  away_wins: number;
  home_avg_pts: number;
  away_avg_pts: number;
}

export interface HeadToHead {
  stats: HeadToHeadStats;
  recent_games: Game[];
  stat_comparison: Record<string, Record<string, number>>;
  prediction?: Prediction;
}
