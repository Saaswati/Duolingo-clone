"""Shared FastAPI dependencies: who is asking, and what day is it.

Both questions are answered by a dependency rather than read inline, which is
what lets authentication be swapped in later by editing one function instead
of every endpoint.
"""
from datetime import date, datetime

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

DEFAULT_USER_ID = 1


def get_current_user(
    db: Session = Depends(get_db),
    x_user_id: int | None = Header(default=None, alias="X-User-Id"),
) -> models.User:
    """Resolve the acting learner.

    The brief allows a default logged-in learner, so identity comes from an
    optional header and falls back to the seeded user. Every endpoint takes
    the user as a parameter, so replacing this with a real session lookup is a
    change to this function alone.
    """
    user_id = x_user_id or DEFAULT_USER_ID
    user = db.get(models.User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Learner not found")
    return user


def get_today(
    x_simulated_date: str | None = Header(default=None, alias="X-Simulated-Date"),
) -> date:
    """Today's date, overridable in development.

    Streak logic that can only be exercised by waiting until tomorrow is
    logic that never gets tested. Passing X-Simulated-Date: 2026-03-14 lets a
    reviewer watch a streak build, break and reset in a few seconds.
    """
    if x_simulated_date:
        try:
            return datetime.strptime(x_simulated_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="X-Simulated-Date must be formatted YYYY-MM-DD",
            )
    return date.today()
