"""Seed the database with courses, a learner, rivals and achievements.

Idempotent: running it drops and rebuilds rather than duplicating, so it is
safe to call on every boot in a hosted demo.

Content is deliberately small. The brief allows one seeded language, but the
course structure is generated from a per-language `LanguageSpec` below, so
adding a fifth language is a block of vocabulary rather than any new code.
That is the point worth making about this file: the shape of a course is
defined once and the languages are data.
"""
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from app.database import Base, SessionLocal, engine
from app import models


# --------------------------------------------------------------------------
# Content specification
# --------------------------------------------------------------------------
@dataclass
class LanguageSpec:
    code: str
    title: str
    flag: str
    speech_lang: str
    # (foreign word, english meaning, emoji) - drives choice and matching
    vocab: list[tuple[str, str, str]]
    # (foreign sentence, english translation) - drives translate and typing
    sentences: list[tuple[str, str]]
    # (before, answer, after, english hint, [distractors]) - drives fill-blank
    blanks: list[tuple[str, str, str, str, list[str]]]


JAPANESE = LanguageSpec(
    code="ja", title="Japanese", flag="\U0001F1EF\U0001F1F5", speech_lang="ja-JP",
    vocab=[
        ("\u5973\u306e\u4eba", "woman", "\U0001F469"),
        ("\u7537\u306e\u4eba", "man", "\U0001F468"),
        ("\u7537\u306e\u5b50", "boy", "\U0001F466"),
        ("\u5973\u306e\u5b50", "girl", "\U0001F467"),
        ("\u30d1\u30f3", "bread", "\U0001F35E"),
        ("\u304a\u6c34", "water", "\U0001F4A7"),
        ("\u304e\u3085\u3046\u3085\u3046", "milk", "\U0001F95B"),
        ("\u308a\u3093\u3054", "apple", "\U0001F34E"),
        ("\u672c", "book", "\U0001F4D6"),
        ("\u306d\u3053", "cat", "\U0001F408"),
    ],
    sentences=[
        ("\u308f\u305f\u3057\u306f\u5973\u306e\u4eba\u3067\u3059", "I am a woman"),
        ("\u7537\u306e\u4eba\u306f\u304a\u6c34\u3092\u306e\u307f\u307e\u3059", "The man drinks water"),
        ("\u5973\u306e\u5b50\u306f\u30d1\u30f3\u3092\u305f\u3079\u307e\u3059", "The girl eats bread"),
        ("\u308f\u305f\u3057\u305f\u3061\u306f\u308a\u3093\u3054\u3092\u305f\u3079\u307e\u3059", "We eat apples"),
        ("\u5973\u306e\u4eba\u306f\u672c\u3092\u8aad\u307f\u307e\u3059", "The woman reads a book"),
        ("\u306d\u3053\u306f\u304e\u3085\u3046\u3085\u3046\u3092\u306e\u307f\u307e\u3059", "The cat drinks milk"),
    ],
    blanks=[
        ("\u308f\u305f\u3057\u306f\u30d1\u30f3\u3092", "\u305f\u3079\u307e\u3059",
         "\u3002", "I eat bread",
         ["\u306e\u307f\u307e\u3059", "\u3067\u3059"]),
        ("\u5973\u306e\u5b50\u306f\u304e\u3085\u3046\u3085\u3046\u3092",
         "\u306e\u307f\u307e\u3059", "\u3002", "The girl drinks milk",
         ["\u305f\u3079\u307e\u3059", "\u3067\u3059"]),
        ("\u5f7c\u306f\u672c\u3092", "\u8aad\u307f\u307e\u3059",
         "\u3002", "He reads a book",
         ["\u305f\u3079\u307e\u3059", "\u306e\u307f\u307e\u3059"]),
    ],
)

FRENCH = LanguageSpec(
    code="fr", title="French", flag="\U0001F1EB\U0001F1F7", speech_lang="fr-FR",
    vocab=[
        ("la femme", "the woman", "\U0001F469"), ("l'homme", "the man", "\U0001F468"),
        ("le garcon", "the boy", "\U0001F466"), ("la fille", "the girl", "\U0001F467"),
        ("le pain", "the bread", "\U0001F35E"), ("l'eau", "the water", "\U0001F4A7"),
        ("le lait", "the milk", "\U0001F95B"), ("la pomme", "the apple", "\U0001F34E"),
        ("le livre", "the book", "\U0001F4D6"), ("le chat", "the cat", "\U0001F408"),
    ],
    sentences=[
        ("Je suis une femme", "I am a woman"),
        ("L'homme boit de l'eau", "The man drinks water"),
        ("La fille mange du pain", "The girl eats bread"),
        ("Nous mangeons des pommes", "We eat apples"),
        ("La femme lit un livre", "The woman reads a book"),
        ("Le chat boit du lait", "The cat drinks milk"),
    ],
    blanks=[
        ("Je", "mange", "du pain", "I eat bread", ["bois", "suis"]),
        ("La fille", "boit", "du lait", "The girl drinks milk", ["mange", "est"]),
        ("Il", "lit", "un livre", "He reads a book", ["mange", "boit"]),
    ],
)

