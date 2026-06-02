import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

export function formatOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getConfidenceTierColor(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'HIGH':
      return 'text-success';
    case 'MEDIUM':
      return 'text-warning';
    case 'LOW':
      return 'text-slate-400';
    default:
      return 'text-slate-400';
  }
}

export function getConfidenceTierBg(tier: string): string {
  switch (tier.toUpperCase()) {
    case 'HIGH':
      return 'bg-success/20 border-success/30';
    case 'MEDIUM':
      return 'bg-warning/20 border-warning/30';
    case 'LOW':
      return 'bg-slate-500/20 border-slate-500/30';
    default:
      return 'bg-slate-500/20 border-slate-500/30';
  }
}

export function getProbabilityColor(prob: number): string {
  if (prob >= 0.65) return '#10B981'; // success
  if (prob >= 0.55) return '#F59E0B'; // warning
  return '#94A3B8'; // muted
}

// NBA team ID mapping for logo URLs
const teamIdMap: Record<string, number> = {
  'ATL': 1610612737,
  'BOS': 1610612738,
  'BKN': 1610612751,
  'CHA': 1610612766,
  'CHI': 1610612741,
  'CLE': 1610612739,
  'DAL': 1610612742,
  'DEN': 1610612743,
  'DET': 1610612765,
  'GSW': 1610612744,
  'HOU': 1610612745,
  'IND': 1610612754,
  'LAC': 1610612746,
  'LAL': 1610612747,
  'MEM': 1610612763,
  'MIA': 1610612748,
  'MIL': 1610612749,
  'MIN': 1610612750,
  'NOP': 1610612740,
  'NYK': 1610612752,
  'OKC': 1610612760,
  'ORL': 1610612753,
  'PHI': 1610612755,
  'PHX': 1610612756,
  'POR': 1610612757,
  'SAC': 1610612758,
  'SAS': 1610612759,
  'TOR': 1610612761,
  'UTA': 1610612762,
  'WAS': 1610612764,
};

export function getTeamLogoUrl(teamAbbr: string, teamId?: number): string {
  // Use NBA CDN for official logos
  const id = teamId || teamIdMap[teamAbbr];
  if (id) {
    return `https://cdn.nba.com/logos/nba/${id}/global/L/logo.svg`;
  }
  // Fallback to ESPN CDN using abbreviation
  return `https://a.espncdn.com/i/teamlogos/nba/500/${teamAbbr.toLowerCase()}.png`;
}

export function getTeamColorClass(teamAbbr: string): string {
  const teamColors: Record<string, string> = {
    'ATL': 'bg-red-600',
    'BOS': 'bg-green-600',
    'BKN': 'bg-slate-800',
    'CHA': 'bg-teal-500',
    'CHI': 'bg-red-700',
    'CLE': 'bg-red-800',
    'DAL': 'bg-blue-600',
    'DEN': 'bg-yellow-600',
    'DET': 'bg-red-600',
    'GSW': 'bg-yellow-500',
    'HOU': 'bg-red-600',
    'IND': 'bg-yellow-600',
    'LAC': 'bg-red-500',
    'LAL': 'bg-purple-600',
    'MEM': 'bg-blue-700',
    'MIA': 'bg-red-700',
    'MIL': 'bg-green-700',
    'MIN': 'bg-blue-800',
    'NOP': 'bg-blue-700',
    'NYK': 'bg-orange-500',
    'OKC': 'bg-blue-500',
    'ORL': 'bg-blue-600',
    'PHI': 'bg-blue-600',
    'PHX': 'bg-orange-600',
    'POR': 'bg-red-600',
    'SAC': 'bg-purple-700',
    'SAS': 'bg-slate-600',
    'TOR': 'bg-red-600',
    'UTA': 'bg-yellow-600',
    'WAS': 'bg-blue-700',
  };
  return teamColors[teamAbbr] || 'bg-slate-600';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
