import { describe, it, expect } from 'vitest';
import {
  formatPercentage,
  formatOrdinal,
  getConfidenceTierColor,
  getProbabilityColor,
  getTeamLogoUrl,
  cn,
} from './utils';

describe('formatPercentage', () => {
  it('formats decimal to percentage with default precision', () => {
    expect(formatPercentage(0.65)).toBe('65.0%');
    expect(formatPercentage(0.123)).toBe('12.3%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercentage(0.6789, 2)).toBe('67.89%');
    expect(formatPercentage(0.5, 0)).toBe('50%');
  });

  it('handles edge cases', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(1)).toBe('100.0%');
  });
});

describe('formatOrdinal', () => {
  it('formats numbers with correct ordinal suffixes', () => {
    expect(formatOrdinal(1)).toBe('1st');
    expect(formatOrdinal(2)).toBe('2nd');
    expect(formatOrdinal(3)).toBe('3rd');
    expect(formatOrdinal(4)).toBe('4th');
  });

  it('handles teen numbers correctly', () => {
    // 11th, 12th, 13th are exceptions
    expect(formatOrdinal(11)).toBe('11th');
    expect(formatOrdinal(12)).toBe('12th');
    expect(formatOrdinal(13)).toBe('13th');
  });

  it('handles larger numbers', () => {
    expect(formatOrdinal(21)).toBe('21st');
    expect(formatOrdinal(22)).toBe('22nd');
    expect(formatOrdinal(23)).toBe('23rd');
    expect(formatOrdinal(100)).toBe('100th');
  });
});

describe('getConfidenceTierColor', () => {
  it('returns correct color class for each tier', () => {
    expect(getConfidenceTierColor('HIGH')).toBe('text-success');
    expect(getConfidenceTierColor('MEDIUM')).toBe('text-warning');
    expect(getConfidenceTierColor('LOW')).toBe('text-slate-400');
  });

  it('is case-insensitive', () => {
    expect(getConfidenceTierColor('high')).toBe('text-success');
    expect(getConfidenceTierColor('Medium')).toBe('text-warning');
  });

  it('returns default for unknown tiers', () => {
    expect(getConfidenceTierColor('UNKNOWN')).toBe('text-slate-400');
  });
});

describe('getProbabilityColor', () => {
  it('returns success color for high probability (>=65%)', () => {
    expect(getProbabilityColor(0.65)).toBe('#10B981');
    expect(getProbabilityColor(0.85)).toBe('#10B981');
  });

  it('returns warning color for medium probability (55-65%)', () => {
    expect(getProbabilityColor(0.55)).toBe('#F59E0B');
    expect(getProbabilityColor(0.64)).toBe('#F59E0B');
  });

  it('returns muted color for low probability (<55%)', () => {
    expect(getProbabilityColor(0.54)).toBe('#94A3B8');
    expect(getProbabilityColor(0.5)).toBe('#94A3B8');
  });
});

describe('getTeamLogoUrl', () => {
  it('returns NBA CDN URL when team ID is provided', () => {
    const url = getTeamLogoUrl('LAL', 1610612747);
    expect(url).toBe('https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg');
  });

  it('looks up team ID from abbreviation if not provided', () => {
    const url = getTeamLogoUrl('BOS');
    expect(url).toContain('1610612738');
  });

  it('falls back to ESPN CDN for unknown teams', () => {
    const url = getTeamLogoUrl('XXX');
    expect(url).toBe('https://a.espncdn.com/i/teamlogos/nba/500/xxx.png');
  });
});

describe('cn (classname utility)', () => {
  it('merges Tailwind classes correctly', () => {
    // Later classes override earlier ones for conflicting utilities
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class');
  });

  it('filters out falsy values', () => {
    expect(cn('base', false, null, undefined, 'other')).toBe('base other');
  });
});
