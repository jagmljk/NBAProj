"""
Predictions Router - NBA game prediction endpoints using ML model.
"""

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from app.services.ml_prediction import predict_game_ml, get_model_info
from app.services.nba_data import get_scoreboard, get_team_by_id
from app.services.prediction_storage import store_prediction

router = APIRouter()


class PredictionRequest(BaseModel):
    home_team_id: int
    away_team_id: int
    game_date: Optional[str] = None


class BatchPredictionRequest(BaseModel):
    games: List[dict]


@router.post("")
async def make_prediction(request: PredictionRequest):
    """
    Make a prediction for a single game using ML model.

    Args:
        home_team_id: NBA team ID for home team
        away_team_id: NBA team ID for away team
        game_date: Optional date string

    Returns:
        Prediction with win probabilities, predicted winner, and confidence tier
    """
    if request.home_team_id == request.away_team_id:
        raise HTTPException(status_code=400, detail="Team cannot play against itself")

    try:
        prediction = predict_game_ml(
            home_team_id=request.home_team_id,
            away_team_id=request.away_team_id,
            game_date=request.game_date,
        )

        # Store prediction if we have game date and team info
        if request.game_date:
            home_team = get_team_by_id(request.home_team_id)
            away_team = get_team_by_id(request.away_team_id)
            if home_team and away_team:
                game_id = f"{request.game_date}_{request.home_team_id}_{request.away_team_id}"
                store_prediction(
                    game_id=game_id,
                    game_date=request.game_date,
                    home_team_id=request.home_team_id,
                    home_team_name=home_team["full_name"],
                    home_team_abbr=home_team["abbreviation"],
                    away_team_id=request.away_team_id,
                    away_team_name=away_team["full_name"],
                    away_team_abbr=away_team["abbreviation"],
                    predicted_winner=prediction["predicted_winner"],
                    home_win_prob=prediction["home_win_prob"],
                    away_win_prob=prediction["away_win_prob"],
                    confidence_tier=prediction["confidence_tier"],
                )

        return prediction

    except Exception as e:
        print(f"Error making prediction: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@router.post("/batch")
async def make_batch_predictions(request: BatchPredictionRequest):
    """
    Make predictions for multiple games using ML model.
    """
    predictions = []

    for game in request.games:
        try:
            pred = predict_game_ml(
                home_team_id=game.get("home_team_id"),
                away_team_id=game.get("away_team_id"),
                game_date=game.get("game_date"),
            )
            predictions.append(pred)
        except Exception as e:
            print(f"Error predicting game: {e}")
            predictions.append({
                "home_team_id": game.get("home_team_id"),
                "away_team_id": game.get("away_team_id"),
                "error": str(e),
            })

    return {"predictions": predictions}


@router.get("/today")
async def get_today_predictions(
    date: Optional[str] = Query(default=None, description="Date in YYYY-MM-DD format (defaults to today)")
):
    """
    Get predictions for all games on a given date using ML model.

    Returns:
        List of games with their ML predictions
    """
    try:
        # Get scoreboard for the date
        scoreboard = get_scoreboard(date)

        games_with_predictions = []

        for game in scoreboard.get("games", []):
            # Get ML prediction
            prediction = predict_game_ml(
                home_team_id=game["home_team_id"],
                away_team_id=game["away_team_id"],
                game_date=game["game_date"],
            )

            # Store prediction in database
            store_prediction(
                game_id=game["game_id"],
                game_date=game["game_date"],
                home_team_id=game["home_team_id"],
                home_team_name=game["home_team_name"],
                home_team_abbr=game["home_team_abbreviation"],
                away_team_id=game["away_team_id"],
                away_team_name=game["away_team_name"],
                away_team_abbr=game["away_team_abbreviation"],
                predicted_winner=prediction["predicted_winner"],
                home_win_prob=prediction["home_win_prob"],
                away_win_prob=prediction["away_win_prob"],
                confidence_tier=prediction["confidence_tier"],
            )

            games_with_predictions.append({
                **game,
                "prediction": prediction,
            })

        return {
            "date": scoreboard["date"],
            "games": games_with_predictions,
            "total_games": len(games_with_predictions),
            "model": "XGBoost + LightGBM Ensemble",
        }

    except Exception as e:
        print(f"Error getting today's predictions: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to get predictions: {str(e)}")


@router.get("/model/info")
async def get_ml_model_info():
    """
    Get information about the ML model being used.

    Returns:
        Model type, accuracy, features, and training details
    """
    try:
        return get_model_info()
    except Exception as e:
        print(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")
