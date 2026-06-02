"""
ML-Based Prediction Service

Uses trained XGBoost + LightGBM ensemble for game predictions.
Accuracy: ~65% on test set (vs Vegas ~52-55% on spread)
"""

import pickle
import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from app.services.nba_data import get_team_game_log, get_team_stats

# Model paths
MODEL_DIR = Path(__file__).parent.parent.parent / "ml" / "models"

# Global model cache
_xgb_model = None
_lgb_model = None
_ensemble_config = None


def load_models():
    """Load trained models into memory."""
    global _xgb_model, _lgb_model, _ensemble_config

    if _xgb_model is not None:
        return

    print("Loading ML models...")

    try:
        with open(MODEL_DIR / "xgboost_model.pkl", "rb") as f:
            _xgb_model = pickle.load(f)

        with open(MODEL_DIR / "lightgbm_model.pkl", "rb") as f:
            _lgb_model = pickle.load(f)

        with open(MODEL_DIR / "ensemble_config.json", "r") as f:
            _ensemble_config = json.load(f)

        print("  Models loaded successfully")
    except Exception as e:
        print(f"  Error loading models: {e}")
        raise


def calculate_rolling_stats(team_id: int, season: str = "2025-26", n_games: int = 10) -> Optional[Dict]:
    """
    Calculate rolling statistics for a team using recent game log.
    """
    game_log = get_team_game_log(team_id, season)

    if not game_log or len(game_log) < 3:
        return None

    # Take last n games
    recent_games = game_log[:n_games]

    # Calculate stats
    wins = sum(1 for g in recent_games if (g.get("result") or "").startswith("W"))
    win_pct = wins / len(recent_games)

    pts = np.mean([g.get("pts", 100) for g in recent_games])
    opp_pts = np.mean([g.get("opp_pts", 100) for g in recent_games])

    # Using points as proxy for ratings
    off_rating = pts
    def_rating = opp_pts
    net_rating = off_rating - def_rating

    return {
        "win_pct": win_pct,
        "off_rating": off_rating,
        "def_rating": def_rating,
        "net_rating": net_rating,
        "efg_pct": 0.5,  # Default, will improve with more data
        "tov_pct": 0.12,
        "ftr": 0.25,
        "oreb": 10,
    }


def build_prediction_features(
    home_team_id: int,
    away_team_id: int,
    season: str = "2025-26"
) -> Optional[np.ndarray]:
    """
    Build feature vector for a single prediction.
    Must match training features exactly.
    """
    # Get rolling stats for both teams
    home_stats_10 = calculate_rolling_stats(home_team_id, season, 10)
    away_stats_10 = calculate_rolling_stats(away_team_id, season, 10)
    home_stats_5 = calculate_rolling_stats(home_team_id, season, 5)
    away_stats_5 = calculate_rolling_stats(away_team_id, season, 5)

    if not all([home_stats_10, away_stats_10, home_stats_5, away_stats_5]):
        return None

    # Build features in EXACT order as training
    # Feature order from ensemble_config.json:
    # IS_HOME, WIN_PCT_DIFF_10, WIN_PCT_DIFF_5, NET_RATING_DIFF_10, NET_RATING_DIFF_5,
    # OFF_RATING_DIFF_10, OFF_RATING_DIFF_5, DEF_RATING_DIFF_10, DEF_RATING_DIFF_5,
    # EFG_PCT_DIFF_10, EFG_PCT_DIFF_5, TOV_PCT_DIFF_10, TOV_PCT_DIFF_5,
    # FTR_DIFF_10, FTR_DIFF_5, OREB_DIFF_10, OREB_DIFF_5,
    # HOME_WIN_PCT_10, HOME_NET_RATING_10, AWAY_WIN_PCT_10, AWAY_NET_RATING_10

    features = [
        1,  # IS_HOME (predicting from home team perspective)
        home_stats_10["win_pct"] - away_stats_10["win_pct"],  # WIN_PCT_DIFF_10
        home_stats_5["win_pct"] - away_stats_5["win_pct"],    # WIN_PCT_DIFF_5
        home_stats_10["net_rating"] - away_stats_10["net_rating"],  # NET_RATING_DIFF_10
        home_stats_5["net_rating"] - away_stats_5["net_rating"],    # NET_RATING_DIFF_5
        home_stats_10["off_rating"] - away_stats_10["off_rating"],  # OFF_RATING_DIFF_10
        home_stats_5["off_rating"] - away_stats_5["off_rating"],    # OFF_RATING_DIFF_5
        away_stats_10["def_rating"] - home_stats_10["def_rating"],  # DEF_RATING_DIFF_10
        away_stats_5["def_rating"] - home_stats_5["def_rating"],    # DEF_RATING_DIFF_5
        home_stats_10["efg_pct"] - away_stats_10["efg_pct"],  # EFG_PCT_DIFF_10
        home_stats_5["efg_pct"] - away_stats_5["efg_pct"],    # EFG_PCT_DIFF_5
        away_stats_10["tov_pct"] - home_stats_10["tov_pct"],  # TOV_PCT_DIFF_10
        away_stats_5["tov_pct"] - home_stats_5["tov_pct"],    # TOV_PCT_DIFF_5
        home_stats_10["ftr"] - away_stats_10["ftr"],  # FTR_DIFF_10
        home_stats_5["ftr"] - away_stats_5["ftr"],    # FTR_DIFF_5
        home_stats_10["oreb"] - away_stats_10["oreb"],  # OREB_DIFF_10
        home_stats_5["oreb"] - away_stats_5["oreb"],    # OREB_DIFF_5
        home_stats_10["win_pct"],     # HOME_WIN_PCT_10
        home_stats_10["net_rating"],  # HOME_NET_RATING_10
        away_stats_10["win_pct"],     # AWAY_WIN_PCT_10
        away_stats_10["net_rating"],  # AWAY_NET_RATING_10
    ]

    return np.array(features).reshape(1, -1)


