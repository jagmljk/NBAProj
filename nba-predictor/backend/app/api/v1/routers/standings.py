"""
Live Data Router - NBA standings and scoreboard endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional

from app.services.nba_data import get_standings, get_static_standings, get_scoreboard

router = APIRouter()


@router.get("/standings")
async def get_nba_standings(
    season: str = Query(default="2025-26", description="NBA season (e.g., 2025-26)")
):
    """
    Get current NBA standings by conference.

    Returns eastern and western conference standings with:
    - Team info (id, name, abbreviation)
    - Record (wins, losses, win_pct)
    - Rankings (conference_rank, division_rank)
    - Additional stats (home/road records, last 10, streak)
    """
    try:
        # Try to get live standings from NBA API
        standings = get_standings(season)

        if standings:
            return standings

        # Fall back to static data if API fails
        print("Falling back to static standings data")
        return get_static_standings(season)

    except Exception as e:
        print(f"Error in standings endpoint: {e}")
        # Return static data on any error
        return get_static_standings(season)


@router.get("/scoreboard")
async def get_nba_scoreboard(
    date: Optional[str] = Query(default=None, description="Date in YYYY-MM-DD format (defaults to today)")
):
    """
    Get NBA scoreboard for a specific date.

    Returns:
    - List of games with teams, scores, and status
    - Game counts (scheduled, in progress, completed)
    """
    try:
        scoreboard = get_scoreboard(date)
        return scoreboard

    except Exception as e:
        print(f"Error in scoreboard endpoint: {e}")
        # Return empty scoreboard on error
        from datetime import datetime
        return {
            "date": date or datetime.now().strftime("%Y-%m-%d"),
            "games": [],
            "games_in_progress": 0,
            "games_completed": 0,
            "games_scheduled": 0,
            "last_updated": datetime.now().isoformat(),
        }
