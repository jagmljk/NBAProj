"""
Feature Engineering for NBA Game Prediction

Key principles from expert analysis:
1. Use DIFFERENCE features (team - opponent) not absolute values
2. Include Four Factors: eFG%, TOV%, OREB%, FTr
3. Rolling averages (last 5, 10 games)
4. Two rows per game (symmetric formulation)
5. Context: home/away, rest days
"""

import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta

# Paths
DATA_DIR = Path(__file__).parent.parent / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"


def load_raw_data():
    """Load raw game and team stats data."""
    print("Loading raw data...")

    games_path = RAW_DIR / "all_games.csv"
    stats_path = RAW_DIR / "all_team_stats.csv"

    if not games_path.exists():
        raise FileNotFoundError(f"Games data not found: {games_path}")

    games = pd.read_csv(games_path)
    team_stats = pd.read_csv(stats_path) if stats_path.exists() else None

    print(f"  Loaded {len(games)} game records")
    if team_stats is not None:
        print(f"  Loaded {len(team_stats)} team-season records")

    return games, team_stats


def create_game_pairs(games: pd.DataFrame) -> pd.DataFrame:
    """
    Convert game records into game pairs (one row per game).
    Each game appears twice in raw data (once per team).
    """
    print("Creating game pairs...")

    # Sort by date
    games = games.copy()
    games["GAME_DATE"] = pd.to_datetime(games["GAME_DATE"])
    games = games.sort_values("GAME_DATE")

    # Identify home vs away
    games["IS_HOME"] = games["MATCHUP"].str.contains("vs.")

    # Get unique games
    unique_games = games.drop_duplicates(subset=["GAME_ID"])

    game_pairs = []

    for game_id in unique_games["GAME_ID"].unique():
        game_records = games[games["GAME_ID"] == game_id]

        if len(game_records) != 2:
            continue

        home_record = game_records[game_records["IS_HOME"] == True]
        away_record = game_records[game_records["IS_HOME"] == False]

        if len(home_record) != 1 or len(away_record) != 1:
            continue

        home = home_record.iloc[0]
        away = away_record.iloc[0]

        game_pairs.append({
            "GAME_ID": game_id,
            "GAME_DATE": home["GAME_DATE"],
            "SEASON": home["SEASON"],
            "HOME_TEAM_ID": home["TEAM_ID"],
            "HOME_TEAM_NAME": home["TEAM_NAME"],
            "AWAY_TEAM_ID": away["TEAM_ID"],
            "AWAY_TEAM_NAME": away["TEAM_NAME"],
            "HOME_PTS": home["PTS"],
            "AWAY_PTS": away["PTS"],
            "HOME_WIN": 1 if home["WL"] == "W" else 0,
            # Basic stats for feature calculation
            "HOME_FGM": home["FGM"], "HOME_FGA": home["FGA"], "HOME_FG_PCT": home["FG_PCT"],
            "HOME_FG3M": home["FG3M"], "HOME_FG3A": home["FG3A"], "HOME_FG3_PCT": home["FG3_PCT"],
            "HOME_FTM": home["FTM"], "HOME_FTA": home["FTA"], "HOME_FT_PCT": home["FT_PCT"],
            "HOME_OREB": home["OREB"], "HOME_DREB": home["DREB"], "HOME_REB": home["REB"],
            "HOME_AST": home["AST"], "HOME_STL": home["STL"], "HOME_BLK": home["BLK"],
            "HOME_TOV": home["TOV"], "HOME_PF": home["PF"],
            "AWAY_FGM": away["FGM"], "AWAY_FGA": away["FGA"], "AWAY_FG_PCT": away["FG_PCT"],
            "AWAY_FG3M": away["FG3M"], "AWAY_FG3A": away["FG3A"], "AWAY_FG3_PCT": away["FG3_PCT"],
            "AWAY_FTM": away["FTM"], "AWAY_FTA": away["FTA"], "AWAY_FT_PCT": away["FT_PCT"],
            "AWAY_OREB": away["OREB"], "AWAY_DREB": away["DREB"], "AWAY_REB": away["REB"],
            "AWAY_AST": away["AST"], "AWAY_STL": away["STL"], "AWAY_BLK": away["BLK"],
            "AWAY_TOV": away["TOV"], "AWAY_PF": away["PF"],
        })

    df = pd.DataFrame(game_pairs)
    print(f"  Created {len(df)} game pairs")
    return df


