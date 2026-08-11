"""Application-wide constants and settings.

Everything tunable lives here so the gamification rules are readable in one
place instead of being scattered as magic numbers across the services.
"""
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./duolingo.db")

# CORS: comma-separated list of allowed frontend origins.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

# Reseed the database automatically on startup. Enabled in hosted demos where
# the filesystem is ephemeral (see ASSUMPTIONS.md).
SEED_ON_STARTUP = os.getenv("SEED_ON_STARTUP", "false").lower() == "true"

# --- Gamification rules -----------------------------------------------------
MAX_HEARTS = 5
HEART_REGEN_MINUTES = 30       # one heart back every 30 minutes
DEFAULT_DAILY_GOAL_XP = 50
XP_PER_LESSON = 10
XP_PERFECT_LESSON_BONUS = 5    # awarded when no hearts were lost
LESSONS_PER_CROWN = 1          # completing a skill's lessons raises its crown
MAX_CROWNS = 5
