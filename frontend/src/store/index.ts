import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team } from '../types';

interface UserPreferences {
  showProbabilities: boolean;
  defaultConfidenceFilter: string[];
  preferredView: 'grid' | 'list';
  autoRefresh: boolean;
  refreshInterval: number;
}

interface AppState {
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;

  // Teams cache
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  getTeamById: (id: number) => Team | undefined;
  getTeamByAbbr: (abbr: string) => Team | undefined;

  // Favorites
  favoriteTeams: number[];
  addFavorite: (teamId: number) => void;
  removeFavorite: (teamId: number) => void;
  isFavorite: (teamId: number) => boolean;

  // User preferences
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Teams cache
      teams: [],
      setTeams: (teams) => set({ teams }),
      getTeamById: (id) => get().teams.find((t) => t.id === id),
      getTeamByAbbr: (abbr) =>
        get().teams.find((t) => t.abbreviation === abbr),

      // Favorites
      favoriteTeams: [],
      addFavorite: (teamId) =>
        set((state) => ({
          favoriteTeams: [...state.favoriteTeams, teamId],
        })),
      removeFavorite: (teamId) =>
        set((state) => ({
          favoriteTeams: state.favoriteTeams.filter((id) => id !== teamId),
        })),
      isFavorite: (teamId) => get().favoriteTeams.includes(teamId),

      // User preferences
      preferences: {
        showProbabilities: true,
        defaultConfidenceFilter: ['HIGH', 'MEDIUM', 'LOW'],
        preferredView: 'grid',
        autoRefresh: true,
        refreshInterval: 60000,
      },
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),

      // UI state
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'nba-predictor-storage',
      partialize: (state) => ({
        theme: state.theme,
        favoriteTeams: state.favoriteTeams,
        preferences: state.preferences,
      }),
    }
  )
);

// Selector hooks
export const useTheme = () => useAppStore((state) => state.theme);
export const useTeams = () => useAppStore((state) => state.teams);
export const useFavorites = () => useAppStore((state) => state.favoriteTeams);
export const usePreferences = () => useAppStore((state) => state.preferences);
