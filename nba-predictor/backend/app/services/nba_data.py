"""
NBA Data Service - Fetches data from NBA API.
Clean, simple implementation with fallback to static data.
"""

import time
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from nba_api.stats.static import teams as static_teams
from nba_api.stats.endpoints import (
    leaguestandingsv3,
    teamgamelog,
    leaguedashteamstats,
    teamdashboardbygeneralsplits,
    scoreboardv2,
)
from nba_api.stats.library.http import NBAStatsHTTP
import pandas as pd

# Configure NBA API to use browser-like headers (fixes cloud deployment blocks)
CUSTOM_HEADERS = {
    'Host': 'stats.nba.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'x-nba-stats-origin': 'stats',
    'x-nba-stats-token': 'true',
    'Connection': 'keep-alive',
    'Referer': 'https://stats.nba.com/',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
}


# Team ID to abbreviation mapping cache
_team_abbr_map: Dict[int, str] = {}
_team_name_map: Dict[int, str] = {}


# Rate limiting - reduced for faster loading
RATE_LIMIT_DELAY = 0.5
_last_request_time = 0


# In-memory cache for team data (5 minute TTL)
CACHE_TTL = 300  # 5 minutes in seconds
_cache: Dict[str, Dict] = {}  # key -> {"data": ..., "timestamp": ...}


def _rate_limit():
    """Enforce rate limiting between API calls."""
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < RATE_LIMIT_DELAY:
        time.sleep(RATE_LIMIT_DELAY - elapsed)
    _last_request_time = time.time()


def _get_from_cache(key: str) -> Optional[Dict]:
    """Get data from cache if not expired."""
    if key in _cache:
        entry = _cache[key]
        if time.time() - entry["timestamp"] < CACHE_TTL:
            return entry["data"]
        del _cache[key]


def clear_cache(pattern: str = None) -> int:
    """
    Clear the data cache.
    If pattern is provided, only clear matching keys.
    Returns the number of entries cleared.
    """
    global _cache
    if pattern is None:
        count = len(_cache)
        _cache = {}
        return count
    else:
        keys_to_delete = [k for k in _cache.keys() if pattern in k]
        for key in keys_to_delete:
            del _cache[key]
        return len(keys_to_delete)


def _set_cache(key: str, data: Dict):
    """Store data in cache."""
    _cache[key] = {"data": data, "timestamp": time.time()}


def get_all_teams() -> List[Dict]:
    """Get all 30 NBA teams."""
    teams = static_teams.get_teams()
    return [
        {
            "id": t["id"],
            "full_name": t["full_name"],
            "abbreviation": t["abbreviation"],
            "nickname": t["nickname"],
            "city": t["city"],
            "state": t["state"],
            "year_founded": t["year_founded"],
        }
        for t in teams
    ]


