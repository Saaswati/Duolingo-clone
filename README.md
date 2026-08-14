# Duolingo Clone

A full-stack recreation of Duolingo's learning experience: a Japanese languagecourse with a winding skill path and lock/unlock progression,alesson player with five exercise types, and the gamification layer — hearts,XP, streaks, crowns, a daily goal and a leaderboard — that turns a quiz intosomething you come back to.

**Live demo:** https://duolingo-clone-amber.vercel.app
**Repository:** https://github.com/Saaswati/Duolingo-clone

---

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript | Required by the brief; the App Router keeps each screen a folder and each interactive piece a client component |
| Styling | Tailwind CSS 3 | Duolingo's look is a small, repeated set of tokens — a theme file expresses that better than stylesheets |
| Backend | FastAPI (Python 3.12) | Required by the brief; the generated OpenAPI docs at `/docs` double as the API reference |
| ORM | SQLAlchemy 2.0 | Declarative models and a swappable connection string |
| Validation | Pydantic v2 | Discriminated unions let heterogeneous exercises stay type-safe |
| Database | SQLite | Required by the brief; the URL is an env var, so nothing is hard-coded to it |
| Tests | pytest | For the time-based rules that are impractical to verify by clicking |

---

## Running it locally

You need Python 3.10+ and Node 18+.

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed                # creates duolingo.db and fills it
uvicorn app.main:app --reload     # http://localhost:8000
```

Interactive API docs: **http://localhost:8000/docs**

### Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local  # points at http://localhost:8000
npm run dev                       # http://localhost:3000
```

### Tests

```bash
cd backend && pytest
```

---

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│  Next.js (browser)          │        │  FastAPI                     │
│                             │        │                              │
│  app/          screens      │        │  routers/    HTTP layer      │
│  components/   UI           │  HTTP  │  services/   the rules       │
│  lib/api.ts    the only ────┼───────▶│  models.py   the schema      │
│                file that    │  JSON  │  schemas.py  the contract    │
│                fetches      │        │                              │
└─────────────────────────────┘        └──────────────┬───────────────┘
                                                      │
                                                 SQLite (duolingo.db)
```

Three rules shape the whole codebase:

**The server decides everything that counts.** The browser never receives a
correct answer, never computes XP, and never decides which skills are unlocked.
It renders what the API tells it. This is why `exercises.solution` is a separate
column from `exercises.payload` — one is safe to serialise, the other never is.

**Rules live in services, not routers.** `routers/` translates HTTP to function
calls. `services/gamification.py` knows what a streak is, `services/grading.py`
knows what a correct answer is, `services/path.py` knows what "unlocked" means.
The tests exercise those directly, without a server.

**One place per concern on the frontend.** `lib/api.ts` is the only file that
calls `fetch`. `UserProvider` is the only holder of the learner's stats.
`LessonPlayer` owns everything common to every exercise — progress, hearts,
submission, feedback — and each exercise component only collects one answer.
Adding a sixth exercise type means writing one component and adding one line to
the registry in `LessonPlayer.tsx`.

---

## Database schema

```
users ──1:1── user_stats          (xp, gems, hearts, hearts_updated_at,
  │                                streak_count, last_activity_date, daily_goal)
  ├──1:N── skill_progress ──N:1── skills
  ├──1:N── lesson_attempts ──1:N── attempt_answers ──N:1── exercises
  ├──1:N── daily_activity          (one row per user per day)
  └──1:N── user_achievements ──N:1── achievements

