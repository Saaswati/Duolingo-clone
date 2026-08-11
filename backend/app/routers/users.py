"""Learner identity, stats, profile and the mocked heart refill."""
from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.config import MAX_HEARTS
from app.database import get_db
from app.deps import get_current_user, get_today
from app.schemas import (
    AchievementOut,
    DayActivityOut,
    ProfileOut,
    StatsOut,
    UserOut,
    UserUpdate,
)
from app.services import gamification as g

router = APIRouter(tags=["learner"])


def serialise_user(db: Session, user: models.User, today: date) -> UserOut:
    """Single place where a user turns into JSON, so hearts are always synced
    before anyone sees them."""
    g.sync_hearts(user.stats)
    db.commit()
    return UserOut(
        id=user.id,
        username=user.username,
        display_name=user.display_name,
        avatar_emoji=user.avatar_emoji,
        stats=StatsOut(
            active_course_id=user.stats.active_course_id,
            total_xp=user.stats.total_xp,
            gems=user.stats.gems,
            hearts=user.stats.hearts,
            max_hearts=MAX_HEARTS,
            seconds_to_next_heart=g.seconds_to_next_heart(user.stats),
            streak_count=user.stats.streak_count,
            longest_streak=user.stats.longest_streak,
            daily_goal_xp=g.daily_goal_xp(user.stats),
            xp_today=g.xp_today(db, user.id, today),
            last_activity_date=user.stats.last_activity_date,
        ),
    )


@router.get("/me", response_model=UserOut)
def read_me(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    today: date = Depends(get_today),
):
    return serialise_user(db, user, today)


@router.patch("/me", response_model=UserOut)
def update_me(
    body: UserUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    today: date = Depends(get_today),
):
    """Edit the learner's own profile.

    Only three fields are editable, and the schema enforces that: a display
    name, an avatar, and the daily XP goal. XP, hearts and streak are earned
    rather than set, so they are deliberately not part of UserUpdate - the
    endpoint cannot be used to award yourself a streak.

    Fields left as None are untouched, so the client can send one change
    without resending the whole profile.
    """
    if body.display_name is not None:
        user.display_name = body.display_name.strip()
    if body.avatar_emoji is not None:
        user.avatar_emoji = body.avatar_emoji
    if body.daily_goal_xp is not None:
        user.stats.daily_goal_xp = body.daily_goal_xp

    db.commit()
    return serialise_user(db, user, today)


@router.post("/hearts/refill", response_model=UserOut)
def refill(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    today: date = Depends(get_today),
):
    """Mocked practice/refill. In the real product this costs gems or requires
    a practice session; here it is immediate so the lesson loop stays
    demonstrable."""
    g.refill_hearts(user.stats)
    db.commit()
    return serialise_user(db, user, today)


@router.get("/profile", response_model=ProfileOut)
def read_profile(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    today: date = Depends(get_today),
):
    unlocked = {
        ua.achievement_id: ua.unlocked_at
        for ua in db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == user.id)
        .all()
    }

    achievements = [
        AchievementOut(
            code=a.code,
            title=a.title,
            description=a.description,
            icon=a.icon,
            threshold=a.threshold,
            progress=min(g.current_metric(db, user, a.metric), a.threshold),
            unlocked=a.id in unlocked,
            unlocked_at=unlocked.get(a.id),
        )
        for a in db.query(models.Achievement).order_by(models.Achievement.threshold).all()
    ]

    window_start = today - timedelta(days=6)
    days = (
        db.query(models.DailyActivity)
        .filter(
            models.DailyActivity.user_id == user.id,
            models.DailyActivity.activity_date >= window_start,
        )
        .order_by(models.DailyActivity.activity_date)
        .all()
    )
    by_date = {d.activity_date: d.xp_earned for d in days}

    return ProfileOut(
        user=serialise_user(db, user, today),
        lessons_completed=g.current_metric(db, user, "lessons"),
        crowns=g.current_metric(db, user, "crowns"),
        achievements=achievements,
        recent_days=[
            DayActivityOut(
                activity_date=window_start + timedelta(days=i),
                xp_earned=by_date.get(window_start + timedelta(days=i), 0),
            )
            for i in range(7)
        ],
    )