GERMAN = LanguageSpec(
    code="de", title="German", flag="\U0001F1E9\U0001F1EA", speech_lang="de-DE",
    vocab=[
        ("die Frau", "the woman", "\U0001F469"), ("der Mann", "the man", "\U0001F468"),
        ("der Junge", "the boy", "\U0001F466"), ("das Madchen", "the girl", "\U0001F467"),
        ("das Brot", "the bread", "\U0001F35E"), ("das Wasser", "the water", "\U0001F4A7"),
        ("die Milch", "the milk", "\U0001F95B"), ("der Apfel", "the apple", "\U0001F34E"),
        ("das Buch", "the book", "\U0001F4D6"), ("die Katze", "the cat", "\U0001F408"),
    ],
    sentences=[
        ("Ich bin eine Frau", "I am a woman"),
        ("Der Mann trinkt Wasser", "The man drinks water"),
        ("Das Madchen isst Brot", "The girl eats bread"),
        ("Wir essen Apfel", "We eat apples"),
        ("Die Frau liest ein Buch", "The woman reads a book"),
        ("Die Katze trinkt Milch", "The cat drinks milk"),
    ],
    blanks=[
        ("Ich", "esse", "Brot", "I eat bread", ["trinke", "bin"]),
        ("Das Madchen", "trinkt", "Milch", "The girl drinks milk", ["isst", "ist"]),
        ("Er", "liest", "ein Buch", "He reads a book", ["isst", "trinkt"]),
    ],
)

HINDI = LanguageSpec(
    code="hi", title="Hindi", flag="\U0001F1EE\U0001F1F3", speech_lang="hi-IN",
    vocab=[
        ("\u0914\u0930\u0924", "the woman", "\U0001F469"),
        ("\u0906\u0926\u092e\u0940", "the man", "\U0001F468"),
        ("\u0932\u0921\u093c\u0915\u093e", "the boy", "\U0001F466"),
        ("\u0932\u0921\u093c\u0915\u0940", "the girl", "\U0001F467"),
        ("\u0930\u094b\u091f\u0940", "the bread", "\U0001F35E"),
        ("\u092a\u093e\u0928\u0940", "the water", "\U0001F4A7"),
        ("\u0926\u0942\u0927", "the milk", "\U0001F95B"),
        ("\u0938\u0947\u092c", "the apple", "\U0001F34E"),
        ("\u0915\u093f\u0924\u093e\u092c", "the book", "\U0001F4D6"),
        ("\u092c\u093f\u0932\u094d\u0932\u0940", "the cat", "\U0001F408"),
    ],
    sentences=[
        ("\u092e\u0948\u0902 \u090f\u0915 \u0914\u0930\u0924 \u0939\u0942\u0901", "I am a woman"),
        ("\u0906\u0926\u092e\u0940 \u092a\u093e\u0928\u0940 \u092a\u0940\u0924\u093e \u0939\u0948", "The man drinks water"),
        ("\u0932\u0921\u093c\u0915\u0940 \u0930\u094b\u091f\u0940 \u0916\u093e\u0924\u0940 \u0939\u0948", "The girl eats bread"),
        ("\u0939\u092e \u0938\u0947\u092c \u0916\u093e\u0924\u0947 \u0939\u0948\u0902", "We eat apples"),
        ("\u0914\u0930\u0924 \u0915\u093f\u0924\u093e\u092c \u092a\u0922\u093c\u0924\u0940 \u0939\u0948", "The woman reads a book"),
        ("\u092c\u093f\u0932\u094d\u0932\u0940 \u0926\u0942\u0927 \u092a\u0940\u0924\u0940 \u0939\u0948", "The cat drinks milk"),
    ],
    blanks=[
        ("\u092e\u0948\u0902 \u0930\u094b\u091f\u0940", "\u0916\u093e\u0924\u093e", "\u0939\u0942\u0901",
         "I eat bread", ["\u092a\u0940\u0924\u093e", "\u092a\u0922\u093c\u0924\u093e"]),
        ("\u0932\u0921\u093c\u0915\u0940 \u0926\u0942\u0927", "\u092a\u0940\u0924\u0940", "\u0939\u0948",
         "The girl drinks milk", ["\u0916\u093e\u0924\u0940", "\u092a\u0922\u093c\u0924\u0940"]),
        ("\u0935\u0939 \u0915\u093f\u0924\u093e\u092c", "\u092a\u0922\u093c\u0924\u093e", "\u0939\u0948",
         "He reads a book", ["\u0916\u093e\u0924\u093e", "\u092a\u0940\u0924\u093e"]),
    ],
)

