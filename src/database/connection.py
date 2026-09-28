import os
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "marine_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

Base = declarative_base()

def get_engine():
    """
    Returns an SQLAlchemy engine.
    Tries PostgreSQL first with URL-encoded credentials.
    If PostgreSQL is unreachable, falls back to a local SQLite database in data/
    to guarantee zero-configuration out-of-the-box operation.
    """
    if DB_USER and DB_PASSWORD:
        encoded_user = urllib.parse.quote_plus(DB_USER)
        encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
        pg_url = f"postgresql+psycopg2://{encoded_user}:{encoded_password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
        try:
            pg_engine = create_engine(pg_url, connect_args={"connect_timeout": 3})
            with pg_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print(f"[DB] Connected successfully to PostgreSQL at {DB_HOST}:{DB_PORT}/{DB_NAME}")
            return pg_engine
        except Exception as e:
            print(f"[DB] PostgreSQL connection attempt failed ({e}). Falling back to local SQLite.")

    # Local fallback
    data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
    os.makedirs(data_dir, exist_ok=True)
    sqlite_path = os.path.join(data_dir, "marine_platform.db")
    sqlite_url = f"sqlite:///{sqlite_path}"
    print(f"[DB] Using local SQLite database at: {sqlite_path}")
    return create_engine(sqlite_url, connect_args={"check_same_thread": False})

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()