courses ──1:N── units ──1:N── skills ──1:N── lessons ──1:N── exercises
```

Content (left column) and progress (right column) never mix. A second learner
can be added without touching a content row, and the leaderboard is a query
over `user_stats` rather than a table of its own.

### Decisions worth defending

**Exercises are one table, not five.** `exercises.type` discriminates and
`exercises.payload` holds the question as JSON. Five typed tables would be more
relationally pure, but exercise formats are heterogeneous and add-only —
purity would mean a migration, a model and a join every time a new type is
introduced. The JSON is validated against a Pydantic discriminated union, so the
shape is enforced at the application boundary rather than being a free-for-all.

**`user_stats` is separate from `users`.** These columns change on almost every
request while the identity row is effectively immutable, and separating them
keeps the leaderboard query narrow.

**Hearts are derived, not scheduled.** Storing `hearts` with
`hearts_updated_at` and computing regeneration on read means there is no
background worker, and the value is correct even after the server has been
asleep — which is exactly what free hosting does.

**`daily_activity` exists so the daily goal and streak calendar are one lookup**
rather than an aggregate over every attempt the learner has ever made.

**`attempt_answers` records each graded answer.** Not needed for the core loop,
but it is what a "practise your mistakes" feature would be built from, and it
costs one table now versus a migration later.

---

## API overview

Full interactive reference at `/docs`. Two optional headers apply everywhere:
`X-User-Id` selects the learner (defaults to the seeded one) and
`X-Simulated-Date` overrides today's date for testing streak logic.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Liveness check; used by the frontend's wake-up state |
| `GET` | `/api/me` | Learner and current stats, with hearts synced |
| `PATCH` | `/api/me` | Edit display name, avatar and daily goal |
| `GET` | `/api/course` | The active path with this learner's progress folded in |
| `GET` | `/api/profile` | Stats, achievements with progress, last 7 days of XP |
| `GET` | `/api/leaderboard` | Live ranking across all seeded users |
| `POST` | `/api/lessons/{id}/start` | Opens an attempt, returns exercises **without solutions** |
| `POST` | `/api/attempts/{id}/answer` | Grades one answer, spends a heart if wrong |
| `POST` | `/api/attempts/{id}/complete` | Awards XP, updates streak, crowns and achievements |
| `POST` | `/api/attempts/{id}/quit` | Abandons an attempt |
| `POST` | `/api/hearts/refill` | Mocked practice refill |

Two status codes carry meaning rather than just failure: **402** on
`/start` means the learner is out of hearts (a game state, not a fault), and
**409** on `/complete` means the attempt already ended — which is how a failed
lesson refuses to pay out.

### The lesson loop, end to end

1. `POST /lessons/{id}/start` — server opens an attempt and returns the
   exercises, minus their solutions.
2. For each exercise, `POST /attempts/{id}/answer` — server grades it, spends a
   heart on a wrong answer, and returns the verdict plus the correct answer now
   that the learner has committed.
3. If hearts hit zero the attempt is marked failed, and the out-of-hearts modal
   takes over.
4. `POST /attempts/{id}/complete` — one transaction awards XP (plus a bonus for
   a flawless run), updates the day's total, advances the streak, moves skill
   progress, raises the crown, and unlocks any achievement whose threshold has
   just been crossed.

---

## Seeded data

One Japanese course with three units and seven skills. The learner starts partway in — first skill complete with a crown, second half done, XP spread over the previous few days — so the path, the profile chart and the streak are all populated the moment the app opens. Five rivals sit on the leaderboard above and below.
Reseed at any time with python -m app.seed (drops and rebuilds).



### Editing your profile

**Profile → Edit profile** changes the display name, avatar and daily XP goal.
The endpoint is deliberately narrow: `UserUpdate` in `schemas.py` contains only
those three fields, so `PATCH /api/me` cannot be used to award yourself XP or a
streak even by hand-crafting the request. Fields left out are untouched.

---

## Deployment

**Frontend → Vercel.** Import the repo, set the root directory to `frontend`,
and add `NEXT_PUBLIC_API_URL` pointing at the deployed backend.

**Backend → Render.** `render.yaml` in the repo root is a blueprint: point
Render at it, then set `ALLOWED_ORIGINS` to your Vercel URL once you have it.

Free instances have an ephemeral filesystem, so the blueprint sets
`SEED_ON_STARTUP=true` and the database rebuilds itself on boot rather than
coming back empty. On a paid instance with a persistent disk, set it to `false`
for permanent persistence — no other change is needed. Free instances also sleep
after inactivity; the first request can take up to a minute, and the frontend
says so explicitly rather than showing a silent spinner.

---

## What's mocked

Gems, the Super subscription, friends and speaking exercises are placeholders; the leaderboard's rivals are seeded with fixed XP. Every one of these, and the reasoning behind where the line was drawn, is written up in [ASSUMPTIONS.md](./ASSUMPTIONS.md).

---

## Testing the streak without waiting three days

Streaks are day-based, which normally makes them untestable in a sitting. Open
**Settings → Time travel**, set a date, and the frontend sends it to the server
as today.

- Finish a lesson, move the date forward one day, finish another → the streak
  increments.
- Finish two lessons on the same simulated date → the streak does not
  double-count.
- Skip two days → the streak resets to 1.

The same header drives the automated tests in `backend/tests/`.
