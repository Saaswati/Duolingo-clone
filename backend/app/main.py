"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import ALLOWED_ORIGINS, SEED_ON_STARTUP
from app.database import Base, engine
from app.routers import course, leaderboard, lessons, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if SEED_ON_STARTUP:
        # Hosted free tiers give us an ephemeral filesystem, so the demo
        # rebuilds itself into a known-good state on every boot rather than
        # coming back empty. See ASSUMPTIONS.md.
        from app.seed import seed
        seed(reset=True)
    yield


app = FastAPI(
    title="Duolingo Clone API",
    description="Lesson loop, learning path and gamification for a Duolingo-style learning app.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")
app.include_router(course.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")
app.include_router(leaderboard.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
def health():
    """Used by the frontend to show a 'waking the server' state on free
    hosting, where the first request after idle can take up to a minute."""
    return {"status": "ok"}
