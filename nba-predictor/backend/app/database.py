"""
SQLite Database Module for NBA Predictor

Handles prediction storage and retrieval for analytics validation.
"""

import sqlite3
from pathlib import Path
from typing import Optional
from contextlib import contextmanager

# Database path
DATA_DIR = Path(__file__).parent.parent / "data"
DB_PATH = DATA_DIR / "predictions.db"


def init_db():
    """Initialize the database and create tables if they don't exist."""
    # Ensure data directory exists
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create predictions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_id TEXT UNIQUE NOT NULL,
            game_date TEXT NOT NULL,
            home_team_id INTEGER NOT NULL,
            home_team_name TEXT NOT NULL,
            home_team_abbr TEXT NOT NULL,
            away_team_id INTEGER NOT NULL,
            away_team_name TEXT NOT NULL,
            away_team_abbr TEXT NOT NULL,
            predicted_winner TEXT NOT NULL,
            home_win_prob REAL NOT NULL,
            away_win_prob REAL NOT NULL,
            confidence_tier TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            -- Validation fields (NULL until validated)
            actual_winner TEXT,
            home_score INTEGER,
            away_score INTEGER,
            is_correct INTEGER,
            validated_at TEXT
        )
    """)

    # Create index for faster lookups
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_predictions_game_date
        ON predictions(game_date)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_predictions_validated
        ON predictions(validated_at)
    """)

    conn.commit()
    conn.close()

    print(f"Database initialized at {DB_PATH}")


@contextmanager
def get_db():
    """Get database connection as context manager."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    try:
        yield conn
    finally:
        conn.close()


def dict_from_row(row: sqlite3.Row) -> Optional[dict]:
    """Convert sqlite3.Row to dictionary."""
    if row is None:
        return None
    return dict(row)
