"""Builds the learning path for a user.

The unlock rule in one sentence: the first skill of the course is always
available, and every other skill unlocks when the skill before it is
complete. Keeping that rule in one function means the client never decides
what is locked - it only renders what the server says.
"""
from sqlalchemy.orm import Session

from app import models
from app.schemas import CourseOut, SkillOut, SkillState, UnitOut


def _progress_map(db: Session, user_id: int) -> dict[int, models.SkillProgress]:
    rows = (
        db.query(models.SkillProgress)
        .filter(models.SkillProgress.user_id == user_id)
        .all()
    )
    return {row.skill_id: row for row in rows}


def build_course(db: Session, course: models.Course, user: models.User) -> CourseOut:
    progress = _progress_map(db, user.id)
    previous_complete = True          # nothing precedes the first skill
    units_out: list[UnitOut] = []

    for unit in course.units:
        skills_out: list[SkillOut] = []
        for skill in unit.skills:
            total_lessons = len(skill.lessons)
            record = progress.get(skill.id)
            done = record.lessons_completed if record else 0
            crown = record.crown_level if record else 0
            is_complete = done >= total_lessons and total_lessons > 0

            if not previous_complete:
                state = SkillState.LOCKED
            elif is_complete:
                state = SkillState.COMPLETED
            elif done > 0:
                state = SkillState.IN_PROGRESS
            else:
                state = SkillState.AVAILABLE

            # The next lesson to serve is the first one the learner has not
            # finished; a completed skill replays its final lesson as practice.
            if state == SkillState.LOCKED:
                next_lesson_id = None
            elif is_complete:
                next_lesson_id = skill.lessons[-1].id if skill.lessons else None
            else:
                next_lesson_id = skill.lessons[done].id if done < total_lessons else None

            skills_out.append(
                SkillOut(
                    id=skill.id,
                    order_index=skill.order_index,
                    title=skill.title,
                    icon=skill.icon,
                    total_lessons=total_lessons,
                    lessons_completed=min(done, total_lessons),
                    crown_level=crown,
                    state=state,
                    next_lesson_id=next_lesson_id,
                )
            )
            previous_complete = is_complete

        units_out.append(
            UnitOut(
                id=unit.id,
                order_index=unit.order_index,
                title=unit.title,
                subtitle=unit.subtitle,
                color=unit.color,
                skills=skills_out,
            )
        )

    return CourseOut(
        id=course.id,
        code=course.code,
        speech_lang=course.speech_lang,
        title=course.title,
        from_language=course.from_language,
        to_language=course.to_language,
        flag_emoji=course.flag_emoji,
        units=units_out,
    )


def count_completed_skills(db: Session, course: models.Course, user: models.User) -> int:
    """How many skills in this course the learner has finished.

    Used by the course picker to show progress per language without building
    the whole path for each one.
    """
    progress = _progress_map(db, user.id)
    completed = 0
    for unit in course.units:
        for skill in unit.skills:
            record = progress.get(skill.id)
            if record and len(skill.lessons) > 0 and record.lessons_completed >= len(skill.lessons):
                completed += 1
    return completed
