import axios from 'axios';
import type {
  Team,
  TeamDetail,
  TeamSchedule,
  HeadToHead,
  Prediction,
  PredictionRequest,
  BatchPredictionRequest,
  Game,
  UpsetWatchGame,
  ConfidenceTierGame,
  ConfidenceTierStats,
  TeamTrend,
  ModelInfo,
  ModelPerformance,
  FeatureImportance,
  ConferenceStandings,
  HealthResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const getHealth = async (): Promise<HealthResponse> => {
  const { data } = await api.get('/health');
  return data;
};

// Teams
export const getTeams = async (): Promise<{ teams: Team[]; total: number }> => {
  const { data } = await api.get('/api/v1/teams');
  return data;
};

export const getTeamById = async (teamId: number, season?: string): Promise<TeamDetail> => {
  const params = season ? { season } : {};
  const { data } = await api.get(`/api/v1/teams/${teamId}`, { params });
  return data;
};

export const getTeamSchedule = async (teamId: number, season?: string): Promise<TeamSchedule> => {
  const params = season ? { season } : {};
  const { data } = await api.get(`/api/v1/teams/${teamId}/schedule`, { params });
  return data;
};

export const getHeadToHead = async (
  teamId: number,
  opponentId: number
): Promise<HeadToHead> => {
  const { data } = await api.get(`/api/v1/teams/${teamId}/vs/${opponentId}`);
  return data;
};

// Predictions
export const getPrediction = async (
  request: PredictionRequest
): Promise<Prediction> => {
  const { data } = await api.post('/api/v1/predict', request);
  return data;
};

export const getBatchPredictions = async (
  request: BatchPredictionRequest
): Promise<{ predictions: Prediction[] }> => {
  const { data } = await api.post('/api/v1/predict/batch', request);
  return data;
};

export const getTodaysPredictions = async (): Promise<{
  date: string;
  games: Array<Game & { prediction: Prediction }>;
  total_games: number;
}> => {
  const { data } = await api.get('/api/v1/predict/today');
  return data;
};

export const simulatePrediction = async (request: {
  home_team_id: number;
  away_team_id: number;
  adjustments?: Record<string, number>;
}): Promise<{
  base_prediction: Prediction;
  adjusted_prediction: Prediction;
  impact_analysis: Record<string, number>;
}> => {
  const { data } = await api.post('/api/v1/predict/simulate', request);
  return data;
};

// Analytics
export const getUpsetWatch = async (
  threshold?: number
): Promise<{
  date: string;
  games: UpsetWatchGame[];
  total_games: number;
  upset_threshold: number;
}> => {
  const params = threshold ? { threshold } : {};
  const { data } = await api.get('/api/v1/analytics/upset-watch', { params });
  return data;
};

export const getConfidenceTiers = async (): Promise<{
  date: string;
  tiers: Record<string, ConfidenceTierGame[]>;
  tier_stats: ConfidenceTierStats[];
  total_games: number;
}> => {
  const { data } = await api.get('/api/v1/analytics/confidence-tiers');
  return data;
};

export const getTeamTrends = async (
  season?: string
): Promise<{
  date: string;
  hot_teams: TeamTrend[];
  cold_teams: TeamTrend[];
  rising_teams: TeamTrend[];
  falling_teams: TeamTrend[];
  streak_leaders: Record<string, TeamTrend>;
}> => {
  const params = season ? { season } : {};
  const { data } = await api.get('/api/v1/analytics/trends', { params });
  return data;
};

// Model
export const getModelInfo = async (): Promise<ModelInfo> => {
  const { data } = await api.get('/api/v1/model/info');
  return data;
};

export const getModelPerformance = async (): Promise<ModelPerformance> => {
  const { data } = await api.get('/api/v1/model/performance');
  return data;
};

export const getFeatureImportance = async (
  topN?: number
): Promise<{
  features: FeatureImportance[];
  total_features: number;
}> => {
  const params = topN ? { top_n: topN } : {};
  const { data } = await api.get('/api/v1/model/features', { params });
  return data;
};

export const getModelCalibration = async (): Promise<{
  bins: Array<{
    predicted_prob: number;
    actual_rate: number;
    count: number;
  }>;
  calibration_error: number;
  status: string;
  brier_score?: number;
}> => {
  const { data } = await api.get('/api/v1/model/calibration');
  return data;
};

// Live data
export const getScoreboard = async (
  date?: string
): Promise<{
  date: string;
  games: Game[];
  games_in_progress: number;
  games_completed: number;
  games_scheduled: number;
  last_updated: string;
}> => {
  const params = date ? { date } : {};
  const { data } = await api.get('/api/v1/live/scoreboard', { params });
  return data;
};

export const getStandings = async (
  season?: string
): Promise<{
  season: string;
  date: string;
  eastern: ConferenceStandings;
  western: ConferenceStandings;
  last_updated: string;
}> => {
  const params = season ? { season } : {};
  const { data } = await api.get('/api/v1/live/standings', { params });
  return data;
};

export const getLeagueSchedule = async (
  days?: number
): Promise<{
  start_date: string;
  days: number;
  total_games: number;
  games: Array<{
    date: string;
    game_id: string;
    home_team_id: number;
    away_team_id: number;
    time: string;
    tv?: string;
  }>;
}> => {
  const params = days ? { days } : {};
  const { data } = await api.get('/api/v1/live/schedule', { params });
  return data;
};

// Prediction Validation
export interface ValidatedGame {
  game_id: string;
  game_date: string;
  home_team: string;
  home_team_abbr: string;
  away_team: string;
  away_team_abbr: string;
  home_score: number;
  away_score: number;
  actual_winner: string;
  predicted_winner: string;
  home_win_prob: number;
  confidence_tier: string;
  is_correct: boolean;
  validated_at: string;
}

export interface TierAccuracy {
  correct: number;
  total: number;
  accuracy: number | null;
}

export interface ValidationResponse {
  date: string;
  total_games: number;
  validated_games: number;
  correct_predictions: number;
  accuracy: number | null;
  accuracy_by_tier: Record<string, TierAccuracy>;
  games: ValidatedGame[];
  validated_at: string;
  message?: string;
}

export interface AccuracyStatsResponse {
  total_validated: number;
  correct: number;
  accuracy: number | null;
  by_tier: Record<string, TierAccuracy>;
  first_validation: string | null;
  last_validation: string | null;
  message?: string;
}

export interface ValidationRangeResponse {
  start_date: string;
  end_date: string;
  days_with_games: number;
  total_games: number;
  correct_predictions: number;
  overall_accuracy: number | null;
  accuracy_by_tier: Record<string, TierAccuracy>;
  daily_results: ValidationResponse[];
  validated_at: string;
}

export const validatePredictions = async (date?: string): Promise<ValidationResponse> => {
  const params = date ? { date } : {};
  const { data } = await api.get('/api/v1/analytics/validate', { params });
  return data;
};

export const validateToday = async (): Promise<ValidationResponse> => {
  const { data } = await api.get('/api/v1/analytics/validate/today');
  return data;
};

export const validateRecent = async (days: number = 7): Promise<ValidationRangeResponse> => {
  const { data } = await api.get('/api/v1/analytics/validate/recent', { params: { days } });
  return data;
};

export const getAccuracyStats = async (): Promise<AccuracyStatsResponse> => {
  const { data } = await api.get('/api/v1/analytics/accuracy');
  return data;
};

export default api;
