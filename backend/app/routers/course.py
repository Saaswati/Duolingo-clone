"""Courses: listing what can be learned, choosing one, and reading the path."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.deps import get_current_user
from app.schemas import CourseOut, CourseSummary
from app.services.path import build_course, count_completed_skills

router = APIRouter(tags=["course"])


@router.get("/courses", response_model=list[CourseSummary])
def list_courses(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Every course on offer, each with how far this learner has got.

    Progress is included so the picker can show a course you have already
    started differently from one you have not - which is the whole reason a
    learner opens this screen.
    """
    courses = db.query(models.Course).order_by(models.Course.id).all()
    return [
        CourseSummary(
            id=course.id,
            code=course.code,
            title=course.title,
            from_language=course.from_language,
            to_language=course.to_language,
            flag_emoji=course.flag_emoji,
            total_skills=sum(len(unit.skills) for unit in course.units),
            skills_completed=count_completed_skills(db, course, user),
            is_active=course.id == user.stats.active_course_id,
        )
        for course in courses
    ]


@router.post("/courses/{course_id}/select", response_model=CourseOut)
def select_course(
    course_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Switch the learner to another course.

    Nothing is reset. Progress is stored per skill and skills belong to a
    course, so switching away and back finds the old path exactly as it was -
    the same reason Duolingo lets you keep several languages going at once.
    """
    course = db.get(models.Course, course_id)
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    user.stats.active_course_id = course.id
    db.commit()
    return build_course(db, course, user)


@router.get("/course", response_model=CourseOut)
def read_active_course(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """The learner's current path, with their progress folded in.

    One request rather than one per skill: the path is small, always rendered
    as a whole, and a single payload keeps the home screen free of loading
    waterfalls.
    """
    course = None
    if user.stats.active_course_id:
        course = db.get(models.Course, user.stats.active_course_id)
    if course is None:
        # A learner with no course yet falls back to the first one rather than
        # seeing an error; the picker is still one click away.
        course = db.query(models.Course).order_by(models.Course.id).first()
        if course is None:
            raise HTTPException(status_code=404, detail="No courses seeded")
        user.stats.active_course_id = course.id
        db.commit()

    return build_course(db, course, user)