def calculate_four_factors(row, prefix):
    """
    Calculate Four Factors for a team.
    - eFG%: (FGM + 0.5 * FG3M) / FGA
    - TOV%: TOV / (FGA + 0.44 * FTA + TOV)
    - OREB%: OREB / (OREB + opponent DREB)  -- approximated
    - FTr: FTA / FGA
    """
    fgm = row[f"{prefix}_FGM"]
    fga = row[f"{prefix}_FGA"]
    fg3m = row[f"{prefix}_FG3M"]
    fta = row[f"{prefix}_FTA"]
    ftm = row[f"{prefix}_FTM"]
    tov = row[f"{prefix}_TOV"]
    oreb = row[f"{prefix}_OREB"]

    efg_pct = (fgm + 0.5 * fg3m) / fga if fga > 0 else 0
    tov_pct = tov / (fga + 0.44 * fta + tov) if (fga + 0.44 * fta + tov) > 0 else 0
    ftr = fta / fga if fga > 0 else 0

    return efg_pct, tov_pct, ftr


def calculate_rolling_stats(games: pd.DataFrame, team_id: int, game_date, n_games: int) -> dict:
    """
    Calculate rolling statistics for a team before a specific game.
    """
    # Get team's previous games
    team_home = games[(games["HOME_TEAM_ID"] == team_id) & (games["GAME_DATE"] < game_date)]
    team_away = games[(games["AWAY_TEAM_ID"] == team_id) & (games["GAME_DATE"] < game_date)]

    # Combine and sort
    team_games = []

    for _, row in team_home.iterrows():
        team_games.append({
            "date": row["GAME_DATE"],
            "pts": row["HOME_PTS"],
            "opp_pts": row["AWAY_PTS"],
            "win": row["HOME_WIN"],
            "fgm": row["HOME_FGM"], "fga": row["HOME_FGA"],
            "fg3m": row["HOME_FG3M"], "fta": row["HOME_FTA"],
            "tov": row["HOME_TOV"], "oreb": row["HOME_OREB"],
        })

    for _, row in team_away.iterrows():
        team_games.append({
            "date": row["GAME_DATE"],
            "pts": row["AWAY_PTS"],
            "opp_pts": row["HOME_PTS"],
            "win": 1 - row["HOME_WIN"],
            "fgm": row["AWAY_FGM"], "fga": row["AWAY_FGA"],
            "fg3m": row["AWAY_FG3M"], "fta": row["AWAY_FTA"],
            "tov": row["AWAY_TOV"], "oreb": row["AWAY_OREB"],
        })

    if not team_games:
        return None

    # Sort by date and take last n games
    team_games = sorted(team_games, key=lambda x: x["date"], reverse=True)[:n_games]

    if len(team_games) < 3:  # Need at least 3 games
        return None

    # Calculate stats
    pts = np.mean([g["pts"] for g in team_games])
    opp_pts = np.mean([g["opp_pts"] for g in team_games])
    win_pct = np.mean([g["win"] for g in team_games])

    # Approximate ratings (points per game as proxy)
    off_rating = pts
    def_rating = opp_pts
    net_rating = off_rating - def_rating

    # Four factors (approximate)
    fgm = np.mean([g["fgm"] for g in team_games])
    fga = np.mean([g["fga"] for g in team_games])
    fg3m = np.mean([g["fg3m"] for g in team_games])
    fta = np.mean([g["fta"] for g in team_games])
    tov = np.mean([g["tov"] for g in team_games])
    oreb = np.mean([g["oreb"] for g in team_games])

    efg_pct = (fgm + 0.5 * fg3m) / fga if fga > 0 else 0
    tov_pct = tov / (fga + 0.44 * fta + tov) if (fga + 0.44 * fta + tov) > 0 else 0
    ftr = fta / fga if fga > 0 else 0

    return {
        "win_pct": win_pct,
        "pts": pts,
        "opp_pts": opp_pts,
        "off_rating": off_rating,
        "def_rating": def_rating,
        "net_rating": net_rating,
        "efg_pct": efg_pct,
        "tov_pct": tov_pct,
        "ftr": ftr,
        "oreb": oreb,
        "games_played": len(team_games),
    }


