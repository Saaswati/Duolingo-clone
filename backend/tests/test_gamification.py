"""Tests for the rules that are hard to verify by clicking.

Streaks and heart regeneration both depend on the passage of time, which is
exactly the kind of logic that goes untested because exercising it manually
means waiting. Injecting `now` and `today` makes both instant to check.

Run with:  pytest
"""
from datetime import date, datetime, timedelta

from app.config import HEART_REGEN_MINUTES, MAX_HEARTS
from app.models import UserStats
from app.services import gamification as g
from app.services.grading import normalise


def make_stats(**overrides) -> UserStats:
    defaults = dict(
        total_xp=0, gems=0, hearts=MAX_HEARTS,
        hearts_updated_at=datetime(2026, 1, 1, 12, 0),
        streak_count=0, longest_streak=0, last_activity_date=None, daily_goal_xp=50,
    )
    defaults.update(overrides)
    return UserStats(**defaults)


# --- hearts ---------------------------------------------------------------
def test_hearts_regenerate_one_per_interval():
    stats = make_stats(hearts=2)
    later = stats.hearts_updated_at + timedelta(minutes=HEART_REGEN_MINUTES * 2)
    g.sync_hearts(stats, now=later)
    assert stats.hearts == 4


def test_hearts_never_exceed_the_cap():
    stats = make_stats(hearts=1)
    much_later = stats.hearts_updated_at + timedelta(days=3)
    g.sync_hearts(stats, now=much_later)
    assert stats.hearts == MAX_HEARTS


def test_partial_interval_is_not_discarded():
    """Regenerating one heart must not throw away the leftover minutes."""
    stats = make_stats(hearts=2)
    later = stats.hearts_updated_at + timedelta(minutes=HEART_REGEN_MINUTES + 20)
    g.sync_hearts(stats, now=later)
    assert stats.hearts == 3
    assert g.seconds_to_next_heart(stats, now=later) == (HEART_REGEN_MINUTES - 20) * 60


def test_losing_a_heart_from_full_starts_the_clock():
    stats = make_stats(hearts=MAX_HEARTS)
    now = datetime(2026, 1, 2, 9, 0)
    g.lose_heart(stats, now=now)
    assert stats.hearts == MAX_HEARTS - 1
    assert stats.hearts_updated_at == now


# --- streak ---------------------------------------------------------------
def test_consecutive_day_extends_the_streak():
    stats = make_stats(streak_count=4, last_activity_date=date(2026, 3, 1))
    assert g.register_activity(stats, date(2026, 3, 2)) is True
    assert stats.streak_count == 5


def test_second_lesson_same_day_does_not_double_count():
    stats = make_stats(streak_count=5, last_activity_date=date(2026, 3, 2))
    assert g.register_activity(stats, date(2026, 3, 2)) is False
    assert stats.streak_count == 5


def test_missed_day_resets_the_streak_to_one():
    stats = make_stats(streak_count=9, last_activity_date=date(2026, 3, 1))
    g.register_activity(stats, date(2026, 3, 5))
    assert stats.streak_count == 1


def test_longest_streak_is_remembered_after_a_reset():
    stats = make_stats(streak_count=9, longest_streak=9, last_activity_date=date(2026, 3, 1))
    g.register_activity(stats, date(2026, 3, 5))
    assert stats.longest_streak == 9


# --- answer normalisation -------------------------------------------------
def test_normalise_ignores_case_punctuation_and_accents():
    assert normalise("  El Gato!! ") == normalise("el gato")
    assert normalise("la niña") == normalise("la nina")