LANGUAGES = [JAPANESE]

# Every course has the same shape: three units, seven skills. Only the words
# change between languages.
UNIT_PLAN = [
    ("Unit 1", "Form basic sentences", "green",
     [("Basics 1", "\U0001F95A", 3), ("Basics 2", "\U0001F34E", 2), ("Greetings", "\U0001F44B", 2)]),
    ("Unit 2", "Talk about food and family", "blue",
     [("Food", "\U0001F37D", 2), ("Family", "\U0001F46A", 2)]),
    ("Unit 3", "Describe your day", "purple",
     [("Routine", "\U000023F0", 2), ("Travel", "\U00002708", 2)]),
]

ACHIEVEMENTS = [
    ("first_steps", "First Steps", "Complete your first lesson", "\U0001F3AF", "lessons", 1),
    ("wildfire", "Wildfire", "Reach a 3 day streak", "\U0001F525", "streak", 3),
    ("scholar", "Scholar", "Earn 100 XP", "\U0001F4DA", "total_xp", 100),
    ("sage", "Sage", "Earn 250 XP", "\U0001F9D9", "total_xp", 250),
    ("champion", "Champion", "Complete 10 lessons", "\U0001F3C6", "lessons", 10),
    ("regal", "Regal", "Collect 3 crowns", "\U0001F451", "crowns", 3),
]

RIVALS = [
    ("mateo", "Mateo R.", "\U0001F41D", 420), ("priya", "Priya S.", "\U0001F98A", 310),
    ("chen", "Chen W.", "\U0001F43C", 280), ("amara", "Amara O.", "\U0001F981", 150),
    ("luca", "Luca B.", "\U0001F427", 90),
]


# --------------------------------------------------------------------------
# Exercise builders
# --------------------------------------------------------------------------
def _exercise(order, type_, prompt, payload, solution):
    return models.Exercise(
        order_index=order, type=type_, prompt=prompt, payload=payload, solution=solution
    )


def multiple_choice(order: int, spec: LanguageSpec, seed: int):
    """Pick the right meaning. Distractors come from the same vocabulary list,
    so the wrong options are always plausible rather than absurd."""
    correct = spec.vocab[seed % len(spec.vocab)]
    others = [v for v in spec.vocab if v != correct][:2]
    options = [
        {"id": "a", "text": correct[1], "emoji": correct[2]},
        {"id": "b", "text": others[0][1], "emoji": others[0][2]},
        {"id": "c", "text": others[1][1], "emoji": others[1][2]},
    ]
    # Rotate which slot holds the answer so it is not always the first option.
    shift = seed % 3
    if shift:
        options = options[-shift:] + options[:-shift]
    for index, option in enumerate(options):
        option["id"] = "abc"[index]
    correct_id = next(o["id"] for o in options if o["text"] == correct[1])

    return _exercise(
        order, "multiple_choice", f"Which one of these is '{correct[1]}'?",
        {"type": "multiple_choice", "question": correct[0],
         "audio_text": correct[0], "options": options},
        {"correct_option_id": correct_id},
    )


def translate(order: int, spec: LanguageSpec, seed: int):
    """Tap the words. The bank holds the answer plus decoys drawn from another
    sentence, which is what makes word order matter."""
    foreign, english = spec.sentences[seed % len(spec.sentences)]
    words = english.split()
    decoys = [w for w in spec.sentences[(seed + 2) % len(spec.sentences)][1].split()
              if w not in words][:3]

    return _exercise(
        order, "translate", "Translate this sentence",
        {"type": "translate", "sentence": foreign,
         "audio_text": foreign, "word_bank": words + decoys},
        {"answer": english},
    )


def match_pairs(order: int, spec: LanguageSpec, seed: int):
    chosen = [spec.vocab[(seed + i) % len(spec.vocab)] for i in range(4)]
    return _exercise(
        order, "match_pairs", "Tap the matching pairs",
        {"type": "match_pairs",
         "pairs": [{"id": f"p{i+1}", "source": word, "target": meaning}
                   for i, (word, meaning, _) in enumerate(chosen)]},
        {},
    )


def fill_blank(order: int, spec: LanguageSpec, seed: int):
    before, answer, after, hint, distractors = spec.blanks[seed % len(spec.blanks)]
    return _exercise(
        order, "fill_blank", "Fill in the blank",
        {"type": "fill_blank", "sentence_before": before, "sentence_after": after,
         "translation_hint": hint, "options": sorted([answer, *distractors])},
        {"answer": answer},
    )


