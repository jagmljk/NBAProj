"""
NBA Predictor API - Clean Rebuild
Starting with standings functionality.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.api.v1.routers import standings, teams, predictions, analytics
from app.database import init_db

app = FastAPI(
    title="NBA Predictor API",
    description="NBA game predictions and statistics",
    version="2.0.0",
)

# CORS - allow all origins for public API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    init_db()

# Include routers
app.include_router(standings.router, prefix="/api/v1/live", tags=["Live Data"])
app.include_router(teams.router, prefix="/api/v1/teams", tags=["Teams"])
app.include_router(predictions.router, prefix="/api/v1/predict", tags=["Predictions"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "components": {
            "api": "ok",
            "standings": "ok",
            "teams": "ok",
            "predictions": "ok",
            "scoreboard": "ok",
            "analytics": "ok",
        }
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "NBA Predictor API v2.0",
        "docs": "/docs",
        "health": "/health",
    }
