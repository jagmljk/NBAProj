import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Star, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TeamLogo } from '../ui/team-logo';
import type { Team } from '../../types';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeam: Team | null;
  onSelect: (team: Team) => void;
  label?: string;
  placeholder?: string;
  favoriteTeamIds?: number[];
  disabled?: boolean;
  excludeTeamId?: number;
}

export function TeamSelector({
  teams,
  selectedTeam,
  onSelect,
  label,
  placeholder = "Select a team...",
  favoriteTeamIds = [],
  disabled = false,
  excludeTeamId,
}: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter teams based on search and exclusion
  const filteredTeams = useMemo(() => {
    let filtered = teams.filter((team) => team.id !== excludeTeamId);

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.full_name.toLowerCase().includes(searchLower) ||
          team.nickname.toLowerCase().includes(searchLower) ||
          team.city.toLowerCase().includes(searchLower) ||
          team.abbreviation.toLowerCase().includes(searchLower)
      );
    }

    // Sort: favorites first, then alphabetically
    return filtered.sort((a, b) => {
      const aFav = favoriteTeamIds.includes(a.id);
      const bFav = favoriteTeamIds.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  }, [teams, search, favoriteTeamIds, excludeTeamId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (team: Team) => {
    onSelect(team);
    setIsOpen(false);
    setSearch('');
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null as unknown as Team);
  };

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-slate-300">{label}</label>
      )}

      <div className="relative">
        {/* Selector button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200",
            "bg-surface-card border-surface-border hover:bg-surface-elevated hover:border-surface-hover",
            isOpen && "border-primary-red ring-2 ring-primary-red/20",
            disabled && "opacity-50 cursor-not-allowed",
            selectedTeam && "border-primary-red/50"
          )}
        >
          {selectedTeam ? (
            <div className="flex items-center gap-3">
              <TeamLogo
                teamAbbr={selectedTeam.abbreviation}
                teamId={selectedTeam.id}
                teamName={selectedTeam.full_name}
                size="sm"
              />
              <div className="text-left">
                <div className="font-medium text-white">{selectedTeam.full_name}</div>
                <div className="text-xs text-content-secondary">{selectedTeam.city}</div>
              </div>
            </div>
          ) : (
            <span className="text-content-tertiary">{placeholder}</span>
          )}

          <div className="flex items-center gap-2">
            {selectedTeam && (
              <button
                type="button"
                onClick={clearSelection}
                className="p-1 hover:bg-surface-hover rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-content-secondary" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "w-5 h-5 text-content-secondary transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Search input */}
              <div className="p-3 border-b border-surface-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-tertiary" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search teams..."
                    className="w-full pl-10 pr-4 py-2 bg-surface-elevated border border-surface-border rounded-lg text-sm text-white placeholder-content-tertiary focus:outline-none focus:ring-2 focus:ring-primary-red/50 focus:border-primary-red"
                  />
                </div>
              </div>

              {/* Teams list */}
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {filteredTeams.length === 0 ? (
                  <div className="p-4 text-center text-content-tertiary text-sm">
                    No teams found
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleSelect(team)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-elevated transition-colors",
                        selectedTeam?.id === team.id && "bg-primary-red/10"
                      )}
                    >
                      <TeamLogo
                        teamAbbr={team.abbreviation}
                        teamId={team.id}
                        teamName={team.full_name}
                        size="sm"
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white">{team.full_name}</div>
                        <div className="text-xs text-content-secondary">{team.city}</div>
                      </div>
                      {favoriteTeamIds.includes(team.id) && (
                        <Star className="w-4 h-4 text-primary-gold fill-primary-gold" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