def predict_game_ml(
    home_team_id: int,
    away_team_id: int,
    game_date: Optional[str] = None,
    season: str = "2025-26"
) -> Dict:
    """
    Generate ML-based prediction for a game.

    Returns probabilities from ensemble model.
    """
    # Ensure models are loaded
    load_models()

    # Build features
    features = build_prediction_features(home_team_id, away_team_id, season)

    if features is None:
        # Fallback to 50/50 if we can't build features
        return {
            "home_team_id": home_team_id,
            "away_team_id": away_team_id,
            "home_win_prob": 0.5,
            "away_win_prob": 0.5,
            "predicted_winner": "home",
            "confidence_tier": "LOW",
            "model": "fallback",
            "game_date": game_date,
        }

    # Get predictions from both models
    xgb_prob = _xgb_model.predict_proba(features)[0, 1]
    lgb_prob = _lgb_model.predict_proba(features)[0, 1]

    # Ensemble (weighted average)
    xgb_weight = _ensemble_config["xgboost_weight"]
    lgb_weight = _ensemble_config["lightgbm_weight"]

    home_win_prob = xgb_weight * xgb_prob + lgb_weight * lgb_prob
    away_win_prob = 1 - home_win_prob

    # Determine winner and confidence
    if home_win_prob > away_win_prob:
        predicted_winner = "home"
        confidence = home_win_prob
    else:
        predicted_winner = "away"
        confidence = away_win_prob

    # Confidence tier
    if confidence >= 0.65:
        confidence_tier = "HIGH"
    elif confidence >= 0.55:
        confidence_tier = "MEDIUM"
    else:
        confidence_tier = "LOW"

    return {
        "home_team_id": home_team_id,
        "away_team_id": away_team_id,
        "home_win_prob": round(home_win_prob, 3),
        "away_win_prob": round(away_win_prob, 3),
        "predicted_winner": predicted_winner,
        "confidence_tier": confidence_tier,
        "model": "ml_ensemble",
        "game_date": game_date,
    }


def get_model_info() -> Dict:
    """Get information about the loaded model."""
    load_models()

    return {
        "model_type": "XGBoost + LightGBM Ensemble",
        "xgboost_weight": _ensemble_config["xgboost_weight"],
        "lightgbm_weight": _ensemble_config["lightgbm_weight"],
        "test_accuracy": _ensemble_config["metrics"]["ensemble_test_accuracy"],
        "test_auc": _ensemble_config["metrics"]["ensemble_test_auc"],
        "features": _ensemble_config["feature_names"],
        "training_seasons": "2015-16 to 2021-22",
        "validation_season": "2022-23",
        "test_seasons": "2023-24 to 2024-25",
    }
