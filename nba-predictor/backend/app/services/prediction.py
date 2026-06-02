"""
Prediction Service - Simple NBA game predictions based on team stats.
Uses a straightforward statistical model without ML dependencies.
"""

from typing import Dict, List, Optional
from app.services.nba_data import get_team_stats, get_team_detail, get_scoreboard


# Weights for prediction factors
WEIGHTS = {
    "win_pct": 0.30,
    "pts_diff": 0.20,
    "recent_form": 0.20,
    "home_advantage": 0.15,
    "plus_minus": 0.15,
}

# Home court advantage (historically ~3-4 points / ~5-6% win probability)
HOME_ADVANTAGE = 0.06


def calculate_win_probability(
    home_team_id: int,
    away_team_id: int,
    season: str = "2025-26"
) -> Dict:
    """
    Calculate win probability for a matchup.

    Uses multiple factors:
    - Overall win percentage
    - Points per game differential
    - Recent form (last 10 games)
    - Home court advantage
    - Plus/minus rating

    Returns:
        Dict with probabilities, predicted winner, and key factors
    """
    # Get team details
    home_detail = get_team_detail(home_team_id, season)
    away_detail = get_team_detail(away_team_id, season)

    if not home_detail or not away_detail:
        # Return default 50/50 if we can't get data
        return {
            "home_win_prob": 0.5,
            "away_win_prob": 0.5,
            "predicted_winner": "home",
            "confidence_tier": "LOW",
            "key_factors": [],
            "explanation": "Unable to fetch team data for prediction.",
        }

    home_stats = home_detail["stats"]
    away_stats = away_detail["stats"]
    home_form = home_detail["recent_form"]
    away_form = away_detail["recent_form"]

    # Factor 1: Win Percentage (normalized to 0-1 scale)
    home_win_pct = home_stats.get("win_pct", 0.5)
    away_win_pct = away_stats.get("win_pct", 0.5)

    # Calculate relative strength
    total_win_pct = home_win_pct + away_win_pct
    if total_win_pct > 0:
        win_pct_factor = home_win_pct / total_win_pct
    else:
        win_pct_factor = 0.5

    # Factor 2: Points Per Game Differential
    home_ppg = home_stats.get("pts_per_game", 100)
    away_ppg = away_stats.get("pts_per_game", 100)
    ppg_diff = home_ppg - away_ppg
    # Convert to probability (roughly -20 to +20 range -> 0.3 to 0.7)
    pts_factor = 0.5 + (ppg_diff / 40)
    pts_factor = max(0.3, min(0.7, pts_factor))

    # Factor 3: Recent Form (Last 10)
    home_last_10 = home_form.get("last_10_record", "5-5")
    away_last_10 = away_form.get("last_10_record", "5-5")

    try:
        home_l10_wins = int(home_last_10.split("-")[0])
        away_l10_wins = int(away_last_10.split("-")[0])
    except (ValueError, IndexError):
        home_l10_wins = 5
        away_l10_wins = 5

    total_l10 = home_l10_wins + away_l10_wins
    if total_l10 > 0:
        form_factor = home_l10_wins / (home_l10_wins + away_l10_wins)
    else:
        form_factor = 0.5

    # Factor 4: Plus/Minus Rating
    home_pm = home_stats.get("plus_minus", 0)
    away_pm = away_stats.get("plus_minus", 0)
    pm_diff = home_pm - away_pm
    # Convert to probability (roughly -15 to +15 range -> 0.35 to 0.65)
    pm_factor = 0.5 + (pm_diff / 30)
    pm_factor = max(0.35, min(0.65, pm_factor))

    # Combine factors with weights
    base_prob = (
        WEIGHTS["win_pct"] * win_pct_factor +
        WEIGHTS["pts_diff"] * pts_factor +
        WEIGHTS["recent_form"] * form_factor +
        WEIGHTS["plus_minus"] * pm_factor
    )

    # Add home court advantage
    home_win_prob = base_prob + (WEIGHTS["home_advantage"] * HOME_ADVANTAGE / 0.15)

    # Ensure probability is within bounds
    home_win_prob = max(0.15, min(0.85, home_win_prob))
    away_win_prob = 1 - home_win_prob

    # Determine winner and confidence
    if home_win_prob > away_win_prob:
        predicted_winner = "home"
        confidence = home_win_prob
    else:
        predicted_winner = "away"
        confidence = away_win_prob

    # Determine confidence tier
    if confidence >= 0.65:
        confidence_tier = "HIGH"
    elif confidence >= 0.55:
        confidence_tier = "MEDIUM"
    else:
        confidence_tier = "LOW"

    # Build key factors
    key_factors = []

    # Win percentage factor
    if abs(home_win_pct - away_win_pct) > 0.1:
        better_team = "home" if home_win_pct > away_win_pct else "away"
        key_factors.append({
            "name": "Season Record",
            "value": round(max(home_win_pct, away_win_pct) * 100, 1),
            "impact": "positive" if (better_team == predicted_winner) else "negative",
            "description": f"{'Home' if home_win_pct > away_win_pct else 'Away'} team has better win percentage ({max(home_win_pct, away_win_pct)*100:.1f}% vs {min(home_win_pct, away_win_pct)*100:.1f}%)",
        })

    # Recent form factor
    if abs(home_l10_wins - away_l10_wins) >= 3:
        hot_team = "home" if home_l10_wins > away_l10_wins else "away"
        key_factors.append({
            "name": "Recent Form",
            "value": max(home_l10_wins, away_l10_wins),
            "impact": "positive" if (hot_team == predicted_winner) else "negative",
            "description": f"{'Home' if home_l10_wins > away_l10_wins else 'Away'} team is {max(home_l10_wins, away_l10_wins)}-{10-max(home_l10_wins, away_l10_wins)} in last 10",
        })

    # Home court advantage
    key_factors.append({
        "name": "Home Court",
        "value": 6,
        "impact": "positive" if predicted_winner == "home" else "neutral",
        "description": "Home team has ~6% advantage historically",
    })

    # Plus/minus
    if abs(home_pm - away_pm) > 3:
        better_pm = "home" if home_pm > away_pm else "away"
        key_factors.append({
            "name": "Point Differential",
            "value": round(max(home_pm, away_pm), 1),
            "impact": "positive" if (better_pm == predicted_winner) else "negative",
            "description": f"{'Home' if home_pm > away_pm else 'Away'} has better +/- ({'+' if max(home_pm, away_pm) > 0 else ''}{max(home_pm, away_pm):.1f})",
        })

    # Build explanation
    winner_name = "Home team" if predicted_winner == "home" else "Away team"
    explanation = f"{winner_name} is favored with {confidence*100:.1f}% win probability. "

    if home_win_pct > away_win_pct + 0.1:
        explanation += f"Home team's superior record ({home_win_pct*100:.0f}%) is a key factor. "
    elif away_win_pct > home_win_pct + 0.1:
        explanation += f"Away team's better record ({away_win_pct*100:.0f}%) gives them an edge. "

    if predicted_winner == "home":
        explanation += "Home court advantage provides additional support."
    else:
        explanation += "Away team overcomes home court disadvantage through superior stats."

    return {
        "home_win_prob": round(home_win_prob, 3),
        "away_win_prob": round(away_win_prob, 3),
        "predicted_winner": predicted_winner,
        "confidence_tier": confidence_tier,
        "key_factors": key_factors[:5],  # Limit to top 5 factors
        "explanation": explanation,
    }


