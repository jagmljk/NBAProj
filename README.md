# NBA Game Predictor

A full-stack web app that predicts NBA game outcomes using machine learning. Features real-time standings, live scores, team analytics, and an interactive prediction engine.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?logo=fastapi)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

## Quick Start

```bash
# Start both servers
cd nba-predictor && start.bat

# Or manually:
# Backend: http://localhost:8001
# Frontend: http://localhost:5173
```

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** primitives (Dialog, Select, Popover, Tabs, etc.)
- **TanStack Query** for server state management
- **Zustand** for client state
- **Framer Motion** for animations
- **Recharts** for data visualization
- **Vite** for development/bundling

### Backend
- **FastAPI** (Python) REST API
- **NBA API** integration for live data
- **XGBoost / LightGBM** ensemble for ML predictions
- **SQLite** for prediction storage & validation
- **Pydantic** for data validation

## Features

### Core Functionality
- **Game Predictions**: Select any two NBA teams and get win probability predictions with confidence tiers
- **Live Standings**: Real-time conference standings pulled from the NBA API
- **Today's Games**: Live scoreboard with game status and predictions
- **Team Analytics**: Detailed stats, recent form, and performance trends
- **Head-to-Head**: Historical matchup data between teams

### Analytics Dashboard
- Model performance metrics (accuracy, AUC, precision, recall)
- Feature importance visualization
- Confidence tier analysis
- Model calibration curves
- Upset watch for underdog opportunities
- Prediction validation against actual results

### Technical Highlights
- **Type-safe end-to-end**: TypeScript frontend + Pydantic backend
- **Responsive design**: Mobile-first with Tailwind
- **Optimistic UI**: TanStack Query for smooth data fetching
- **Component architecture**: Reusable UI primitives with Radix
- **Smart caching**: Rate limit friendly with intelligent cache invalidation

## Project Structure

```
nbaprojv2/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/           # Base components (Card, Button, etc.)
│   │   │   ├── prediction/   # Prediction-specific components
│   │   │   ├── charts/       # Data visualization
│   │   │   └── layout/       # App layout components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client
│   │   ├── store/            # Zustand state
│   │   └── types/            # TypeScript definitions
│   └── package.json
│
└── nba-predictor/
    └── backend/
        ├── app/
        │   ├── api/v1/routers/   # API endpoints
        │   ├── services/         # Business logic
        │   └── main.py           # FastAPI app
        ├── ml/scripts/           # ML training pipeline
        └── requirements.txt
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Health check with component status |
| `GET /api/v1/live/standings` | Conference standings |
| `GET /api/v1/live/scoreboard` | Today's games |
| `GET /api/v1/teams` | All NBA teams |
| `GET /api/v1/teams/:id` | Team details with stats |
| `GET /api/v1/teams/:id/vs/:opponent` | Head-to-head data |
| `POST /api/v1/predict` | Generate prediction |
| `GET /api/v1/predict/today` | Today's predictions |
| `GET /api/v1/analytics/trends` | Team trends |
| `GET /api/v1/analytics/validate` | Validate predictions |

## Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Setup

```bash
# Backend
cd nba-predictor/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8001

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:8001
```

## How It Works

The prediction model is trained on 27,000+ historical NBA games. It uses an ensemble of XGBoost and LightGBM classifiers, analyzing factors like:

- Recent team performance (last 10 games)
- Home court advantage
- Head-to-head history
- Offensive/defensive ratings
- Rest days between games

The model achieves ~65% accuracy on test data, which beats the baseline of picking the home team every time (~58%).

## Things I Learned Building This

- **Full-stack TypeScript** - Having types flow from API to UI catches so many bugs before they happen
- **Radix UI** - Building accessible components from primitives is way better than fighting against opinionated component libraries
- **TanStack Query** - Server state and client state are fundamentally different, and treating them separately makes everything cleaner
- **ML calibration** - A model can have good accuracy but terrible probability estimates. Calibration matters.
- **Rate limiting** - External APIs will throttle you. Caching isn't optional, it's essential.

## Screenshots

Dark theme with NBA-inspired colors:

- **Home**: Quick predict widget, today's games, trending teams
- **Predict**: Team selectors, probability meter, key factors
- **Analytics**: Model metrics, feature importance, calibration curves
- **Standings**: Conference tables with playoff positioning

---

Built as a portfolio project to explore full-stack development with real-time sports data and machine learning.