def type_answer(order: int, spec: LanguageSpec, seed: int):
    foreign, english = spec.sentences[(seed + 3) % len(spec.sentences)]
    return _exercise(
        order, "type_answer", "Write this in English",
        {"type": "type_answer", "source_text": foreign,
         "audio_text": foreign, "placeholder": "Type in English"},
        {"answer": english},
    )


BUILDERS = [multiple_choice, translate, match_pairs, fill_blank, type_answer]


def build_lesson(order: int, spec: LanguageSpec, seed: int) -> models.Lesson:
    """A lesson is five exercises, one of each type, always in the same
    pedagogical order: recognise, build, match, recall, type.
    The seed shifts which vocabulary and sentences appear, so consecutive
    lessons cover different words even though the exercise types repeat.
    """
    # Always one of each type, in this order
    exercise_order = [
        ("multiple_choice", 0),
        ("translate",       1),
        ("match_pairs",     2),
        ("fill_blank",      3),
        ("type_answer",     4),
    ]
    exercises = []
    for position, (ex_type, offset) in enumerate(exercise_order):
        # Use a unique seed per exercise so vocab and sentences rotate
        ex_seed = seed * 7 + offset * 13
        builder = next(b for b in BUILDERS if b.__name__ == ex_type)
        exercises.append(builder(position, spec, ex_seed))
    return models.Lesson(order_index=order, xp_reward=10, exercises=exercises)


def build_course(spec: LanguageSpec) -> models.Course:
    course = models.Course(
        code=spec.code, speech_lang=spec.speech_lang, title=spec.title,
        from_language="English", to_language=spec.title, flag_emoji=spec.flag,
    )
    seed_counter = 0
    for unit_index, (title, subtitle, color, skills) in enumerate(UNIT_PLAN):
        unit = models.Unit(
            order_index=unit_index, title=title, subtitle=subtitle, color=color
        )
        for skill_index, (skill_title, icon, lesson_count) in enumerate(skills):
            skill = models.Skill(order_index=skill_index, title=skill_title, icon=icon)
            for lesson_index in range(lesson_count):
                skill.lessons.append(build_lesson(lesson_index, spec, seed_counter))
                seed_counter += 1
            unit.skills.append(skill)
        course.units.append(unit)
    return course


# --------------------------------------------------------------------------
# Seeding
# --------------------------------------------------------------------------
def seed(reset: bool = True) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(models.Course).first() is not None:
            return  # already seeded

        courses = [build_course(spec) for spec in LANGUAGES]
        for course in courses:
            db.add(course)

        for code, title, description, icon, metric, threshold in ACHIEVEMENTS:
            db.add(models.Achievement(
                code=code, title=title, description=description,
                icon=icon, metric=metric, threshold=threshold,
            ))

        today = date.today()
        learner = models.User(
            username="saaswati", display_name="Saaswati", avatar_emoji="\U0001F989",
        )
        learner.stats = models.UserStats(
            total_xp=180, gems=500, hearts=4,
            hearts_updated_at=datetime.utcnow() - timedelta(minutes=12),
            streak_count=4, longest_streak=6,
            last_activity_date=today - timedelta(days=1),
            daily_goal_xp=50,
        )
        db.add(learner)

        for username, display_name, emoji, xp in RIVALS:
            rival = models.User(
                username=username, display_name=display_name, avatar_emoji=emoji
            )
            rival.stats = models.UserStats(total_xp=xp, hearts=5, streak_count=xp // 60)
            db.add(rival)

        db.flush()

        # Start the learner on the first course with a believable history, so
        # the path, profile chart and streak are populated on first load.
        japanese = courses[0]
        learner.stats.active_course_id = japanese.id
        first_unit = japanese.units[0]
        db.add(models.SkillProgress(
            user_id=learner.id, skill_id=first_unit.skills[0].id,
            lessons_completed=len(first_unit.skills[0].lessons), crown_level=1,
        ))
        db.add(models.SkillProgress(
            user_id=learner.id, skill_id=first_unit.skills[1].id,
            lessons_completed=1, crown_level=0,
        ))
        for days_ago, xp in [(3, 40), (2, 60), (1, 80)]:
            db.add(models.DailyActivity(
                user_id=learner.id, activity_date=today - timedelta(days=days_ago),
                xp_earned=xp, lessons_completed=xp // 20,
            ))

        db.commit()
        print(f"Seeded: {len(courses)} courses "
              f"({', '.join(c.title for c in courses)}), "
              f"1 learner, {len(RIVALS)} rivals.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
