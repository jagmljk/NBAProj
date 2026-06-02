"""
Prediction Storage Service

Handles storing, retrieving, and validating predictions.
"""

from datetime import datetime
from typing import Dict, List, Optional
from app.database import get_db, dict_from_row


def store_prediction(
    game_id: str,
    game_date: str,
    home_team_id: int,
    home_team_name: str,
    home_team_abbr: str,
    away_team_id: int,
    away_team_name: str,
    away_team_abbr: str,
    predicted_winner: str,
    home_win_prob: float,
    away_win_prob: float,
    confidence_tier: str,
) -> bool:
    """
    Store a prediction in the database.
    Skips if prediction already exists for this game.

    Returns True if stored, False if already exists.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Check if prediction already exists
        cursor.execute("SELECT id FROM predictions WHERE game_id = ?", (game_id,))
        if cursor.fetchone() is not None:
            return False  # Already exists

        cursor.execute("""
            INSERT INTO predictions (
                game_id, game_date, home_team_id, home_team_name, home_team_abbr,
                away_team_id, away_team_name, away_team_abbr, predicted_winner,
                home_win_prob, away_win_prob, confidence_tier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            game_id, game_date, home_team_id, home_team_name, home_team_abbr,
            away_team_id, away_team_name, away_team_abbr, predicted_winner,
            home_win_prob, away_win_prob, confidence_tier
        ))

        conn.commit()
        return True


def get_prediction(game_id: str) -> Optional[Dict]:
    """Get a single prediction by game ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM predictions WHERE game_id = ?", (game_id,))
        row = cursor.fetchone()
        return dict_from_row(row)


def get_predictions_by_date(game_date: str) -> List[Dict]:
    """Get all predictions for a specific date."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM predictions WHERE game_date = ? ORDER BY created_at",
            (game_date,)
        )
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]


def get_unvalidated_predictions(game_date: Optional[str] = None) -> List[Dict]:
    """
    Get predictions that haven't been validated yet.
    Optionally filter by date.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        if game_date:
            cursor.execute(
                """SELECT * FROM predictions
                   WHERE validated_at IS NULL AND game_date = ?
                   ORDER BY game_date, created_at""",
                (game_date,)
            )
        else:
            cursor.execute(
                """SELECT * FROM predictions
                   WHERE validated_at IS NULL
                   ORDER BY game_date, created_at"""
            )

        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]


def update_validation(
    game_id: str,
    actual_winner: str,
    home_score: int,
    away_score: int,
    is_correct: bool,
) -> bool:
    """
    Mark a prediction as validated with actual game result.

    Returns True if updated, False if prediction not found.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE predictions
            SET actual_winner = ?,
                home_score = ?,
                away_score = ?,
                is_correct = ?,
                validated_at = ?
            WHERE game_id = ?
        """, (
            actual_winner,
            home_score,
            away_score,
            1 if is_correct else 0,
            datetime.now().isoformat(),
            game_id
        ))

        conn.commit()
        return cursor.rowcount > 0


def get_accuracy_stats() -> Dict:
    """
    Calculate overall accuracy statistics.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Total validated predictions
        cursor.execute(
            "SELECT COUNT(*) FROM predictions WHERE validated_at IS NOT NULL"
        )
        total_validated = cursor.fetchone()[0]

        # Correct predictions
        cursor.execute(
            "SELECT COUNT(*) FROM predictions WHERE is_correct = 1"
        )
        total_correct = cursor.fetchone()[0]

        # By confidence tier
        cursor.execute("""
            SELECT confidence_tier,
                   COUNT(*) as total,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM predictions
            WHERE validated_at IS NOT NULL
            GROUP BY confidence_tier
        """)
        tier_rows = cursor.fetchall()

        tiers = {}
        for row in tier_rows:
            tier = row["confidence_tier"]
            total = row["total"]
            correct = row["correct"]
            tiers[tier] = {
                "total": total,
                "correct": correct,
                "accuracy": round(correct / total, 4) if total > 0 else 0.0
            }

        # By date (last 30 days with data)
        cursor.execute("""
            SELECT game_date,
                   COUNT(*) as total,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
            FROM predictions
            WHERE validated_at IS NOT NULL
            GROUP BY game_date
            ORDER BY game_date DESC
            LIMIT 30
        """)
        date_rows = cursor.fetchall()

        daily = []
        for row in date_rows:
            daily.append({
                "date": row["game_date"],
                "total": row["total"],
                "correct": row["correct"],
                "accuracy": round(row["correct"] / row["total"], 4) if row["total"] > 0 else 0.0
            })

        return {
            "total_predictions": total_validated,
            "total_correct": total_correct,
            "overall_accuracy": round(total_correct / total_validated, 4) if total_validated > 0 else 0.0,
            "by_tier": tiers,
            "daily": daily,
        }


def get_recent_predictions(days: int = 7) -> List[Dict]:
    """Get predictions from the last N days."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM predictions
            WHERE game_date >= date('now', ?)
            ORDER BY game_date DESC, created_at DESC
        """, (f'-{days} days',))

        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]


def get_upset_predictions() -> List[Dict]:
    """
    Get predictions where underdog was picked (away team with >50% win prob).
    These are potential 'upset' predictions.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM predictions
            WHERE away_win_prob > 0.5
            ORDER BY game_date DESC
            LIMIT 50
        """)

        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]


def get_confidence_tier_breakdown() -> Dict:
    """Get breakdown of predictions by confidence tier."""
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT confidence_tier,
                   COUNT(*) as total,
                   SUM(CASE WHEN validated_at IS NOT NULL THEN 1 ELSE 0 END) as validated,
                   SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
                   AVG(CASE WHEN predicted_winner = 'home' THEN home_win_prob ELSE away_win_prob END) as avg_confidence
            FROM predictions
            GROUP BY confidence_tier
            ORDER BY avg_confidence DESC
        """)

        rows = cursor.fetchall()

        tiers = []
        for row in rows:
            total = row["total"]
            validated = row["validated"]
            correct = row["correct"] or 0

            tiers.append({
                "tier": row["confidence_tier"],
                "total": total,
                "validated": validated,
                "correct": correct,
                "accuracy": round(correct / validated, 4) if validated > 0 else None,
                "avg_confidence": round(row["avg_confidence"], 4) if row["avg_confidence"] else None,
            })

        return {"tiers": tiers}


def get_all_predictions(limit: int = 100, offset: int = 0) -> Dict:
    """Get all predictions with pagination."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Get total count
        cursor.execute("SELECT COUNT(*) FROM predictions")
        total = cursor.fetchone()[0]

        # Get paginated results
        cursor.execute("""
            SELECT * FROM predictions
            ORDER BY game_date DESC, created_at DESC
            LIMIT ? OFFSET ?
        """, (limit, offset))

        rows = cursor.fetchall()

        return {
            "predictions": [dict_from_row(row) for row in rows],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
