"""
Teams Router - NBA teams endpoints.
"""

from fastapi import APIRouter, Query, HTTPException, Path
from typing import Optional

from app.services.nba_data import (
    get_all_teams,
    get_team_by_id,
    get_team_detail,
    get_team_schedule,
    get_head_to_head,
)

router = APIRouter()


@router.get("")
async def list_teams():
    """
    Get all 30 NBA teams.

    Returns list of teams with basic info (id, name, abbreviation, etc.)
    """
    teams = get_all_teams()
    return {
        "teams": teams,
        "total": len(teams),
    }


@router.get("/{team_id}")
async def get_team(
    team_id: int = Path(..., description="NBA Team ID"),
    season: str = Query(default="2025-26", description="NBA season (e.g., 2025-26)")
):
    """
    Get detailed team information including stats and recent form.

    Returns:
    - Team info (name, city, etc.)
    - Season statistics (points, shooting percentages, etc.)
    - Recent form (last 10 record, streak, home/away records)
    - League rankings
    - Advanced stats (optional)
    """
    team_detail = get_team_detail(team_id, season)

    if not team_detail:
        raise HTTPException(status_code=404, detail=f"Team {team_id} not found")

    return team_detail


@router.get("/{team_id}/schedule")
async def get_team_schedule_endpoint(
    team_id: int = Path(..., description="NBA Team ID"),
    season: str = Query(default="2025-26", description="NBA season (e.g., 2025-26)")
):
    """
    Get team's schedule with recent and upcoming games.

    Returns:
    - Recent games (last 10) with results
    - Upcoming games
    - Rest days until next game
    """
    schedule = get_team_schedule(team_id, season)

    if not schedule:
        raise HTTPException(status_code=404, detail=f"Team {team_id} not found")

    return schedule


@router.get("/{team_id}/vs/{opponent_id}")
async def get_head_to_head_endpoint(
    team_id: int = Path(..., description="NBA Team ID"),
    opponent_id: int = Path(..., description="Opponent Team ID"),
    season: str = Query(default="2025-26", description="NBA season (e.g., 2025-26)")
):
    """
    Get head-to-head comparison between two teams.

    Returns:
    - H2H record and stats
    - Recent matchups
    - Stat comparison (PPG, FG%, etc.)
    """
    if team_id == opponent_id:
        raise HTTPException(status_code=400, detail="Team cannot play against itself")

    h2h = get_head_to_head(team_id, opponent_id, season)

    if not h2h:
        raise HTTPException(status_code=404, detail="One or both teams not found")

    return h2h