def predict_game(
    home_team_id: int,
    away_team_id: int,
    game_date: Optional[str] = None,
    include_explanation: bool = True,
    season: str = "2025-26"
) -> Dict:
    """
    Generate a prediction for a specific game.
    """
    prediction = calculate_win_probability(home_team_id, away_team_id, season)

    result = {
        "home_team_id": home_team_id,
        "away_team_id": away_team_id,
        "home_win_prob": prediction["home_win_prob"],
        "away_win_prob": prediction["away_win_prob"],
        "predicted_winner": prediction["predicted_winner"],
        "confidence_tier": prediction["confidence_tier"],
    }

    if game_date:
        result["game_date"] = game_date

    if include_explanation:
        result["key_factors"] = prediction["key_factors"]
        result["explanation"] = prediction["explanation"]

    return result


def get_todays_predictions(date: str = None, season: str = "2025-26") -> Dict:
    """
    Get predictions for all games on a given date.
    """
    scoreboard = get_scoreboard(date)

    games_with_predictions = []

    for game in scoreboard.get("games", []):
        prediction = predict_game(
            home_team_id=game["home_team_id"],
            away_team_id=game["away_team_id"],
            game_date=game["game_date"],
            include_explanation=False,
            season=season,
        )

        games_with_predictions.append({
            **game,
            "prediction": prediction,
        })

    return {
        "date": scoreboard["date"],
        "games": games_with_predictions,
        "total_games": len(games_with_predictions),
    }