def get_standings(season: str = "2025-26") -> Optional[Dict]:
    """
    Fetch current standings from NBA API.

    Args:
        season: Season string (e.g., "2025-26")

    Returns:
        Dict with eastern and western conference standings
    """
    # Check cache first (5 minute TTL)
    cache_key = f"standings_{season}"
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    _rate_limit()

    try:
        print(f"Fetching standings for season {season}...")

        standings = leaguestandingsv3.LeagueStandingsV3(
            season=season,
            season_type="Regular Season",
            headers=CUSTOM_HEADERS,
            timeout=60
        )

        df = standings.get_data_frames()[0]

        if df.empty:
            print("No standings data returned")
            return None

        # Process standings
        eastern_teams = []
        western_teams = []

        for _, row in df.iterrows():
            team_data = {
                "team_id": int(row.get("TeamID", 0)),
                "team_name": row.get("TeamName", ""),
                "team_abbreviation": row.get("TeamSlug", "").upper() if row.get("TeamSlug") else "",
                "conference": row.get("Conference", ""),
                "division": row.get("Division", ""),
                "conference_rank": int(row.get("PlayoffRank", 0)),
                "division_rank": int(row.get("DivisionRank", 0)),
                "wins": int(row.get("WINS", 0)),
                "losses": int(row.get("LOSSES", 0)),
                "win_pct": float(row.get("WinPCT", 0)),
                "games_back": float(row.get("ConferenceGamesBack", 0)),
                "home_record": row.get("HOME", "0-0"),
                "road_record": row.get("ROAD", "0-0"),
                "last_10": row.get("L10", "0-0"),
                "streak": str(row.get("CurrentStreak", "0")),
                "clinched": row.get("ClinchedPostSeason") if row.get("ClinchedPostSeason") else None,
            }

            if row.get("Conference") == "East":
                eastern_teams.append(team_data)
            else:
                western_teams.append(team_data)

        # Sort by conference rank
        eastern_teams.sort(key=lambda x: x["conference_rank"])
        western_teams.sort(key=lambda x: x["conference_rank"])

        print(f"Found {len(eastern_teams)} Eastern, {len(western_teams)} Western teams")

        result = {
            "season": season,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "eastern": {
                "conference": "Eastern",
                "teams": eastern_teams,
                "playoff_cutoff": 6,
                "playin_cutoff": 10,
            },
            "western": {
                "conference": "Western",
                "teams": western_teams,
                "playoff_cutoff": 6,
                "playin_cutoff": 10,
            },
            "last_updated": datetime.now().isoformat(),
        }
        _set_cache(cache_key, result)
        return result

    except Exception as e:
        print(f"Error fetching standings: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_static_standings(season: str = "2025-26") -> Dict:
    """
    Return static/mock standings when NBA API is unavailable.
    Uses real team data but placeholder stats.
    """
    teams = get_all_teams()

    # Split into conferences (rough approximation)
    eastern_abbrs = ["BOS", "NYK", "MIL", "CLE", "ORL", "IND", "PHI", "MIA",
                     "CHI", "ATL", "BKN", "TOR", "CHA", "WAS", "DET"]

    eastern_teams = []
    western_teams = []

    for i, team in enumerate(teams):
        is_eastern = team["abbreviation"] in eastern_abbrs
        conf_teams = eastern_teams if is_eastern else western_teams
        rank = len(conf_teams) + 1

        # Create placeholder standings entry
        team_standing = {
            "team_id": team["id"],
            "team_name": team["nickname"],
            "team_abbreviation": team["abbreviation"],
            "conference": "East" if is_eastern else "West",
            "division": "Atlantic",  # Placeholder
            "conference_rank": rank,
            "division_rank": ((rank - 1) % 5) + 1,
            "wins": max(0, 45 - rank * 2),
            "losses": min(82, 20 + rank * 2),
            "win_pct": max(0.2, 0.7 - rank * 0.03),
            "games_back": (rank - 1) * 2.0,
            "home_record": f"{25 - rank}-{10 + rank}",
            "road_record": f"{20 - rank}-{15 + rank}",
            "last_10": f"{max(2, 8 - rank // 2)}-{min(8, 2 + rank // 2)}",
            "streak": f"W{max(1, 5 - rank // 3)}" if rank <= 8 else f"L{rank // 3}",
            "clinched": "x" if rank <= 6 else None,
        }
        conf_teams.append(team_standing)

    return {
        "season": season,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "eastern": {
            "conference": "Eastern",
            "teams": eastern_teams[:15],
            "playoff_cutoff": 6,
            "playin_cutoff": 10,
        },
        "western": {
            "conference": "Western",
            "teams": western_teams[:15],
            "playoff_cutoff": 6,
            "playin_cutoff": 10,
        },
        "last_updated": datetime.now().isoformat(),
    }


def get_team_by_id(team_id: int) -> Optional[Dict]:
    """Get basic team info by ID."""
    teams = static_teams.get_teams()
    for t in teams:
        if t["id"] == team_id:
            return {
                "id": t["id"],
                "full_name": t["full_name"],
                "abbreviation": t["abbreviation"],
                "nickname": t["nickname"],
                "city": t["city"],
                "state": t.get("state", ""),
                "year_founded": t.get("year_founded", 0),
            }
    return None


def get_team_stats(team_id: int, season: str = "2025-26") -> Optional[Dict]:
    """
    Fetch team statistics from NBA API.
    """
    # Check cache first
    cache_key = f"team_stats_{team_id}_{season}"
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    _rate_limit()

    try:
        print(f"Fetching team stats for team {team_id}, season {season}...")

        stats = leaguedashteamstats.LeagueDashTeamStats(
            season=season,
            season_type_all_star="Regular Season",
            per_mode_detailed="PerGame",
            headers=CUSTOM_HEADERS,
            timeout=60
        )

        df = stats.get_data_frames()[0]

        if df.empty:
            return None

        team_row = df[df["TEAM_ID"] == team_id]
        if team_row.empty:
            return None

        row = team_row.iloc[0]

        result = {
            "team_id": team_id,
            "season": season,
            "games_played": int(row.get("GP", 0)),
            "wins": int(row.get("W", 0)),
            "losses": int(row.get("L", 0)),
            "win_pct": float(row.get("W_PCT", 0)),
            "pts_per_game": float(row.get("PTS", 0)),
            "fg_pct": float(row.get("FG_PCT", 0)),
            "fg3_pct": float(row.get("FG3_PCT", 0)),
            "ft_pct": float(row.get("FT_PCT", 0)),
            "reb_per_game": float(row.get("REB", 0)),
            "ast_per_game": float(row.get("AST", 0)),
            "plus_minus": float(row.get("PLUS_MINUS", 0)),
        }
        _set_cache(cache_key, result)
        return result

    except Exception as e:
        print(f"Error fetching team stats: {e}")
        return None


def get_team_game_log(team_id: int, season: str = "2025-26") -> List[Dict]:
    """
    Fetch team's game log for the season.
    """
    # Check cache first
    cache_key = f"game_log_{team_id}_{season}"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    _rate_limit()

    try:
        print(f"Fetching game log for team {team_id}, season {season}...")

        log = teamgamelog.TeamGameLog(
            team_id=team_id,
            season=season,
            season_type_all_star="Regular Season",
            headers=CUSTOM_HEADERS,
            timeout=60
        )

        df = log.get_data_frames()[0]

        if df.empty:
            return []

        games = []
        for _, row in df.iterrows():
            matchup = row.get("MATCHUP", "")
            is_home = "vs." in matchup
            opponent_abbr = matchup.split(" ")[-1] if matchup else ""

            # Find opponent info
            opponent_team = None
            for t in static_teams.get_teams():
                if t["abbreviation"] == opponent_abbr:
                    opponent_team = t
                    break

            wl = row.get("WL", "")
            pts = int(row.get("PTS", 0))
            plus_minus = int(row.get("PLUS_MINUS", 0))
            opp_pts = pts - plus_minus

            games.append({
                "game_id": str(row.get("Game_ID", "")),
                "game_date": row.get("GAME_DATE", ""),
                "opponent_id": opponent_team["id"] if opponent_team else 0,
                "opponent_name": opponent_team["full_name"] if opponent_team else opponent_abbr,
                "is_home": is_home,
                "result": f"{wl} {pts}-{opp_pts}" if wl else None,
                "pts": pts,
                "opp_pts": opp_pts,
                "plus_minus": plus_minus,
            })

        _set_cache(cache_key, games)
        return games

    except Exception as e:
        print(f"Error fetching game log: {e}")
        return []


def get_team_detail(team_id: int, season: str = "2025-26") -> Optional[Dict]:
    """
    Get comprehensive team detail including stats and recent form.
    """
    # Check cache first
    cache_key = f"team_detail_{team_id}_{season}"
    cached = _get_from_cache(cache_key)
    if cached:
        return cached

    # Get basic team info
    info = get_team_by_id(team_id)
    if not info:
        return None

    # Get team stats
    stats = get_team_stats(team_id, season)

    # Get game log for recent form
    game_log = get_team_game_log(team_id, season)

    # Calculate recent form from last 10 games
    recent_games = game_log[:10] if game_log else []
    wins_last_10 = sum(1 for g in recent_games if (g.get("result") or "").startswith("W"))
    losses_last_10 = len(recent_games) - wins_last_10

    # Calculate streak
    streak = 0
    streak_type = ""
    for g in game_log:
        result = g.get("result") or ""
        if not result:
            break
        if streak == 0:
            streak_type = "W" if result.startswith("W") else "L"
        if result.startswith(streak_type):
            streak += 1
        else:
            break

    # Calculate home/away records
    home_games = [g for g in game_log if g.get("is_home")]
    away_games = [g for g in game_log if not g.get("is_home")]
    home_wins = sum(1 for g in home_games if (g.get("result") or "").startswith("W"))
    away_wins = sum(1 for g in away_games if (g.get("result") or "").startswith("W"))

    # Calculate averages for last 10
    pts_last_10 = sum(g.get("pts", 0) for g in recent_games) / max(len(recent_games), 1)
    opp_pts_last_10 = sum(g.get("opp_pts", 0) for g in recent_games) / max(len(recent_games), 1)

    # Fallback stats if API failed
    if not stats:
        total_games = len(game_log)
        total_wins = sum(1 for g in game_log if (g.get("result") or "").startswith("W"))
        stats = {
            "team_id": team_id,
            "season": season,
            "games_played": total_games,
            "wins": total_wins,
            "losses": total_games - total_wins,
            "win_pct": total_wins / max(total_games, 1),
            "pts_per_game": sum(g.get("pts", 0) for g in game_log) / max(total_games, 1),
            "fg_pct": 0.45,
            "fg3_pct": 0.36,
            "ft_pct": 0.78,
            "reb_per_game": 44.0,
            "ast_per_game": 25.0,
            "plus_minus": sum(g.get("plus_minus", 0) for g in game_log) / max(total_games, 1),
        }

    recent_form = {
        "last_10_record": f"{wins_last_10}-{losses_last_10}",
        "streak": f"{streak_type}{streak}" if streak > 0 else "0",
        "avg_pts_last_10": round(pts_last_10, 1),
        "avg_opp_pts_last_10": round(opp_pts_last_10, 1),
        "home_record": f"{home_wins}-{len(home_games) - home_wins}",
        "away_record": f"{away_wins}-{len(away_games) - away_wins}",
    }

    # Get rankings (would require league-wide stats comparison)
    ranking = {
        "pts_rank": 15,
        "fg_pct_rank": 15,
        "fg3_pct_rank": 15,
        "ft_pct_rank": 15,
        "reb_rank": 15,
        "ast_rank": 15,
        "conference_rank": 8,
    }

    result = {
        "info": info,
        "stats": stats,
        "recent_form": recent_form,
        "ranking": ranking,
        "advanced": None,  # Can be expanded later with advanced stats
    }
    _set_cache(cache_key, result)
    return result


def get_team_schedule(team_id: int, season: str = "2025-26") -> Optional[Dict]:
    """
    Get team's schedule with recent and upcoming games.
    """
    info = get_team_by_id(team_id)
    if not info:
        return None

    game_log = get_team_game_log(team_id, season)

    # Recent games (last 10)
    recent_games = []
    for g in game_log[:10]:
        recent_games.append({
            "game_id": g["game_id"],
            "game_date": g["game_date"],
            "opponent_id": g["opponent_id"],
            "opponent_name": g["opponent_name"],
            "is_home": g["is_home"],
            "result": g["result"],
        })

    # For upcoming games, we'd need the schedule API
    # For now, return empty upcoming games
    upcoming_games = []

    # Calculate rest days (simplified)
    rest_days = 1

    return {
        "team_id": team_id,
        "team_name": info["full_name"],
        "upcoming_games": upcoming_games,
        "recent_games": recent_games,
        "rest_days_until_next": rest_days,
    }


def get_head_to_head(team_id: int, opponent_id: int, season: str = "2025-26") -> Optional[Dict]:
    """
    Get head-to-head comparison between two teams.
    """
    team_info = get_team_by_id(team_id)
    opponent_info = get_team_by_id(opponent_id)

    if not team_info or not opponent_info:
        return None

    # Get game logs for both teams
    team_log = get_team_game_log(team_id, season)
    opponent_log = get_team_game_log(opponent_id, season)

    # Find h2h games
    h2h_games = [g for g in team_log if g["opponent_id"] == opponent_id]

    team_wins = sum(1 for g in h2h_games if (g.get("result") or "").startswith("W"))
    opponent_wins = len(h2h_games) - team_wins

    team_pts = sum(g.get("pts", 0) for g in h2h_games)
    opp_pts = sum(g.get("opp_pts", 0) for g in h2h_games)

    # Get team stats for comparison
    team_stats = get_team_stats(team_id, season)
    opp_stats = get_team_stats(opponent_id, season)

    # Build stat comparison
    stat_comparison = {}
    if team_stats and opp_stats:
        stat_comparison = {
            "PPG": {team_id: team_stats["pts_per_game"], opponent_id: opp_stats["pts_per_game"]},
            "FG%": {team_id: team_stats["fg_pct"] * 100, opponent_id: opp_stats["fg_pct"] * 100},
            "3P%": {team_id: team_stats["fg3_pct"] * 100, opponent_id: opp_stats["fg3_pct"] * 100},
            "RPG": {team_id: team_stats["reb_per_game"], opponent_id: opp_stats["reb_per_game"]},
            "APG": {team_id: team_stats["ast_per_game"], opponent_id: opp_stats["ast_per_game"]},
            "+/-": {team_id: team_stats["plus_minus"], opponent_id: opp_stats["plus_minus"]},
        }

    # Format recent h2h games
    recent_h2h_games = []
    for g in h2h_games[:5]:
        recent_h2h_games.append({
            "game_id": g["game_id"],
            "game_date": g["game_date"],
            "home_team_id": team_id if g["is_home"] else opponent_id,
            "home_team_name": team_info["full_name"] if g["is_home"] else opponent_info["full_name"],
            "home_team_abbreviation": team_info["abbreviation"] if g["is_home"] else opponent_info["abbreviation"],
            "away_team_id": opponent_id if g["is_home"] else team_id,
            "away_team_name": opponent_info["full_name"] if g["is_home"] else team_info["full_name"],
            "away_team_abbreviation": opponent_info["abbreviation"] if g["is_home"] else team_info["abbreviation"],
            "game_status": "final",
            "game_status_text": "Final",
            "home_score": g["pts"] if g["is_home"] else g["opp_pts"],
            "away_score": g["opp_pts"] if g["is_home"] else g["pts"],
        })

    return {
        "stats": {
            "home_team_id": team_id,
            "away_team_id": opponent_id,
            "total_games": len(h2h_games),
            "home_wins": team_wins,
            "away_wins": opponent_wins,
            "home_avg_pts": team_pts / max(len(h2h_games), 1),
            "away_avg_pts": opp_pts / max(len(h2h_games), 1),
        },
        "recent_games": recent_h2h_games,
        "stat_comparison": stat_comparison,
    }


def _build_team_maps():
    """Build team ID to abbreviation/name maps."""
    global _team_abbr_map, _team_name_map
    if not _team_abbr_map:
        teams = static_teams.get_teams()
        for t in teams:
            _team_abbr_map[t["id"]] = t["abbreviation"]
            _team_name_map[t["id"]] = t["full_name"]


def _fetch_team_game_log(team_id: int, season: str, season_type: str = "Playoffs") -> Optional[pd.DataFrame]:
    """Helper to fetch and cache team game log."""
    cache_key = f"gamelog_{team_id}_{season}_{season_type}"
    cached = _get_from_cache(cache_key)

    if cached is not None:
        return pd.DataFrame(cached)

    _rate_limit()
    try:
        log = teamgamelog.TeamGameLog(
            team_id=team_id,
            season=season,
            season_type_all_star=season_type,
            headers=CUSTOM_HEADERS,
            timeout=60
        )
        df = log.get_data_frames()[0]
        if not df.empty:
            _set_cache(cache_key, df.to_dict('records'))
            return df
    except Exception:
        pass
    return None


def _get_game_result_from_logs(game_id: str, home_team_id: int, away_team_id: int, game_date: str) -> Optional[Dict]:
    """
    Fetch game result from team game logs as fallback when scoreboard doesn't have scores.
    Fetches both teams' logs to get accurate scores (handles playoff games without PLUS_MINUS).

    Returns:
        Dict with home_score, away_score, status if found, else None
    """
    try:
        # Determine season from game date
        date_obj = datetime.strptime(game_date, "%Y-%m-%d")
        year = date_obj.year
        month = date_obj.month
        # NBA season starts in October, so Oct-Dec is start of next calendar year's season
        if month >= 10:
            season = f"{year}-{str(year + 1)[-2:]}"
        else:
            season = f"{year - 1}-{str(year)[-2:]}"

        home_score = None
        away_score = None

        # Try playoffs first (for postseason games), then regular season
        for season_type in ["Playoffs", "Regular Season"]:
            # Get home team's game log
            home_df = _fetch_team_game_log(home_team_id, season, season_type)
            if home_df is not None and not home_df.empty:
                home_game = home_df[home_df["Game_ID"].astype(str) == game_id]
                if not home_game.empty:
                    home_score = int(home_game.iloc[0].get("PTS", 0))

            # Get away team's game log
            away_df = _fetch_team_game_log(away_team_id, season, season_type)
            if away_df is not None and not away_df.empty:
                away_game = away_df[away_df["Game_ID"].astype(str) == game_id]
                if not away_game.empty:
                    away_score = int(away_game.iloc[0].get("PTS", 0))

            # If we found both scores, we're done
            if home_score is not None and away_score is not None:
                break

        if home_score is None or away_score is None:
            return None

        return {
            "home_score": home_score,
            "away_score": away_score,
            "status": "final",
            "winner": "home" if home_score > away_score else "away",
        }

    except Exception as e:
        print(f"Error fetching game result from logs for {game_id}: {e}")
        return None


def get_scoreboard(date: str = None) -> Dict:
    """
    Get scoreboard for a specific date.

    Args:
        date: Date string in YYYY-MM-DD format. Defaults to today.

    Returns:
        Dict with games, counts, and metadata
    """
    _build_team_maps()

    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    # Check cache (60 second TTL for scoreboard)
    cache_key = f"scoreboard_{date}"
    if cache_key in _cache:
        entry = _cache[cache_key]
        if time.time() - entry["timestamp"] < 60:
            return entry["data"]

    _rate_limit()

    try:
        print(f"Fetching scoreboard for {date}...")

        # Convert date format for NBA API (expects MM/DD/YYYY)
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        nba_date = date_obj.strftime("%m/%d/%Y")

        scoreboard = scoreboardv2.ScoreboardV2(
            game_date=nba_date,
            headers=CUSTOM_HEADERS,
            timeout=60
        )

        # Get game header data
        game_header = scoreboard.game_header.get_data_frame()
        line_score = scoreboard.line_score.get_data_frame()

        games = []
        games_in_progress = 0
        games_completed = 0
        games_scheduled = 0

        # Check if this is today's date
        today = datetime.now().strftime("%Y-%m-%d")
        is_today = (date == today)

        if not game_header.empty:
            for _, row in game_header.iterrows():
                game_id = str(row.get("GAME_ID", ""))
                game_status = int(row.get("GAME_STATUS_ID", 1))

                # Determine game status
                if game_status == 1:
                    status = "scheduled"
                    games_scheduled += 1
                elif game_status == 2:
                    status = "in_progress"
                    games_in_progress += 1
                else:
                    status = "final"
                    games_completed += 1

                home_team_id = int(row.get("HOME_TEAM_ID", 0))
                away_team_id = int(row.get("VISITOR_TEAM_ID", 0))

                # Get scores from line_score
                home_score = None
                away_score = None
                if not line_score.empty:
                    home_line = line_score[line_score["TEAM_ID"] == home_team_id]
                    away_line = line_score[line_score["TEAM_ID"] == away_team_id]
                    if not home_line.empty:
                        pts = home_line.iloc[0].get("PTS")
                        home_score = int(pts) if pd.notna(pts) and pts > 0 else None
                    if not away_line.empty:
                        pts = away_line.iloc[0].get("PTS")
                        away_score = int(pts) if pd.notna(pts) and pts > 0 else None

                # Fallback: If this is a past game marked as "scheduled" with no scores,
                # try to get the result from team game logs
                if not is_today and status == "scheduled" and (home_score is None or away_score is None):
                    game_result = _get_game_result_from_logs(game_id, home_team_id, away_team_id, date)
                    if game_result:
                        home_score = game_result["home_score"]
                        away_score = game_result["away_score"]
                        status = "final"
                        # Update counts
                        games_scheduled -= 1
                        games_completed += 1

                # Parse game time
                game_time = row.get("GAME_STATUS_TEXT", "")
                if status == "scheduled" and "ET" not in game_time:
                    game_time = f"{game_time} ET" if game_time else "TBD"

                # Determine if we have valid final scores
                has_valid_scores = home_score is not None and away_score is not None and (home_score > 0 or away_score > 0)

                # For today's games, don't show scores (just predictions)
                # For past games, show final scores if available
                # Also show scores if game has valid scores regardless of status (handles edge cases)
                show_scores = not is_today and (status == "final" or has_valid_scores)

                games.append({
                    "game_id": game_id,
                    "game_date": date,
                    "home_team_id": home_team_id,
                    "home_team_name": _team_name_map.get(home_team_id, "Unknown"),
                    "home_team_abbreviation": _team_abbr_map.get(home_team_id, "UNK"),
                    "away_team_id": away_team_id,
                    "away_team_name": _team_name_map.get(away_team_id, "Unknown"),
                    "away_team_abbreviation": _team_abbr_map.get(away_team_id, "UNK"),
                    "game_status": "scheduled" if is_today else status,
                    "game_status_text": game_time if is_today else row.get("GAME_STATUS_TEXT", ""),
                    "home_score": home_score if show_scores else None,
                    "away_score": away_score if show_scores else None,
                    "game_time_et": game_time if is_today or status == "scheduled" else None,
                    "arena": row.get("ARENA_NAME", None),
                })

        # Remove duplicate games (same game_id can appear multiple times for different broadcasts)
        seen_game_ids = set()
        unique_games = []
        for game in games:
            if game["game_id"] not in seen_game_ids:
                seen_game_ids.add(game["game_id"])
                unique_games.append(game)

        print(f"Found {len(unique_games)} unique games for {date}")

        result = {
            "date": date,
            "games": unique_games,
            "games_in_progress": 0 if is_today else games_in_progress,
            "games_completed": 0 if is_today else games_completed,
            "games_scheduled": len(unique_games) if is_today else games_scheduled,
            "last_updated": datetime.now().isoformat(),
        }
        _cache[cache_key] = {"data": result, "timestamp": time.time()}
        return result

    except Exception as e:
        print(f"Error fetching scoreboard: {e}")
        import traceback
        traceback.print_exc()

        # Return empty scoreboard on error
        return {
            "date": date,
            "games": [],
            "games_in_progress": 0,
            "games_completed": 0,
            "games_scheduled": 0,
            "last_updated": datetime.now().isoformat(),
        }
