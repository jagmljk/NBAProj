"""
NBA Historical Data Collection Script

Collects game data and team statistics from NBA API for ML training.
Seasons: 2015-16 through 2024-25 (10 seasons)
"""

import time
import pandas as pd
from datetime import datetime
from pathlib import Path
from nba_api.stats.endpoints import (
    leaguegamefinder,
    teamdashboardbygeneralsplits,
    leaguedashteamstats,
)
from nba_api.stats.static import teams

# Rate limiting
RATE_LIMIT = 0.6  # seconds between API calls

# Seasons to collect
SEASONS = [
    "2015-16", "2016-17", "2017-18", "2018-19", "2019-20",
    "2020-21", "2021-22", "2022-23", "2023-24", "2024-25"
]

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "data" / "raw"


def rate_limit():
    """Enforce rate limiting."""
    time.sleep(RATE_LIMIT)


def get_all_teams():
    """Get all NBA team IDs and info."""
    return {t["id"]: t for t in teams.get_teams()}


def collect_games_for_season(season: str) -> pd.DataFrame:
    """
    Collect all regular season games for a season.
    Returns DataFrame with game-level data.
    """
    print(f"  Collecting games for {season}...")
    rate_limit()

    try:
        finder = leaguegamefinder.LeagueGameFinder(
            season_nullable=season,
            season_type_nullable="Regular Season",
            league_id_nullable="00"
        )
        games_df = finder.get_data_frames()[0]

        if games_df.empty:
            print(f"    No games found for {season}")
            return pd.DataFrame()

        # Add season column
        games_df["SEASON"] = season

        print(f"    Found {len(games_df)} game records")
        return games_df

    except Exception as e:
        print(f"    Error collecting games: {e}")
        return pd.DataFrame()


def collect_team_stats_for_season(season: str) -> pd.DataFrame:
    """
    Collect team statistics for a season.
    Includes basic and advanced stats.
    """
    print(f"  Collecting team stats for {season}...")
    rate_limit()

    try:
        # Get basic stats
        stats = leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            season_type_all_star="Regular Season",
            per_mode_detailed="PerGame"
        )
        basic_df = stats.get_data_frames()[0]

        rate_limit()

        # Get advanced stats (for Net Rating, Four Factors)
        advanced = leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            season_type_all_star="Regular Season",
            measure_type_detailed_defense="Advanced"
        )
        advanced_df = advanced.get_data_frames()[0]

        # Merge basic and advanced
        if not basic_df.empty and not advanced_df.empty:
            # Select key columns from advanced
            advanced_cols = [
                "TEAM_ID", "OFF_RATING", "DEF_RATING", "NET_RATING",
                "EFG_PCT", "TM_TOV_PCT", "OREB_PCT", "DREB_PCT",
                "AST_RATIO", "PACE", "PIE"
            ]
            advanced_subset = advanced_df[[c for c in advanced_cols if c in advanced_df.columns]]

            # Merge on TEAM_ID
            merged = basic_df.merge(advanced_subset, on="TEAM_ID", how="left")
            merged["SEASON"] = season

            print(f"    Found stats for {len(merged)} teams")
            return merged

        return basic_df

    except Exception as e:
        print(f"    Error collecting team stats: {e}")
        return pd.DataFrame()


def collect_all_data():
    """
    Main function to collect all historical data.
    """
    print("=" * 60)
    print("NBA Historical Data Collection")
    print("=" * 60)
    print(f"Seasons: {SEASONS[0]} to {SEASONS[-1]}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    all_games = []
    all_team_stats = []

    for season in SEASONS:
        print(f"\nProcessing {season}...")

        # Collect games
        games = collect_games_for_season(season)
        if not games.empty:
            all_games.append(games)

        # Collect team stats
        stats = collect_team_stats_for_season(season)
        if not stats.empty:
            all_team_stats.append(stats)

    # Combine and save
    print("\n" + "=" * 60)
    print("Saving data...")

    if all_games:
        games_df = pd.concat(all_games, ignore_index=True)
        games_path = OUTPUT_DIR / "all_games.csv"
        games_df.to_csv(games_path, index=False)
        print(f"  Saved {len(games_df)} game records to {games_path}")

    if all_team_stats:
        stats_df = pd.concat(all_team_stats, ignore_index=True)
        stats_path = OUTPUT_DIR / "all_team_stats.csv"
        stats_df.to_csv(stats_path, index=False)
        print(f"  Saved {len(stats_df)} team-season records to {stats_path}")

    print("\nData collection complete!")
    print("=" * 60)

    return games_df if all_games else None, stats_df if all_team_stats else None


if __name__ == "__main__":
    collect_all_data()
