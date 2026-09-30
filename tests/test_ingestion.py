import pytest
from src.ingestion.ocean_realtime import fetch_live_ocean_stations
from src.ingestion.fisheries_stream import generate_live_fisheries_feed
from src.ingestion.edna_molecular import load_edna_samples, calculate_shannon_index
from src.cleaning.clean_ocean_data import clean_ocean_dataframe
from src.validation.validate_ocean_data import validate_ocean_dataframe
import pandas as pd

def test_live_ocean_ingestion():
    data = fetch_live_ocean_stations()
    assert len(data) > 0
    first = data[0]
    assert "station_id" in first
    assert "temperature" in first
    assert "latitude" in first
    assert "longitude" in first

def test_live_fisheries_feed():
    feed = generate_live_fisheries_feed()
    assert len(feed) > 0
    first = feed[0]
    assert "vessel_id" in first
    assert "catch_weight_kg" in first
    assert "gear_type" in first
    assert first["catch_weight_kg"] >= 0

def test_edna_processing_and_shannon():
    samples = load_edna_samples()
    assert len(samples) > 0
    first = samples[0]
    assert "sample_id" in first
    assert "shannon_index" in first
    assert first["shannon_index"] > 0.0

    # Test Shannon Index formula
    shannon_test = calculate_shannon_index([1000, 1000, 1000])
    assert shannon_test > 1.0

def test_clean_and_validate_pipeline():
    raw_sample = pd.DataFrame([
        {"station_id": "ST_TEST", "latitude": 18.5, "longitude": 72.8, "temperature": 28.5, "salinity": 35.0}
    ])
    cleaned = clean_ocean_dataframe(raw_sample)
    assert len(cleaned) == 1
    val = validate_ocean_dataframe(cleaned)
    assert val["is_valid"] is True
