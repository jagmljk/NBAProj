# NBA Game Predictor

A machine learning-powered NBA game prediction system using live data from the NBA API.

## Project Structure

```
nba-predictor/
├── backend/
│   ├── data/
│   │   ├── raw/              # Raw API responses
│   │   ├── processed/        # Processed features
│   │   └── cache/            # API response cache
│   ├── models/
│   │   ├── trained/          # Saved models
│   │   └── configs/          # Model hyperparameters
│   ├── scripts/
│   │   ├── collect_data.py   # Fetch from NBA API
│   │   ├── build_features.py # Feature engineering
│   │   ├── train_models.py   # Model training
│   │   └── evaluate.py       # Model evaluation
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── routers/          # API routes
│   │   ├── services/         # Business logic
│   │   ├── models/           # Pydantic schemas
│   │   └── core/             # Config, utils
│   └── requirements.txt
├── frontend/
│   └── (React/Vite app)
└── README.md
```

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env as needed
```

### 3. Collect Data

```bash
# Collect current season only (fast)
python scripts/collect_data.py --current-only

# Collect all historical data (2015-2024)
python scripts/collect_data.py --all-historical

# Collect specific seasons
python scripts/collect_data.py --seasons 2023-24 2024-25
```

## Data Collection

The data collection script fetches:

- **Game Data**: Historical and current games with box scores
- **Team Stats**: Season averages, advanced metrics (ORTG, DRTG, Net Rating)
- **Player Stats**: Per-game averages for all players
- **Scheduling**: Rest days, back-to-backs, road trip length
- **Today's Games**: Current day's schedule for predictions

### Rate Limiting

The NBA API has rate limits. The collector uses:
- 1 second delay between API calls
- File-based caching (24-hour TTL)
- Resume capability if interrupted

### Output Files

| File | Description |
|------|-------------|
| `all_games.csv` | All games from 2015-2024 |
| `all_games_with_schedule.csv` | Games with scheduling features |
| `all_team_stats.csv` | Team stats by season |
| `all_team_advanced.csv` | Advanced team metrics |
| `all_player_stats.csv` | Player stats by season |
| `standings_YYYY_YY.csv` | Standings for each season |

## Features for Prediction

### Team Features (54+ columns)
- Win/Loss record, Win percentage
- Points, Rebounds, Assists
- Field Goal %, 3P%, FT%
- Offensive/Defensive Rating
- Net Rating, Pace

### Scheduling Features
- REST_DAYS: Days since last game
- IS_BACK_TO_BACK: Second game in 2 days
- ROAD_TRIP_LENGTH: Consecutive away games
- IS_HOME: Home court advantage

## API Usage

```python
from app.services import NBAApiService

api = NBAApiService(cache_dir="./data/cache")

# Get today's games
games = api.get_todays_games()

# Get team stats
stats = api.get_team_stats(season="2024-25")

# Get team game log
log = api.get_team_game_log(team_id=1610612747, season="2024-25")  # Lakers
```
