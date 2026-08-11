"""Pydantic models: the contract between the API and the browser.

The interesting part is ExercisePayload. Exercises are stored as JSON, so
without validation the database would accept any shape. A discriminated union
keyed on `type` gives back the safety a typed table would have provided,
while keeping the storage flexible.
"""
from datetime import date, datetime
from enum import Enum
from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, ConfigDict, Field


class ExerciseType(str, Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRANSLATE = "translate"
    MATCH_PAIRS = "match_pairs"
    FILL_BLANK = "fill_blank"
    TYPE_ANSWER = "type_answer"


# --------------------------------------------------------------------------
# Exercise payloads (client-safe — never contain the answer)
# --------------------------------------------------------------------------
class ChoiceOption(BaseModel):
    id: str
    text: str
    emoji: str | None = None


class MultipleChoicePayload(BaseModel):
    type: Literal[ExerciseType.MULTIPLE_CHOICE] = ExerciseType.MULTIPLE_CHOICE
    question: str
    audio_text: str | None = None          # spoken via browser speech synthesis
    options: list[ChoiceOption]


class TranslatePayload(BaseModel):
    """Tap-the-words. The word bank deliberately contains distractors."""

    type: Literal[ExerciseType.TRANSLATE] = ExerciseType.TRANSLATE
    sentence: str
    audio_text: str | None = None
    word_bank: list[str]


class MatchPair(BaseModel):
    id: str
    source: str
    target: str


class MatchPairsPayload(BaseModel):
    type: Literal[ExerciseType.MATCH_PAIRS] = ExerciseType.MATCH_PAIRS
    pairs: list[MatchPair]


class FillBlankPayload(BaseModel):
    type: Literal[ExerciseType.FILL_BLANK] = ExerciseType.FILL_BLANK
    sentence_before: str
    sentence_after: str
    translation_hint: str | None = None
    options: list[str]


class TypeAnswerPayload(BaseModel):
    type: Literal[ExerciseType.TYPE_ANSWER] = ExerciseType.TYPE_ANSWER
    source_text: str
    audio_text: str | None = None
    placeholder: str = "Type in English"


ExercisePayload = Annotated[
    Union[
        MultipleChoicePayload,
        TranslatePayload,
        MatchPairsPayload,
        FillBlankPayload,
        TypeAnswerPayload,
    ],
    Field(discriminator="type"),
]


class ExerciseOut(BaseModel):
    """What the browser receives. Note the absence of a solution field."""

    id: int
    order_index: int
    type: ExerciseType
    prompt: str
    payload: dict[str, Any]


# --------------------------------------------------------------------------
# Course / path
# --------------------------------------------------------------------------
class SkillState(str, Enum):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_index: int
    xp_reward: int


class SkillOut(BaseModel):
    id: int
    order_index: int
    title: str
    icon: str
    total_lessons: int
    lessons_completed: int
    crown_level: int
    state: SkillState
    next_lesson_id: int | None


class UnitOut(BaseModel):
    id: int
    order_index: int
    title: str
    subtitle: str
    color: str
    skills: list[SkillOut]


class CourseOut(BaseModel):
    id: int
    code: str
    speech_lang: str
    title: str
    from_language: str
    to_language: str
    flag_emoji: str
    units: list[UnitOut]


class CourseSummary(BaseModel):
    """A course as it appears in the picker: no units, plus this learner's
    progress through it so the list can show how far along each one is."""

    id: int
    code: str
    title: str
    from_language: str
    to_language: str
    flag_emoji: str
    total_skills: int
    skills_completed: int
    is_active: bool


# --------------------------------------------------------------------------
# User / stats
# --------------------------------------------------------------------------
class StatsOut(BaseModel):
    active_course_id: int | None
    total_xp: int
    gems: int
    hearts: int
    max_hearts: int
    seconds_to_next_heart: int | None
    streak_count: int
    longest_streak: int
    daily_goal_xp: int
    xp_today: int
    last_activity_date: date | None


class UserOut(BaseModel):
    id: int
    username: str
    display_name: str
    avatar_emoji: str
    stats: StatsOut


class UserUpdate(BaseModel):
    """Everything a learner is allowed to change about themselves.

    Deliberately narrow: XP, hearts and streak are earned, not set, so they
    are absent here. A field left as None is left untouched.
    """

    display_name: str | None = Field(default=None, min_length=1, max_length=40)
    avatar_emoji: str | None = Field(default=None, min_length=1, max_length=8)
    daily_goal_xp: int | None = Field(default=None, ge=10, le=200)


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    icon: str
    threshold: int
    progress: int
    unlocked: bool
    unlocked_at: datetime | None


class ProfileOut(BaseModel):
    user: UserOut
    lessons_completed: int
    crowns: int
    achievements: list[AchievementOut]
    recent_days: list["DayActivityOut"]


class DayActivityOut(BaseModel):
    activity_date: date
    xp_earned: int


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    display_name: str
    avatar_emoji: str
    total_xp: int
    is_current_user: bool


# --------------------------------------------------------------------------
# Lesson loop
# --------------------------------------------------------------------------
class AttemptStartOut(BaseModel):
    attempt_id: int
    lesson_id: int
    skill_title: str
    speech_lang: str
    exercises: list[ExerciseOut]
    hearts: int


class AnswerIn(BaseModel):
    exercise_id: int
    # Free-form because each exercise type submits a different shape:
    #   multiple_choice -> {"option_id": "b"}
    #   translate       -> {"words": ["I", "eat", "bread"]}
    #   match_pairs     -> {"matched": ["p1", "p2", "p3"]}
    #   fill_blank      -> {"choice": "come"}
    #   type_answer     -> {"text": "I eat bread"}
    answer: dict[str, Any]


class AnswerOut(BaseModel):
    correct: bool
    correct_answer: str
    explanation: str | None
    hearts: int
    out_of_hearts: bool


class CompleteOut(BaseModel):
    xp_earned: int
    base_xp: int
    bonus_xp: int
    total_xp: int
    hearts: int
    accuracy: int
    streak_count: int
    streak_extended: bool
    daily_goal_met: bool
    xp_today: int
    daily_goal_xp: int
    crown_level: int
    skill_completed: bool
    new_achievements: list[AchievementOut]


ProfileOut.model_rebuild()
