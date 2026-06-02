import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../services/api';
import type { PredictionRequest, BatchPredictionRequest } from '../types';

// Query keys
export const queryKeys = {
  health: ['health'],
  teams: ['teams'],
  team: (id: number) => ['team', id],
  teamSchedule: (id: number) => ['teamSchedule', id],
  headToHead: (teamId: number, opponentId: number) => ['headToHead', teamId, opponentId],
  todaysPredictions: ['todaysPredictions'],
  upsetWatch: (threshold?: number) => ['upsetWatch', threshold],
  confidenceTiers: ['confidenceTiers'],
  teamTrends: (season?: string) => ['teamTrends', season],
  modelInfo: ['modelInfo'],
  modelPerformance: ['modelPerformance'],
  featureImportance: (topN?: number) => ['featureImportance', topN],
  modelCalibration: ['modelCalibration'],
  scoreboard: (date?: string) => ['scoreboard', date],
  standings: (season?: string) => ['standings', season],
  leagueSchedule: (days?: number) => ['leagueSchedule', days],
  // Validation
  validatePredictions: (date?: string) => ['validatePredictions', date],
  validateToday: ['validateToday'],
  validateRecent: (days: number) => ['validateRecent', days],
  accuracyStats: ['accuracyStats'],
};

// Health
export const useHealth = () => {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });
};

// Teams
export const useTeams = () => {
  return useQuery({
    queryKey: queryKeys.teams,
    queryFn: api.getTeams,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useTeam = (teamId: number, season?: string) => {
  return useQuery({
    queryKey: [...queryKeys.team(teamId), season],
    queryFn: () => api.getTeamById(teamId, season),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTeamSchedule = (teamId: number, season?: string) => {
  return useQuery({
    queryKey: [...queryKeys.teamSchedule(teamId), season],
    queryFn: () => api.getTeamSchedule(teamId, season),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useHeadToHead = (teamId: number, opponentId: number) => {
  return useQuery({
    queryKey: queryKeys.headToHead(teamId, opponentId),
    queryFn: () => api.getHeadToHead(teamId, opponentId),
    enabled: !!teamId && !!opponentId,
    staleTime: 1000 * 60 * 5,
  });
};

// Predictions
export const usePrediction = () => {
  return useMutation({
    mutationFn: (request: PredictionRequest) => api.getPrediction(request),
  });
};

export const useBatchPredictions = () => {
  return useMutation({
    mutationFn: (request: BatchPredictionRequest) => api.getBatchPredictions(request),
  });
};

export const useTodaysPredictions = () => {
  return useQuery({
    queryKey: queryKeys.todaysPredictions,
    queryFn: api.getTodaysPredictions,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // 5 minutes
  });
};

export const useSimulatePrediction = () => {
  return useMutation({
    mutationFn: (request: {
      home_team_id: number;
      away_team_id: number;
      adjustments?: Record<string, number>;
    }) => api.simulatePrediction(request),
  });
};

// Analytics
export const useUpsetWatch = (threshold?: number) => {
  return useQuery({
    queryKey: queryKeys.upsetWatch(threshold),
    queryFn: () => api.getUpsetWatch(threshold),
    staleTime: 1000 * 60 * 5,
  });
};

export const useConfidenceTiers = () => {
  return useQuery({
    queryKey: queryKeys.confidenceTiers,
    queryFn: api.getConfidenceTiers,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTeamTrends = (season?: string) => {
  return useQuery({
    queryKey: queryKeys.teamTrends(season),
    queryFn: () => api.getTeamTrends(season),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

// Model
export const useModelInfo = () => {
  return useQuery({
    queryKey: queryKeys.modelInfo,
    queryFn: api.getModelInfo,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};

export const useModelPerformance = () => {
  return useQuery({
    queryKey: queryKeys.modelPerformance,
    queryFn: api.getModelPerformance,
    staleTime: 1000 * 60 * 60,
  });
};

export const useFeatureImportance = (topN?: number) => {
  return useQuery({
    queryKey: queryKeys.featureImportance(topN),
    queryFn: () => api.getFeatureImportance(topN),
    staleTime: 1000 * 60 * 60,
  });
};

export const useModelCalibration = () => {
  return useQuery({
    queryKey: queryKeys.modelCalibration,
    queryFn: api.getModelCalibration,
    staleTime: 1000 * 60 * 60,
  });
};

// Live data
export const useScoreboard = (date?: string) => {
  return useQuery({
    queryKey: queryKeys.scoreboard(date),
    queryFn: () => api.getScoreboard(date),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
};

export const useStandings = (season?: string) => {
  return useQuery({
    queryKey: queryKeys.standings(season),
    queryFn: () => api.getStandings(season),
    staleTime: 1000 * 60 * 30,
  });
};

export const useLeagueSchedule = (days?: number) => {
  return useQuery({
    queryKey: queryKeys.leagueSchedule(days),
    queryFn: () => api.getLeagueSchedule(days),
    staleTime: 1000 * 60 * 60,
  });
};

// Validation
export const useValidatePredictions = (date?: string) => {
  return useQuery({
    queryKey: queryKeys.validatePredictions(date),
    queryFn: () => api.validatePredictions(date),
    staleTime: 1000 * 60 * 5,
    enabled: !!date,
  });
};

export const useValidateToday = () => {
  return useQuery({
    queryKey: queryKeys.validateToday,
    queryFn: api.validateToday,
    staleTime: 1000 * 60 * 5,
  });
};

export const useValidateRecent = (days: number = 7) => {
  return useQuery({
    queryKey: queryKeys.validateRecent(days),
    queryFn: () => api.validateRecent(days),
    staleTime: 1000 * 60 * 10,
  });
};

export const useAccuracyStats = () => {
  return useQuery({
    queryKey: queryKeys.accuracyStats,
    queryFn: api.getAccuracyStats,
    staleTime: 1000 * 60 * 10,
  });
};

// Prefetch hook
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  return {
    prefetchTeams: () =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.teams,
        queryFn: api.getTeams,
      }),
    prefetchTeam: (teamId: number) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.team(teamId),
        queryFn: () => api.getTeamById(teamId),
      }),
    prefetchTodaysPredictions: () =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.todaysPredictions,
        queryFn: api.getTodaysPredictions,
      }),
  };
};
