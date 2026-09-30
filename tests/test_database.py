import pytest
from src.database.connection import get_engine, SessionLocal
from src.database.models import init_db, OceanObservation, FisheriesRecord, EDNASample, PipelineLog

def test_database_initialization():
    engine = get_engine()
    assert engine is not None
    init_db()

def test_session_query():
    session = SessionLocal()
    try:
        obs_count = session.query(OceanObservation).count()
        assert obs_count >= 0
        vessels_count = session.query(FisheriesRecord).count()
        assert vessels_count >= 0
        edna_count = session.query(EDNASample).count()
        assert edna_count >= 0
    finally:
        session.close()