def build_features(games: pd.DataFrame, team_stats: pd.DataFrame = None) -> pd.DataFrame:
    """
    Build feature matrix for ML training.

    Creates SYMMETRIC data: two rows per game.
    Uses DIFFERENCE features.
    """
    print("Building features...")

    # Sort games by date
    games = games.sort_values("GAME_DATE").reset_index(drop=True)

    features_list = []
    total_games = len(games)

    for idx, row in games.iterrows():
        if idx % 500 == 0:
            print(f"  Processing game {idx}/{total_games}...")

        game_date = row["GAME_DATE"]
        home_id = row["HOME_TEAM_ID"]
        away_id = row["AWAY_TEAM_ID"]

        # Calculate rolling stats for both teams
        home_stats_10 = calculate_rolling_stats(games, home_id, game_date, 10)
        away_stats_10 = calculate_rolling_stats(games, away_id, game_date, 10)
        home_stats_5 = calculate_rolling_stats(games, home_id, game_date, 5)
        away_stats_5 = calculate_rolling_stats(games, away_id, game_date, 5)

        # Skip if we don't have enough history
        if not all([home_stats_10, away_stats_10, home_stats_5, away_stats_5]):
            continue

        # Build feature dict for HOME TEAM perspective
        home_features = {
            "GAME_ID": row["GAME_ID"],
            "GAME_DATE": game_date,
            "SEASON": row["SEASON"],
            "TEAM_ID": home_id,
            "OPP_ID": away_id,
            "IS_HOME": 1,

            # TARGET
            "WIN": row["HOME_WIN"],

            # ===== DIFFERENCE FEATURES (TEAM - OPPONENT) =====
            # These are KEY for model performance

            # Win % difference
            "WIN_PCT_DIFF_10": home_stats_10["win_pct"] - away_stats_10["win_pct"],
            "WIN_PCT_DIFF_5": home_stats_5["win_pct"] - away_stats_5["win_pct"],

            # Net Rating difference (most important!)
            "NET_RATING_DIFF_10": home_stats_10["net_rating"] - away_stats_10["net_rating"],
            "NET_RATING_DIFF_5": home_stats_5["net_rating"] - away_stats_5["net_rating"],

            # Offensive Rating difference
            "OFF_RATING_DIFF_10": home_stats_10["off_rating"] - away_stats_10["off_rating"],
            "OFF_RATING_DIFF_5": home_stats_5["off_rating"] - away_stats_5["off_rating"],

            # Defensive Rating difference (lower is better, so flip sign)
            "DEF_RATING_DIFF_10": away_stats_10["def_rating"] - home_stats_10["def_rating"],
            "DEF_RATING_DIFF_5": away_stats_5["def_rating"] - home_stats_5["def_rating"],

            # Four Factors differences
            "EFG_PCT_DIFF_10": home_stats_10["efg_pct"] - away_stats_10["efg_pct"],
            "EFG_PCT_DIFF_5": home_stats_5["efg_pct"] - away_stats_5["efg_pct"],

            "TOV_PCT_DIFF_10": away_stats_10["tov_pct"] - home_stats_10["tov_pct"],  # Lower is better
            "TOV_PCT_DIFF_5": away_stats_5["tov_pct"] - home_stats_5["tov_pct"],

            "FTR_DIFF_10": home_stats_10["ftr"] - away_stats_10["ftr"],
            "FTR_DIFF_5": home_stats_5["ftr"] - away_stats_5["ftr"],

            "OREB_DIFF_10": home_stats_10["oreb"] - away_stats_10["oreb"],
            "OREB_DIFF_5": home_stats_5["oreb"] - away_stats_5["oreb"],

            # ===== ABSOLUTE FEATURES (for context) =====
            "HOME_WIN_PCT_10": home_stats_10["win_pct"],
            "HOME_NET_RATING_10": home_stats_10["net_rating"],
            "AWAY_WIN_PCT_10": away_stats_10["win_pct"],
            "AWAY_NET_RATING_10": away_stats_10["net_rating"],
        }

        features_list.append(home_features)

        # Build feature dict for AWAY TEAM perspective (symmetric)
        away_features = {
            "GAME_ID": row["GAME_ID"],
            "GAME_DATE": game_date,
            "SEASON": row["SEASON"],
            "TEAM_ID": away_id,
            "OPP_ID": home_id,
            "IS_HOME": 0,

            # TARGET (flipped)
            "WIN": 1 - row["HOME_WIN"],

            # ===== DIFFERENCE FEATURES (flipped) =====
            "WIN_PCT_DIFF_10": away_stats_10["win_pct"] - home_stats_10["win_pct"],
            "WIN_PCT_DIFF_5": away_stats_5["win_pct"] - home_stats_5["win_pct"],

            "NET_RATING_DIFF_10": away_stats_10["net_rating"] - home_stats_10["net_rating"],
            "NET_RATING_DIFF_5": away_stats_5["net_rating"] - home_stats_5["net_rating"],

            "OFF_RATING_DIFF_10": away_stats_10["off_rating"] - home_stats_10["off_rating"],
            "OFF_RATING_DIFF_5": away_stats_5["off_rating"] - home_stats_5["off_rating"],

            "DEF_RATING_DIFF_10": home_stats_10["def_rating"] - away_stats_10["def_rating"],
            "DEF_RATING_DIFF_5": home_stats_5["def_rating"] - away_stats_5["def_rating"],

            "EFG_PCT_DIFF_10": away_stats_10["efg_pct"] - home_stats_10["efg_pct"],
            "EFG_PCT_DIFF_5": away_stats_5["efg_pct"] - home_stats_5["efg_pct"],

            "TOV_PCT_DIFF_10": home_stats_10["tov_pct"] - away_stats_10["tov_pct"],
            "TOV_PCT_DIFF_5": home_stats_5["tov_pct"] - away_stats_5["tov_pct"],

            "FTR_DIFF_10": away_stats_10["ftr"] - home_stats_10["ftr"],
            "FTR_DIFF_5": away_stats_5["ftr"] - home_stats_5["ftr"],

            "OREB_DIFF_10": away_stats_10["oreb"] - home_stats_10["oreb"],
            "OREB_DIFF_5": away_stats_5["oreb"] - home_stats_5["oreb"],

            # Absolute features (flipped perspective)
            "HOME_WIN_PCT_10": away_stats_10["win_pct"],
            "HOME_NET_RATING_10": away_stats_10["net_rating"],
            "AWAY_WIN_PCT_10": home_stats_10["win_pct"],
            "AWAY_NET_RATING_10": home_stats_10["net_rating"],
        }

        features_list.append(away_features)

    features_df = pd.DataFrame(features_list)
    print(f"  Built {len(features_df)} feature rows ({len(features_df)//2} games)")

    return features_df


