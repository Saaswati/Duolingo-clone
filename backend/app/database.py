"""SQLAlchemy engine, session factory and declarative base.

The connection string is read from DATABASE_URL, so the same code runs against
a local SQLite file in development and any other SQLAlchemy-supported database
in production without a code change.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# check_same_thread is a SQLite-only quirk: FastAPI serves requests from a
# thread pool, and SQLite refuses cross-thread connections unless told not to.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
