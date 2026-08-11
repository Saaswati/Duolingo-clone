# Submission checklist

Work through this before you submit. Everything below is a step only you can
do — the code is finished.

## 1. Push to GitHub (public)

```bash
cd duolingo-clone
git init
git add .
git commit -m "Duolingo clone: lesson loop, learning path, gamification"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Confirm the repo is **public** in Settings → General → Danger Zone.

## 2. Deploy the backend (Render)

1. Render → New → Blueprint → pick this repo. It reads `render.yaml`.
2. Wait for the first deploy, then copy the service URL
   (`https://something.onrender.com`).
3. Open `https://<that-url>/docs` to confirm the API is alive.

## 3. Deploy the frontend (Vercel)

1. Vercel → Add New → Project → import the repo.
2. **Root Directory: `frontend`** — this one is easy to miss.
3. Environment variable: `NEXT_PUBLIC_API_URL` = your Render URL (no trailing
   slash).
4. Deploy, then copy the Vercel URL.

## 4. Close the CORS loop

Back on Render, set `ALLOWED_ORIGINS` to your Vercel URL and redeploy.
Skipping this is the single most common reason a deployed demo shows an empty
path — the browser blocks the request and the page looks broken with no error.

## 5. Fill in the README

Replace the two placeholder lines at the top with your live demo URL and repo
URL.

## 6. Test the deployed app, not just localhost

Open the Vercel URL in a private window and walk the loop: start a lesson,
answer one wrong, finish it, check the streak moved on the profile page.

## 7. The assumptions field on the submission form

Paste a condensed version of `ASSUMPTIONS.md` and link the full file. The
short version worth pasting: auth is a seeded default learner behind a
swappable dependency; gems, Super, friends and speaking are placeholders; the
leaderboard's rivals are seeded but ranking is live; audio is browser speech
synthesis; hearts regenerate lazily rather than on a scheduler; the hosted
backend reseeds on boot because free tiers have an ephemeral filesystem.

---

## Before the interview

The brief says you must be able to explain every line. These are the five
things most likely to be asked, and where to look:

1. **"Why one exercises table instead of five?"**
   `app/models.py` (the `Exercise` docstring) and `app/schemas.py` (the
   discriminated union). Answer: heterogeneous, add-only formats; purity would
   cost a migration per type; the union restores the type safety.

2. **"How do you stop someone cheating?"**
   `app/services/grading.py` and the absence of `solution` in `ExerciseOut`.
   The browser is never sent the answer.

3. **"How do hearts regenerate without a cron job?"**
   `app/services/gamification.py::sync_hearts`. Stored timestamp, value derived
   on read, correct even after downtime.

4. **"How did you test streak logic?"**
   `get_today` in `app/deps.py`, the Settings page, and
   `backend/tests/test_gamification.py`.

5. **"How would you add a new exercise type?"**
   One component in `components/exercises/`, one line in the `EXERCISES`
   registry in `LessonPlayer.tsx`, one payload class in `schemas.py`, one
   grader in `grading.py`. No migration, no changes to the player.

Read `LessonPlayer.tsx` and `lessons.py` end to end at least once — between
them they hold the whole loop, and every question about "the core feature" will
land on one of the two.