def create_train_val_test_split(features: pd.DataFrame) -> tuple:
    """
    Time-based split (NOT random - prevents data leakage).

    Train: 2015-16 to 2021-22 (7 seasons)
    Validation: 2022-23 (1 season)
    Test: 2023-24 to 2024-25 (2 seasons)
    """
    print("Creating time-based train/val/test split...")

    train_seasons = ["2015-16", "2016-17", "2017-18", "2018-19", "2019-20", "2020-21", "2021-22"]
    val_seasons = ["2022-23"]
    test_seasons = ["2023-24", "2024-25"]

    train = features[features["SEASON"].isin(train_seasons)]
    val = features[features["SEASON"].isin(val_seasons)]
    test = features[features["SEASON"].isin(test_seasons)]

    print(f"  Train: {len(train)} rows ({len(train)//2} games) - seasons {train_seasons[0]} to {train_seasons[-1]}")
    print(f"  Val:   {len(val)} rows ({len(val)//2} games) - season {val_seasons[0]}")
    print(f"  Test:  {len(test)} rows ({len(test)//2} games) - seasons {test_seasons[0]} to {test_seasons[-1]}")

    return train, val, test


def main():
    """Main feature engineering pipeline."""
    print("=" * 60)
    print("Feature Engineering Pipeline")
    print("=" * 60)

    # Load raw data
    games, team_stats = load_raw_data()

    # Create game pairs
    game_pairs = create_game_pairs(games)

    # Build features
    features = build_features(game_pairs, team_stats)

    # Create splits
    train, val, test = create_train_val_test_split(features)

    # Save processed data
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    features.to_csv(PROCESSED_DIR / "all_features.csv", index=False)
    train.to_csv(PROCESSED_DIR / "train.csv", index=False)
    val.to_csv(PROCESSED_DIR / "val.csv", index=False)
    test.to_csv(PROCESSED_DIR / "test.csv", index=False)

    print("\n" + "=" * 60)
    print("Feature engineering complete!")
    print(f"Saved to: {PROCESSED_DIR}")
    print("=" * 60)

    # Print feature summary
    feature_cols = [c for c in features.columns if c not in
                    ["GAME_ID", "GAME_DATE", "SEASON", "TEAM_ID", "OPP_ID", "WIN"]]
    print(f"\nFeatures ({len(feature_cols)}):")
    for col in feature_cols:
        print(f"  - {col}")


if __name__ == "__main__":
    main()
