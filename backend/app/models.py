"""Database schema.

Three groups of tables:

1. Content     — course, units, skills, lessons, exercises. Seeded, read-only
                 at runtime.
2. Identity    — users and their mutable gamification counters (user_stats).
3. Progress    — what a given user has done: skill progress, lesson attempts,
                 individual answers, daily activity, unlocked achievements.

Keeping content separate from progress means a second learner can be added
without touching a single content row, and the leaderboard is a query over
user_stats rather than a special-cased table.
"""
from datetime import datetime, date

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# --------------------------------------------------------------------------
# Identity
# --------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(80))
    avatar_emoji: Mapped[str] = mapped_column(String(8), default="🦉")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    stats: Mapped["UserStats"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    skill_progress: Mapped[list["SkillProgress"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    attempts: Mapped[list["LessonAttempt"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class UserStats(Base):
    """Mutable per-user counters.

    Split from `users` because these change on almost every request while the
    identity row is effectively immutable — and because it keeps the
    leaderboard query narrow.
    """

    __tablename__ = "user_stats"

    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    gems: Mapped[int] = mapped_column(Integer, default=500)          # mocked currency
    hearts: Mapped[int] = mapped_column(Integer, default=5)
    # Timestamp of the last heart change. Regeneration is derived from this on
    # read rather than written by a scheduler — see services/gamification.py.
    hearts_updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    longest_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=50)
    # Which course the learner is currently studying. Nullable so a brand new
    # learner lands on the course picker instead of an arbitrary language.
    active_course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id"), nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="stats")
    active_course: Mapped["Course | None"] = relationship()


# --------------------------------------------------------------------------
# Content
# --------------------------------------------------------------------------
class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    # BCP-47 tag used by the browser's speech synthesis, e.g. "es-ES".
    speech_lang: Mapped[str] = mapped_column(String(10), default="en-US")
    title: Mapped[str] = mapped_column(String(120))
    from_language: Mapped[str] = mapped_column(String(40))
    to_language: Mapped[str] = mapped_column(String(40))
    flag_emoji: Mapped[str] = mapped_column(String(8), default="🇪🇸")

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course", cascade="all, delete-orphan", order_by="Unit.order_index"
    )


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    subtitle: Mapped[str] = mapped_column(String(200))
    color: Mapped[str] = mapped_column(String(20), default="green")  # theme key

    course: Mapped["Course"] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit", cascade="all, delete-orphan", order_by="Skill.order_index"
    )

    __table_args__ = (UniqueConstraint("course_id", "order_index", name="uq_unit_order"),)


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    unit_id: Mapped[int] = mapped_column(ForeignKey("units.id"))
    order_index: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(120))
    icon: Mapped[str] = mapped_column(String(8), default="⭐")

    unit: Mapped["Unit"] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill", cascade="all, delete-orphan", order_by="Lesson.order_index"
    )

    __table_args__ = (UniqueConstraint("unit_id", "order_index", name="uq_skill_order"),)


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(primary_key=True)
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    order_index: Mapped[int] = mapped_column(Integer)
    xp_reward: Mapped[int] = mapped_column(Integer, default=10)

    skill: Mapped["Skill"] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson",
        cascade="all, delete-orphan",
        order_by="Exercise.order_index",
    )

    __table_args__ = (UniqueConstraint("skill_id", "order_index", name="uq_lesson_order"),)


class Exercise(Base):
    """One question inside a lesson.

    Design decision: a single table with a `type` discriminator and a JSON
    `payload`, rather than five typed tables. Exercise formats are
    heterogeneous and add-only — a new type would otherwise mean a migration,
    a model, and a join. The JSON is not a free-for-all: every payload is
    validated against a Pydantic discriminated union on the way in and out
    (see schemas.py), so the shape is enforced at the application boundary.

    `solution` is a separate column from `payload` for one reason: payload is
    safe to send to the browser, solution never is. Keeping them apart makes
    it impossible to leak an answer by accident.
    """

    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    order_index: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(String(40))       # see schemas.ExerciseType
    prompt: Mapped[str] = mapped_column(String(200))    # the instruction line
    payload: Mapped[dict] = mapped_column(JSON)         # question data, client-safe
    solution: Mapped[dict] = mapped_column(JSON)        # never serialised to client

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")


# --------------------------------------------------------------------------
# Progress
# --------------------------------------------------------------------------
class SkillProgress(Base):
    """How far one user has got in one skill.

    A row exists only once the user has started the skill; absence means
    "not started", which keeps the table small and makes unlock logic a
    simple lookup.
    """

    __tablename__ = "skill_progress"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)
    crown_level: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="skill_progress")
    skill: Mapped["Skill"] = relationship()

    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )


class LessonAttempt(Base):
    """One run through a lesson.

    Created on start, closed on completion or failure. Holding attempts as
    rows (rather than tracking state in the client) is what allows grading to
    stay server-side: the server knows which exercise you are on and how many
    hearts this run has cost.
    """

    __tablename__ = "lesson_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"))
    state: Mapped[str] = mapped_column(String(20), default="in_progress")
    # in_progress | completed | failed
    hearts_used: Mapped[int] = mapped_column(Integer, default=0)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="attempts")
    lesson: Mapped["Lesson"] = relationship()
    answers: Mapped[list["AttemptAnswer"]] = relationship(
        back_populates="attempt", cascade="all, delete-orphan"
    )


class AttemptAnswer(Base):
    """One graded answer. Kept so a lesson can be reviewed and so 'mistakes
    practice' could be built later without schema changes."""

    __tablename__ = "attempt_answers"

    id: Mapped[int] = mapped_column(primary_key=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("lesson_attempts.id"))
    exercise_id: Mapped[int] = mapped_column(ForeignKey("exercises.id"))
    given_answer: Mapped[dict] = mapped_column(JSON)
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    attempt: Mapped["LessonAttempt"] = relationship(back_populates="answers")
    exercise: Mapped["Exercise"] = relationship()


class DailyActivity(Base):
    """XP earned per calendar day. Powers both the daily goal ring and the
    streak calendar without recomputing over every attempt."""

    __tablename__ = "daily_activity"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    activity_date: Mapped[date] = mapped_column(Date)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    lessons_completed: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint("user_id", "activity_date", name="uq_user_day"),
    )


class Achievement(Base):
    """Catalogue of badges. `metric` + `threshold` let new achievements be
    seeded as data rather than written as code."""

    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(40), unique=True)
    title: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(String(200))
    icon: Mapped[str] = mapped_column(String(8))
    metric: Mapped[str] = mapped_column(String(30))   # total_xp | streak | lessons | crowns
    threshold: Mapped[int] = mapped_column(Integer)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    achievement: Mapped["Achievement"] = relationship()

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )
