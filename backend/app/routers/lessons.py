"""The lesson loop: start an attempt, answer questions, finish or fail.

The attempt row is the source of truth for a run. The client holds the index
of the question on screen for rendering, but every consequence - hearts lost,
XP earned, whether the lesson counts - is decided here.
"""
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.config import LESSONS_PER_CROWN, MAX_CROWNS, XP_PERFECT_LESSON_BONUS
from app.database import get_db
from app.deps import get_current_user, get_today
from app.schemas import (
    AchievementOut,
    AnswerIn,
    AnswerOut,
    AttemptStartOut,
    CompleteOut,
    ExerciseOut,
)
from app.services import gamification as g
from app.services.grading import grade

router = APIRouter(tags=["lesson"])


def _load_attempt(db: Session, attempt_id: int, user: models.User) -> models.LessonAttempt:
    attempt = db.get(models.LessonAttempt, attempt_id)
    if attempt is None or attempt.user_id != user.id:
        raise HTTPException(status_code=404, detail="Attempt not found")
    if attempt.state != "in_progress":
        raise HTTPException(status_code=409, detail="This attempt is already finished")
    return attempt


@router.post("/lessons/{lesson_id}/start", response_model=AttemptStartOut)
def start_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    lesson = db.get(models.Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    g.sync_hearts(user.stats)
    if user.stats.hearts <= 0:
        # 402 rather than 403: the learner is not forbidden, they are out of a
        # resource the app knows how to restore.
        raise HTTPException(status_code=402, detail="No hearts left")

    # Abandoned runs are closed rather than left dangling, so a learner never
    # accumulates open attempts by refreshing mid-lesson.
    db.query(models.LessonAttempt).filter(
        models.LessonAttempt.user_id == user.id,
        models.LessonAttempt.state == "in_progress",
    ).update({"state": "abandoned"})

    attempt = models.LessonAttempt(user_id=user.id, lesson_id=lesson.id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return AttemptStartOut(
        attempt_id=attempt.id,
        lesson_id=lesson.id,
        skill_title=lesson.skill.title,
        speech_lang=lesson.skill.unit.course.speech_lang,
        hearts=user.stats.hearts,
        exercises=[
            # payload only - the solution column is never serialised.
            ExerciseOut(
                id=e.id,
                order_index=e.order_index,
                type=e.type,
                prompt=e.prompt,
                payload=e.payload,
            )
            for e in lesson.exercises
        ],
    )


@router.post("/attempts/{attempt_id}/answer", response_model=AnswerOut)
def submit_answer(
    attempt_id: int,
    body: AnswerIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    attempt = _load_attempt(db, attempt_id, user)
    exercise = db.get(models.Exercise, body.exercise_id)
    if exercise is None or exercise.lesson_id != attempt.lesson_id:
        raise HTTPException(status_code=400, detail="Exercise does not belong to this lesson")

    result = grade(exercise, body.answer)

    db.add(
        models.AttemptAnswer(
            attempt_id=attempt.id,
            exercise_id=exercise.id,
            given_answer=body.answer,
            is_correct=result.correct,
        )
    )

    if not result.correct:
        g.lose_heart(user.stats)
        attempt.hearts_used += 1
        if user.stats.hearts <= 0:
            attempt.state = "failed"
            attempt.completed_at = datetime.utcnow()

    db.commit()

    return AnswerOut(
        correct=result.correct,
        correct_answer=result.correct_answer,
        explanation=result.explanation,
        hearts=user.stats.hearts,
        out_of_hearts=user.stats.hearts <= 0,
    )


@router.post("/attempts/{attempt_id}/complete", response_model=CompleteOut)
def complete_lesson(
    attempt_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
    today: date = Depends(get_today),
):
    """Close a run and pay out.

    Everything that makes a lesson 'count' happens in this one transaction:
    XP, the daily total, the streak, skill progress, crowns and achievements.
    Keeping it together means a learner can never end up with the XP but not
    the streak because a second request failed.
    """
    attempt = _load_attempt(db, attempt_id, user)
    lesson = attempt.lesson

    answers = attempt.answers
    correct_count = sum(1 for a in answers if a.is_correct)
    accuracy = round(100 * correct_count / len(answers)) if answers else 0

    base_xp = lesson.xp_reward
    bonus_xp = XP_PERFECT_LESSON_BONUS if attempt.hearts_used == 0 else 0
    earned = base_xp + bonus_xp

    attempt.state = "completed"
    attempt.completed_at = datetime.utcnow()
    attempt.xp_earned = earned

    user.stats.total_xp += earned

    day = g.get_or_create_day(db, user.id, today)
    day.xp_earned += earned
    day.lessons_completed += 1

    streak_extended = g.register_activity(user.stats, today)

    # --- skill progress -------------------------------------------------
    record = (
        db.query(models.SkillProgress)
        .filter(
            models.SkillProgress.user_id == user.id,
            models.SkillProgress.skill_id == lesson.skill_id,
        )
        .first()
    )
    if record is None:
        record = models.SkillProgress(user_id=user.id, skill_id=lesson.skill_id)
        db.add(record)
        db.flush()

    total_lessons = len(lesson.skill.lessons)
    # Progress only advances when the learner finishes the lesson they were
    # due; replaying an earlier lesson is practice and does not double-count.
    if lesson.order_index == record.lessons_completed:
        record.lessons_completed += 1
    record.updated_at = datetime.utcnow()

    skill_completed = record.lessons_completed >= total_lessons
    if skill_completed and record.crown_level < MAX_CROWNS:
        expected_crown = min(
            MAX_CROWNS, record.lessons_completed // max(total_lessons, 1) * LESSONS_PER_CROWN
        )
        record.crown_level = max(record.crown_level, expected_crown)

    db.flush()
    new_achievements = g.evaluate_achievements(db, user)
    db.commit()

    xp_today = g.xp_today(db, user.id, today)
    goal = g.daily_goal_xp(user.stats)

    return CompleteOut(
        xp_earned=earned,
        base_xp=base_xp,
        bonus_xp=bonus_xp,
        total_xp=user.stats.total_xp,
        hearts=user.stats.hearts,
        accuracy=accuracy,
        streak_count=user.stats.streak_count,
        streak_extended=streak_extended,
        daily_goal_met=xp_today >= goal,
        xp_today=xp_today,
        daily_goal_xp=goal,
        crown_level=record.crown_level,
        skill_completed=skill_completed,
        new_achievements=[
            AchievementOut(
                code=a.code,
                title=a.title,
                description=a.description,
                icon=a.icon,
                threshold=a.threshold,
                progress=a.threshold,
                unlocked=True,
                unlocked_at=datetime.utcnow(),
            )
            for a in new_achievements
        ],
    )


@router.post("/attempts/{attempt_id}/quit", status_code=204)
def quit_lesson(
    attempt_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Leaving mid-lesson forfeits progress but keeps hearts already spent."""
    attempt = _load_attempt(db, attempt_id, user)
    attempt.state = "abandoned"
    attempt.completed_at = datetime.utcnow()
    db.commit()
