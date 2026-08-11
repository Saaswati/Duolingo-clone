"""Hearts, streaks, XP and achievements.

All the rules that make this feel like a game rather than a quiz live here,
away from the HTTP layer, so they can be reasoned about (and unit-tested)
on their own.
"""
from datetime import date, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.config import DEFAULT_DAILY_GOAL_XP, HEART_REGEN_MINUTES, MAX_HEARTS


# --------------------------------------------------------------------------
# Hearts
# --------------------------------------------------------------------------
def sync_hearts(stats: models.UserStats, now: datetime | None = None) -> models.UserStats:
    """Bring a user's hearts up to date, lazily.

    Rather than running a scheduled job that ticks every user's hearts every
    thirty minutes, we store the moment hearts last changed and derive the
    current value whenever they are read. Two benefits: there is no background
    worker to deploy, and regeneration stays correct even if the server was
    asleep for a day - which is exactly what happens on free hosting tiers.
    """
    now = now or datetime.utcnow()
    if stats.hearts >= MAX_HEARTS:
        # Already full: keep the timestamp fresh so the next loss starts the
        # clock from now rather than from some point in the distant past.
        stats.hearts_updated_at = now
        return stats

    elapsed_minutes = (now - stats.hearts_updated_at).total_seconds() / 60
    regenerated = int(elapsed_minutes // HEART_REGEN_MINUTES)
    if regenerated > 0:
        stats.hearts = min(MAX_HEARTS, stats.hearts + regenerated)
        # Advance the clock by exactly the hearts granted, so the remainder of
        # the current interval is not thrown away.
        stats.hearts_updated_at = stats.hearts_updated_at + timedelta(
            minutes=regenerated * HEART_REGEN_MINUTES
        )
        if stats.hearts >= MAX_HEARTS:
            stats.hearts_updated_at = now
    return stats


def seconds_to_next_heart(stats: models.UserStats, now: datetime | None = None) -> int | None:
    """Countdown shown in the out-of-hearts modal. None when hearts are full."""
    if stats.hearts >= MAX_HEARTS:
        return None
    now = now or datetime.utcnow()
    next_at = stats.hearts_updated_at + timedelta(minutes=HEART_REGEN_MINUTES)
    return max(0, int((next_at - now).total_seconds()))


def lose_heart(stats: models.UserStats, now: datetime | None = None) -> models.UserStats:
    now = now or datetime.utcnow()
    sync_hearts(stats, now)
    if stats.hearts == MAX_HEARTS:
        # Losing the first heart starts the regeneration clock.
        stats.hearts_updated_at = now
    stats.hearts = max(0, stats.hearts - 1)
    return stats


def refill_hearts(stats: models.UserStats, now: datetime | None = None) -> models.UserStats:
    """Mocked 'practice to refill'. The real app makes you earn this."""
    stats.hearts = MAX_HEARTS
    stats.hearts_updated_at = now or datetime.utcnow()
    return stats


# --------------------------------------------------------------------------
# Streak
# --------------------------------------------------------------------------
def register_activity(stats: models.UserStats, today: date) -> bool:
    """Update the streak for a day on which the user completed a lesson.

    Returns True if the streak grew (used to trigger the celebration).

    Streaks compare dates, never timestamps: 23:59 and 00:01 are different
    days regardless of how few minutes separate them. `today` is injected by
    the caller rather than read from the clock here, which is what makes the
    whole rule testable in one second instead of over three days.
    """
    previous = stats.last_activity_date

    if previous == today:
        extended = False                      # already counted today
    elif previous == today - timedelta(days=1):
        stats.streak_count += 1               # consecutive day
        extended = True
    else:
        stats.streak_count = 1                # first day, or streak broken
        extended = True

    stats.last_activity_date = today
    stats.longest_streak = max(stats.longest_streak, stats.streak_count)
    return extended


def get_or_create_day(db: Session, user_id: int, day: date) -> models.DailyActivity:
    row = db.scalar(
        select(models.DailyActivity).where(
            models.DailyActivity.user_id == user_id,
            models.DailyActivity.activity_date == day,
        )
    )
    if row is None:
        row = models.DailyActivity(user_id=user_id, activity_date=day, xp_earned=0)
        db.add(row)
        db.flush()
    return row


def xp_today(db: Session, user_id: int, day: date) -> int:
    row = db.scalar(
        select(models.DailyActivity).where(
            models.DailyActivity.user_id == user_id,
            models.DailyActivity.activity_date == day,
        )
    )
    return row.xp_earned if row else 0


def daily_goal_xp(stats: models.UserStats) -> int:
    return stats.daily_goal_xp or DEFAULT_DAILY_GOAL_XP


# --------------------------------------------------------------------------
# Achievements
# --------------------------------------------------------------------------
def current_metric(db: Session, user: models.User, metric: str) -> int:
    """Compute the live value of whatever an achievement measures."""
    if metric == "total_xp":
        return user.stats.total_xp
    if metric == "streak":
        return user.stats.streak_count
    if metric == "lessons":
        return (
            db.query(models.LessonAttempt)
            .filter(
                models.LessonAttempt.user_id == user.id,
                models.LessonAttempt.state == "completed",
            )
            .count()
        )
    if metric == "crowns":
        return sum(sp.crown_level for sp in user.skill_progress)
    return 0


def evaluate_achievements(db: Session, user: models.User) -> list[models.Achievement]:
    """Unlock any achievement whose threshold has just been crossed.

    Achievements are data, not code: adding one is a seed row, so this
    function never changes.
    """
    unlocked_ids = {
        ua.achievement_id
        for ua in db.query(models.UserAchievement)
        .filter(models.UserAchievement.user_id == user.id)
        .all()
    }
    newly: list[models.Achievement] = []

    for achievement in db.query(models.Achievement).all():
        if achievement.id in unlocked_ids:
            continue
        if current_metric(db, user, achievement.metric) >= achievement.threshold:
            db.add(models.UserAchievement(user_id=user.id, achievement_id=achievement.id))
            newly.append(achievement)

    if newly:
        db.flush()
    return newly
