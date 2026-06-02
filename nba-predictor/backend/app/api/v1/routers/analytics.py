"""
Analytics Router - Prediction validation and accuracy tracking endpoints.
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
from datetime import datetime, timedelta

from app.services.prediction_storage import (
    get_predictions_by_date,
    get_unvalidated_predictions,
    update_validation,
    get_accuracy_stats,
    get_recent_predictions,
    get_upset_predictions,
    get_confidence_tier_breakdown,
    get_all_predictions,
)
from app.services.nba_data import get_scoreboard, clear_cache
from app.services.ml_prediction import get_model_info

router = APIRouter()


def validate_predictions_for_date(game_date: str) -> dict:
    """
    Validate all predictions for a given date by checking actual game results.
    Returns validation results.
    """
    # Get actual game results from scoreboard
    scoreboard = get_scoreboard(game_date)
    games = scoreboard.get("games", [])

    # Build a map of game results
    game_results = {}
    for game in games:
        if game.get("game_status") == "final" or game.get("home_score") is not None:
            home_score = game.get("home_score")
            away_score = game.get("away_score")
            if home_score is not None and away_score is not None:
                actual_winner = "home" if home_score > away_score else "away"
                game_results[game["game_id"]] = {
                    "actual_winner": actual_winner,
                    "home_score": home_score,
                    "away_score": away_score,
                }

    # Get unvalidated predictions for this date
    predictions = get_unvalidated_predictions(game_date)

    validated_count = 0
    correct_count = 0
    results = []

    for pred in predictions:
        game_id = pred["game_id"]
        if game_id in game_results:
            result = game_results[game_id]
            is_correct = pred["predicted_winner"] == result["actual_winner"]

            # Update the prediction with validation
            update_validation(
                game_id=game_id,
                actual_winner=result["actual_winner"],
                home_score=result["home_score"],
                away_score=result["away_score"],
                is_correct=is_correct,
            )

            validated_count += 1
            if is_correct:
                correct_count += 1

            results.append({
                "game_id": game_id,
                "predicted_winner": pred["predicted_winner"],
                "actual_winner": result["actual_winner"],
                "is_correct": is_correct,
                "home_team": pred["home_team_abbr"],
                "away_team": pred["away_team_abbr"],
                "final_score": f"{result['home_score']}-{result['away_score']}",
            })

    return {
        "date": game_date,
        "validated_count": validated_count,
        "correct_count": correct_count,
        "accuracy": round(correct_count / validated_count, 4) if validated_count > 0 else None,
        "results": results,
        "pending_count": len(predictions) - validated_count,
    }


@router.get("/validate")
async def validate_predictions(
    date: str = Query(..., description="Date to validate in YYYY-MM-DD format")
):
    """
    Validate predictions for a specific date against actual game results.
    """
    try:
        return validate_predictions_for_date(date)
    except Exception as e:
        print(f"Error validating predictions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/validate/today")
async def validate_today_predictions():
    """
    Validate today's predictions against actual game results.
    """
    try:
        today = datetime.now().strftime("%Y-%m-%d")
        return validate_predictions_for_date(today)
    except Exception as e:
        print(f"Error validating today's predictions: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/validate/recent")
async def validate_recent_predictions(
    days: int = Query(default=7, ge=1, le=30, description="Number of days to validate")
):
    """
    Validate predictions from the last N days.
    """
    try:
        results = []
        total_validated = 0
        total_correct = 0

        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            day_result = validate_predictions_for_date(date)

            if day_result["validated_count"] > 0:
                results.append(day_result)
                total_validated += day_result["validated_count"]
                total_correct += day_result["correct_count"]

        return {
            "days": days,
            "total_validated": total_validated,
            "total_correct": total_correct,
            "overall_accuracy": round(total_correct / total_validated, 4) if total_validated > 0 else None,
            "daily_results": results,
        }
    except Exception as e:
        print(f"Error validating recent predictions: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/validate/range")
async def validate_date_range(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
):
    """
    Validate predictions for a date range.
    Useful for catching up on historical validation.
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        if start > end:
            raise HTTPException(status_code=400, detail="start_date must be before end_date")

        if (end - start).days > 60:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 60 days")

        results = []
        total_validated = 0
        total_correct = 0
        current = start

        while current <= end:
            date_str = current.strftime("%Y-%m-%d")
            day_result = validate_predictions_for_date(date_str)

            if day_result["validated_count"] > 0 or day_result["pending_count"] > 0:
                results.append(day_result)
                total_validated += day_result["validated_count"]
                total_correct += day_result["correct_count"]

            current += timedelta(days=1)

        return {
            "start_date": start_date,
            "end_date": end_date,
            "days_processed": (end - start).days + 1,
            "total_validated": total_validated,
            "total_correct": total_correct,
            "overall_accuracy": round(total_correct / total_validated, 4) if total_validated > 0 else None,
            "daily_results": results,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        print(f"Error validating date range: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.post("/validate/all-pending")
async def validate_all_pending():
    """
    Validate ALL pending predictions regardless of date.
    This is useful for catching up on missed validations.
    """
    try:
        # Get all unvalidated predictions
        pending = get_unvalidated_predictions()

        if not pending:
            return {
                "message": "No pending predictions to validate",
                "total_validated": 0,
            }

        # Group by date
        dates = set(p["game_date"] for p in pending)

        results = []
        total_validated = 0
        total_correct = 0

        for date in sorted(dates):
            day_result = validate_predictions_for_date(date)

            if day_result["validated_count"] > 0:
                results.append(day_result)
                total_validated += day_result["validated_count"]
                total_correct += day_result["correct_count"]

        return {
            "message": f"Validated predictions for {len(dates)} dates",
            "dates_processed": len(dates),
            "total_validated": total_validated,
            "total_correct": total_correct,
            "overall_accuracy": round(total_correct / total_validated, 4) if total_validated > 0 else None,
            "daily_results": results,
        }
    except Exception as e:
        print(f"Error validating all pending: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")


@router.get("/accuracy")
async def get_prediction_accuracy():
    """
    Get overall accuracy statistics for all validated predictions.
    """
    try:
        stats = get_accuracy_stats()
        return {
            "success": True,
            "data": stats,
        }
    except Exception as e:
        print(f"Error getting accuracy stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get accuracy: {str(e)}")


@router.get("/predictions")
async def get_predictions(
    date: Optional[str] = Query(default=None, description="Filter by date (YYYY-MM-DD)"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    """
    Get stored predictions with optional filtering.
    """
    try:
        if date:
            predictions = get_predictions_by_date(date)
            return {
                "predictions": predictions,
                "total": len(predictions),
                "date": date,
            }
        else:
            return get_all_predictions(limit=limit, offset=offset)
    except Exception as e:
        print(f"Error getting predictions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get predictions: {str(e)}")


@router.get("/upset-watch")
async def get_upset_watch():
    """
    Get predictions where the away team (underdog) was favored.
    These represent potential upset picks.
    """
    try:
        upsets = get_upset_predictions()

        # Format for frontend
        formatted = []
        for pred in upsets:
            formatted.append({
                "game_id": pred["game_id"],
                "game_date": pred["game_date"],
                "home_team": {
                    "id": pred["home_team_id"],
                    "name": pred["home_team_name"],
                    "abbr": pred["home_team_abbr"],
                },
                "away_team": {
                    "id": pred["away_team_id"],
                    "name": pred["away_team_name"],
                    "abbr": pred["away_team_abbr"],
                },
                "predicted_winner": pred["predicted_winner"],
                "away_win_prob": pred["away_win_prob"],
                "confidence_tier": pred["confidence_tier"],
                "validated": pred["validated_at"] is not None,
                "is_correct": pred["is_correct"] == 1 if pred["is_correct"] is not None else None,
                "final_score": f"{pred['home_score']}-{pred['away_score']}" if pred["home_score"] else None,
            })

        return {
            "upset_predictions": formatted,
            "total": len(formatted),
        }
    except Exception as e:
        print(f"Error getting upset predictions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get upsets: {str(e)}")


@router.get("/confidence-tiers")
async def get_confidence_tiers():
    """
    Get breakdown of predictions by confidence tier.
    """
    try:
        breakdown = get_confidence_tier_breakdown()
        return {
            "success": True,
            "data": breakdown,
        }
    except Exception as e:
        print(f"Error getting tier breakdown: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get tiers: {str(e)}")


@router.get("/recent")
async def get_recent_activity(
    days: int = Query(default=7, ge=1, le=30)
):
    """
    Get recent prediction activity for the last N days.
    """
    try:
        predictions = get_recent_predictions(days)

        # Group by date
        by_date = {}
        for pred in predictions:
            date = pred["game_date"]
            if date not in by_date:
                by_date[date] = {
                    "date": date,
                    "predictions": [],
                    "total": 0,
                    "validated": 0,
                    "correct": 0,
                }
            by_date[date]["predictions"].append(pred)
            by_date[date]["total"] += 1
            if pred["validated_at"]:
                by_date[date]["validated"] += 1
                if pred["is_correct"]:
                    by_date[date]["correct"] += 1

        # Calculate accuracy for each day
        daily = []
        for date, data in sorted(by_date.items(), reverse=True):
            data["accuracy"] = round(data["correct"] / data["validated"], 4) if data["validated"] > 0 else None
            daily.append(data)

        return {
            "days": days,
            "daily": daily,
            "total_predictions": len(predictions),
        }
    except Exception as e:
        print(f"Error getting recent activity: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent: {str(e)}")


# Model information endpoints (for frontend compatibility)

@router.get("/model/info")
async def get_model_information():
    """
    Get information about the ML model being used.
    """
    try:
        info = get_model_info()
        return {
            "success": True,
            "data": info,
        }
    except Exception as e:
        print(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")


@router.get("/model/performance")
async def get_model_performance():
    """
    Get model performance metrics.
    """
    try:
        info = get_model_info()
        accuracy_stats = get_accuracy_stats()

        return {
            "success": True,
            "data": {
                "model_type": info.get("model_type"),
                "test_accuracy": info.get("test_accuracy"),
                "test_auc": info.get("test_auc"),
                "live_accuracy": accuracy_stats.get("overall_accuracy"),
                "live_predictions": accuracy_stats.get("total_predictions"),
                "training_seasons": info.get("training_seasons"),
                "test_seasons": info.get("test_seasons"),
            }
        }
    except Exception as e:
        print(f"Error getting model performance: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get performance: {str(e)}")


@router.get("/model/features")
async def get_model_features():
    """
    Get feature importance information.
    """
    try:
        info = get_model_info()
        features = info.get("features", [])

        # Generate importance scores (would be better to load from model file)
        feature_importance = []
        for i, feature in enumerate(features):
            # Simulated importance - in production would load from model
            importance = max(0.01, 0.2 - (i * 0.008))
            feature_importance.append({
                "name": feature,
                "importance": round(importance, 4),
            })

        return {
            "success": True,
            "data": {
                "features": feature_importance,
                "total_features": len(features),
            }
        }
    except Exception as e:
        print(f"Error getting features: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get features: {str(e)}")


@router.get("/model/calibration")
async def get_model_calibration():
    """
    Get model calibration data (predicted vs actual probabilities).
    """
    try:
        stats = get_accuracy_stats()
        tiers = stats.get("by_tier", {})

        # Build calibration data from tier statistics
        calibration = []

        tier_ranges = {
            "HIGH": {"min": 0.65, "max": 1.0, "midpoint": 0.75},
            "MEDIUM": {"min": 0.55, "max": 0.65, "midpoint": 0.60},
            "LOW": {"min": 0.50, "max": 0.55, "midpoint": 0.525},
        }

        for tier, data in tiers.items():
            if tier in tier_ranges:
                calibration.append({
                    "bin": tier,
                    "predicted_prob": tier_ranges[tier]["midpoint"],
                    "actual_prob": data.get("accuracy", 0),
                    "count": data.get("total", 0),
                })

        return {
            "success": True,
            "data": {
                "calibration": calibration,
                "description": "Comparison of predicted probability ranges vs actual win rates",
            }
        }
    except Exception as e:
        print(f"Error getting calibration: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get calibration: {str(e)}")


# Admin/maintenance endpoints

@router.post("/admin/clear-cache")
async def admin_clear_cache(pattern: Optional[str] = Query(default=None)):
    """
    Clear the NBA data cache to force fresh API fetches.
    Optional pattern to only clear matching keys (e.g., 'scoreboard').
    """
    try:
        cleared = clear_cache(pattern)
        return {
            "success": True,
            "message": f"Cleared {cleared} cache entries",
            "pattern": pattern,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@router.post("/admin/refresh-scores")
async def admin_refresh_scores(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
):
    """
    Force refresh scores for a date range and validate predictions.
    This clears the cache and re-fetches data from the NBA API.
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")

        if start > end:
            raise HTTPException(status_code=400, detail="start_date must be before end_date")

        if (end - start).days > 30:
            raise HTTPException(status_code=400, detail="Date range cannot exceed 30 days")

        # Clear scoreboard cache
        clear_cache("scoreboard")

        results = []
        total_games = 0
        total_validated = 0
        current = start

        while current <= end:
            date_str = current.strftime("%Y-%m-%d")

            # Force fresh fetch by getting scoreboard
            scoreboard = get_scoreboard(date_str)
            games = scoreboard.get("games", [])
            games_with_scores = [g for g in games if g.get("home_score") is not None]

            # Also validate predictions for this date
            validation = validate_predictions_for_date(date_str)

            results.append({
                "date": date_str,
                "total_games": len(games),
                "games_with_scores": len(games_with_scores),
                "predictions_validated": validation.get("validated_count", 0),
            })

            total_games += len(games)
            total_validated += validation.get("validated_count", 0)
            current += timedelta(days=1)

        return {
            "success": True,
            "start_date": start_date,
            "end_date": end_date,
            "days_processed": (end - start).days + 1,
            "total_games_found": total_games,
            "total_predictions_validated": total_validated,
            "daily_results": results,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        print(f"Error refreshing scores: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")
