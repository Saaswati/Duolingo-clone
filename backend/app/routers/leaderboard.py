"""Weekly leaderboard.

Seeded rivals hold static XP (see ASSUMPTIONS.md), but the ranking itself is
computed live from user_stats, so the signed-in learner genuinely climbs it.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.deps import get_current_user
from app.schemas import LeaderboardEntry

router = APIRouter(tags=["leaderboard"])


@router.get("/leaderboard", response_model=list[LeaderboardEntry])
def read_leaderboard(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = (
        db.query(models.User, models.UserStats)
        .join(models.UserStats, models.User.id == models.UserStats.user_id)
        .order_by(models.UserStats.total_xp.desc(), models.User.display_name)
        .all()
    )
    return [
        LeaderboardEntry(
            rank=index + 1,
            user_id=u.id,
            display_name=u.display_name,
            avatar_emoji=u.avatar_emoji,
            total_xp=s.total_xp,
            is_current_user=u.id == user.id,
        )
        for index, (u, s) in enumerate(rows)
    ]
