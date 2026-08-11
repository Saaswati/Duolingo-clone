"""Answer checking.

Every answer is graded here, on the server. The browser is never sent the
solution column, so a learner cannot read the answer out of the network tab or
flip a boolean in React devtools. This costs one extra round trip per question
and is the main thing separating a learning app from a quiz that can be won
with the console open.

Each exercise type submits a different answer shape; `grade` dispatches on the
stored type and returns a normalised result the router can act on.
"""
import re
import unicodedata
from dataclasses import dataclass
from typing import Any

from app import models


@dataclass
class GradeResult:
    correct: bool
    correct_answer: str          # shown in the feedback bar after answering
    explanation: str | None = None


def normalise(text: str) -> str:
    """Compare answers the way a forgiving teacher would.

    Case, punctuation, extra spaces and accents are all ignored, so "el gato."
    and "El Gato" both pass. Accent folding is a deliberate leniency choice for
    a keyboard-typed answer; a stricter course could drop it.
    """
    text = text.strip().lower()
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = re.sub(r"[^\w\s]", "", text)
    return re.sub(r"\s+", " ", text).strip()


def _grade_multiple_choice(ex: models.Exercise, answer: dict[str, Any]) -> GradeResult:
    correct_id = ex.solution["correct_option_id"]
    chosen = answer.get("option_id")
    label = next(
        (o["text"] for o in ex.payload["options"] if o["id"] == correct_id),
        "",
    )
    return GradeResult(chosen == correct_id, label)


def _grade_translate(ex: models.Exercise, answer: dict[str, Any]) -> GradeResult:
    expected = ex.solution["answer"]
    alternatives = ex.solution.get("alternatives", [])
    given = " ".join(answer.get("words", []))
    accepted = {normalise(expected), *(normalise(a) for a in alternatives)}
    return GradeResult(normalise(given) in accepted, expected)


def _grade_match_pairs(ex: models.Exercise, answer: dict[str, Any]) -> GradeResult:
    """Matching is graded on completion: the UI only lets correct pairs stick,
    so reaching the end means every pair was found. Submitted ids are still
    verified against the payload so the endpoint cannot be spoofed."""
    expected_ids = {p["id"] for p in ex.payload["pairs"]}
    given_ids = set(answer.get("matched", []))
    return GradeResult(given_ids == expected_ids, "All pairs matched")


def _grade_fill_blank(ex: models.Exercise, answer: dict[str, Any]) -> GradeResult:
    expected = ex.solution["answer"]
    return GradeResult(
        normalise(answer.get("choice", "")) == normalise(expected),
        expected,
    )


def _grade_type_answer(ex: models.Exercise, answer: dict[str, Any]) -> GradeResult:
    expected = ex.solution["answer"]
    alternatives = ex.solution.get("alternatives", [])
    accepted = {normalise(expected), *(normalise(a) for a in alternatives)}
    given = normalise(answer.get("text", ""))
    return GradeResult(given in accepted, expected)


_GRADERS = {
    "multiple_choice": _grade_multiple_choice,
    "translate": _grade_translate,
    "match_pairs": _grade_match_pairs,
    "fill_blank": _grade_fill_blank,
    "type_answer": _grade_type_answer,
}


def grade(exercise: models.Exercise, answer: dict[str, Any]) -> GradeResult:
    grader = _GRADERS.get(exercise.type)
    if grader is None:
        raise ValueError(f"No grader registered for exercise type {exercise.type!r}")
    result = grader(exercise, answer)
    if not result.explanation:
        result.explanation = exercise.solution.get("explanation")
    return result
