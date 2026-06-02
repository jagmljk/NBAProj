"""
Fallback static data for when NBA API is blocked (cloud deployments).
"""

FALLBACK_STANDINGS = {
    "eastern": [
        {"team_id": 1610612739, "team_name": "Cleveland Cavaliers", "team_abbreviation": "CLE", "conference": "East", "division": "Central", "conference_rank": 1, "wins": 64, "losses": 18, "win_pct": 0.780, "games_back": 0.0, "home_record": "35-6", "road_record": "29-12", "last_10": "8-2", "streak": "W3"},
        {"team_id": 1610612738, "team_name": "Boston Celtics", "team_abbreviation": "BOS", "conference": "East", "division": "Atlantic", "conference_rank": 2, "wins": 61, "losses": 21, "win_pct": 0.744, "games_back": 3.0, "home_record": "33-8", "road_record": "28-13", "last_10": "7-3", "streak": "W1"},
        {"team_id": 1610612752, "team_name": "New York Knicks", "team_abbreviation": "NYK", "conference": "East", "division": "Atlantic", "conference_rank": 3, "wins": 52, "losses": 30, "win_pct": 0.634, "games_back": 12.0, "home_record": "29-12", "road_record": "23-18", "last_10": "6-4", "streak": "L1"},
        {"team_id": 1610612748, "team_name": "Miami Heat", "team_abbreviation": "MIA", "conference": "East", "division": "Southeast", "conference_rank": 4, "wins": 49, "losses": 33, "win_pct": 0.598, "games_back": 15.0, "home_record": "28-13", "road_record": "21-20", "last_10": "5-5", "streak": "W2"},
        {"team_id": 1610612749, "team_name": "Milwaukee Bucks", "team_abbreviation": "MIL", "conference": "East", "division": "Central", "conference_rank": 5, "wins": 48, "losses": 34, "win_pct": 0.585, "games_back": 16.0, "home_record": "27-14", "road_record": "21-20", "last_10": "6-4", "streak": "W1"},
        {"team_id": 1610612753, "team_name": "Orlando Magic", "team_abbreviation": "ORL", "conference": "East", "division": "Southeast", "conference_rank": 6, "wins": 47, "losses": 35, "win_pct": 0.573, "games_back": 17.0, "home_record": "26-15", "road_record": "21-20", "last_10": "4-6", "streak": "L2"},
        {"team_id": 1610612754, "team_name": "Indiana Pacers", "team_abbreviation": "IND", "conference": "East", "division": "Central", "conference_rank": 7, "wins": 45, "losses": 37, "win_pct": 0.549, "games_back": 19.0, "home_record": "25-16", "road_record": "20-21", "last_10": "5-5", "streak": "W1"},
        {"team_id": 1610612765, "team_name": "Detroit Pistons", "team_abbreviation": "DET", "conference": "East", "division": "Central", "conference_rank": 8, "wins": 44, "losses": 38, "win_pct": 0.537, "games_back": 20.0, "home_record": "24-17", "road_record": "20-21", "last_10": "6-4", "streak": "W2"},
        {"team_id": 1610612737, "team_name": "Atlanta Hawks", "team_abbreviation": "ATL", "conference": "East", "division": "Southeast", "conference_rank": 9, "wins": 42, "losses": 40, "win_pct": 0.512, "games_back": 22.0, "home_record": "23-18", "road_record": "19-22", "last_10": "4-6", "streak": "L1"},
        {"team_id": 1610612751, "team_name": "Brooklyn Nets", "team_abbreviation": "BKN", "conference": "East", "division": "Atlantic", "conference_rank": 10, "wins": 36, "losses": 46, "win_pct": 0.439, "games_back": 28.0, "home_record": "20-21", "road_record": "16-25", "last_10": "3-7", "streak": "L3"},
        {"team_id": 1610612741, "team_name": "Chicago Bulls", "team_abbreviation": "CHI", "conference": "East", "division": "Central", "conference_rank": 11, "wins": 34, "losses": 48, "win_pct": 0.415, "games_back": 30.0, "home_record": "19-22", "road_record": "15-26", "last_10": "4-6", "streak": "L1"},
        {"team_id": 1610612755, "team_name": "Philadelphia 76ers", "team_abbreviation": "PHI", "conference": "East", "division": "Atlantic", "conference_rank": 12, "wins": 31, "losses": 51, "win_pct": 0.378, "games_back": 33.0, "home_record": "18-23", "road_record": "13-28", "last_10": "3-7", "streak": "L2"},
        {"team_id": 1610612764, "team_name": "Washington Wizards", "team_abbreviation": "WAS", "conference": "East", "division": "Southeast", "conference_rank": 13, "wins": 25, "losses": 57, "win_pct": 0.305, "games_back": 39.0, "home_record": "15-26", "road_record": "10-31", "last_10": "2-8", "streak": "L4"},
        {"team_id": 1610612761, "team_name": "Toronto Raptors", "team_abbreviation": "TOR", "conference": "East", "division": "Atlantic", "conference_rank": 14, "wins": 23, "losses": 59, "win_pct": 0.280, "games_back": 41.0, "home_record": "14-27", "road_record": "9-32", "last_10": "2-8", "streak": "L5"},
        {"team_id": 1610612766, "team_name": "Charlotte Hornets", "team_abbreviation": "CHA", "conference": "East", "division": "Southeast", "conference_rank": 15, "wins": 21, "losses": 61, "win_pct": 0.256, "games_back": 43.0, "home_record": "12-29", "road_record": "9-32", "last_10": "1-9", "streak": "L6"},
    ],
    "western": [
        {"team_id": 1610612760, "team_name": "Oklahoma City Thunder", "team_abbreviation": "OKC", "conference": "West", "division": "Northwest", "conference_rank": 1, "wins": 68, "losses": 14, "win_pct": 0.829, "games_back": 0.0, "home_record": "36-5", "road_record": "32-9", "last_10": "9-1", "streak": "W6"},
        {"team_id": 1610612745, "team_name": "Houston Rockets", "team_abbreviation": "HOU", "conference": "West", "division": "Southwest", "conference_rank": 2, "wins": 52, "losses": 30, "win_pct": 0.634, "games_back": 16.0, "home_record": "29-12", "road_record": "23-18", "last_10": "7-3", "streak": "W2"},
        {"team_id": 1610612747, "team_name": "Los Angeles Lakers", "team_abbreviation": "LAL", "conference": "West", "division": "Pacific", "conference_rank": 3, "wins": 50, "losses": 32, "win_pct": 0.610, "games_back": 18.0, "home_record": "28-13", "road_record": "22-19", "last_10": "6-4", "streak": "W1"},
        {"team_id": 1610612743, "team_name": "Denver Nuggets", "team_abbreviation": "DEN", "conference": "West", "division": "Northwest", "conference_rank": 4, "wins": 50, "losses": 32, "win_pct": 0.610, "games_back": 18.0, "home_record": "30-11", "road_record": "20-21", "last_10": "5-5", "streak": "L1"},
        {"team_id": 1610612750, "team_name": "Minnesota Timberwolves", "team_abbreviation": "MIN", "conference": "West", "division": "Northwest", "conference_rank": 5, "wins": 49, "losses": 33, "win_pct": 0.598, "games_back": 19.0, "home_record": "27-14", "road_record": "22-19", "last_10": "6-4", "streak": "W1"},
        {"team_id": 1610612746, "team_name": "LA Clippers", "team_abbreviation": "LAC", "conference": "West", "division": "Pacific", "conference_rank": 6, "wins": 47, "losses": 35, "win_pct": 0.573, "games_back": 21.0, "home_record": "25-16", "road_record": "22-19", "last_10": "5-5", "streak": "W1"},
        {"team_id": 1610612744, "team_name": "Golden State Warriors", "team_abbreviation": "GSW", "conference": "West", "division": "Pacific", "conference_rank": 7, "wins": 46, "losses": 36, "win_pct": 0.561, "games_back": 22.0, "home_record": "26-15", "road_record": "20-21", "last_10": "4-6", "streak": "L2"},
        {"team_id": 1610612763, "team_name": "Memphis Grizzlies", "team_abbreviation": "MEM", "conference": "West", "division": "Southwest", "conference_rank": 8, "wins": 45, "losses": 37, "win_pct": 0.549, "games_back": 23.0, "home_record": "25-16", "road_record": "20-21", "last_10": "5-5", "streak": "W1"},
        {"team_id": 1610612759, "team_name": "San Antonio Spurs", "team_abbreviation": "SAS", "conference": "West", "division": "Southwest", "conference_rank": 9, "wins": 42, "losses": 40, "win_pct": 0.512, "games_back": 26.0, "home_record": "23-18", "road_record": "19-22", "last_10": "6-4", "streak": "W2"},
        {"team_id": 1610612742, "team_name": "Dallas Mavericks", "team_abbreviation": "DAL", "conference": "West", "division": "Southwest", "conference_rank": 10, "wins": 41, "losses": 41, "win_pct": 0.500, "games_back": 27.0, "home_record": "22-19", "road_record": "19-22", "last_10": "4-6", "streak": "L1"},
        {"team_id": 1610612756, "team_name": "Phoenix Suns", "team_abbreviation": "PHX", "conference": "West", "division": "Pacific", "conference_rank": 11, "wins": 40, "losses": 42, "win_pct": 0.488, "games_back": 28.0, "home_record": "22-19", "road_record": "18-23", "last_10": "3-7", "streak": "L3"},
        {"team_id": 1610612757, "team_name": "Portland Trail Blazers", "team_abbreviation": "POR", "conference": "West", "division": "Northwest", "conference_rank": 12, "wins": 31, "losses": 51, "win_pct": 0.378, "games_back": 37.0, "home_record": "18-23", "road_record": "13-28", "last_10": "3-7", "streak": "L2"},
        {"team_id": 1610612762, "team_name": "Utah Jazz", "team_abbreviation": "UTA", "conference": "West", "division": "Northwest", "conference_rank": 13, "wins": 29, "losses": 53, "win_pct": 0.354, "games_back": 39.0, "home_record": "17-24", "road_record": "12-29", "last_10": "2-8", "streak": "L4"},
        {"team_id": 1610612740, "team_name": "New Orleans Pelicans", "team_abbreviation": "NOP", "conference": "West", "division": "Southwest", "conference_rank": 14, "wins": 25, "losses": 57, "win_pct": 0.305, "games_back": 43.0, "home_record": "15-26", "road_record": "10-31", "last_10": "2-8", "streak": "L5"},
        {"team_id": 1610612758, "team_name": "Sacramento Kings", "team_abbreviation": "SAC", "conference": "West", "division": "Pacific", "conference_rank": 15, "wins": 24, "losses": 58, "win_pct": 0.293, "games_back": 44.0, "home_record": "14-27", "road_record": "10-31", "last_10": "1-9", "streak": "L7"},
    ]
}

FALLBACK_SCOREBOARD = {
    "date": "2026-06-01",
    "games": [],
    "games_in_progress": 0,
    "games_completed": 0,
    "games_scheduled": 0,
    "message": "No games scheduled today (offseason)"
}

def get_fallback_standings():
    """Return fallback standings data."""
    return FALLBACK_STANDINGS

def get_fallback_scoreboard(date: str):
    """Return fallback scoreboard data."""
    return {
        "date": date,
        "games": [],
        "games_in_progress": 0,
        "games_completed": 0,
        "games_scheduled": 0,
        "message": "Live data temporarily unavailable"
    }
