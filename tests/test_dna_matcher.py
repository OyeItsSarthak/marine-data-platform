import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.ai.dna_matcher import match_dna_sequence, get_sample_sequences
from src.ai.migration_predictor import generate_7day_fish_migration_forecast

client = TestClient(app)

def test_dna_matcher_yellowfin_tuna():
    samples = get_sample_sequences()
    seq = samples[0]["sequence"] # Yellowfin Tuna 12S sequence
    res = match_dna_sequence(seq)
    assert res["common_name"] == "Yellowfin Tuna"
    assert res["scientific_name"] == "Thunnus albacares"
    assert res["match_score_percent"] >= 95.0
    assert "Scombridae" in res["taxonomy_path"]
    assert "alignment_preview" in res

def test_dna_matcher_whale_shark():
    samples = get_sample_sequences()
    seq = samples[1]["sequence"] # Whale Shark 12S sequence
    res = match_dna_sequence(seq)
    assert res["common_name"] == "Whale Shark"
    assert res["scientific_name"] == "Rhincodon typus"
    assert "Endangered" in res["iucn_status"]
    assert res["match_score_percent"] >= 95.0

def test_dna_samples_helper():
    samples = get_sample_sequences()
    assert len(samples) >= 4
    assert any("Yellowfin Tuna" in s["name"] for s in samples)
    assert any("Whale Shark" in s["name"] for s in samples)

def test_fish_migration_forecast():
    schools = generate_7day_fish_migration_forecast()
    assert len(schools) >= 3
    
    first_school = schools[0]
    assert "school_id" in first_school
    assert "species" in first_school
    assert len(first_school["waypoints"]) == 7
    
    # Verify daily waypoints have valid coords and temperature
    for wp in first_school["waypoints"]:
        assert 0.0 <= wp["latitude"] <= 35.0
        assert 50.0 <= wp["longitude"] <= 100.0
        assert 20.0 <= wp["water_temp_c"] <= 35.0
        assert "driver" in wp

def test_api_dna_match_endpoint():
    res = client.post("/api/ai/dna-match", json={
        "sequence": "ACTTTATACTTCCTCTTTGGTGCATGAGCCGGAATAGTAGGCACAGCTCTAAGCCTCCTCATTCGAGCCGAGCTCGGCCAGCCCGGCAACCTGCTAGGC"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["common_name"] == "Green Sea Turtle"
    assert data["scientific_name"] == "Chelonia mydas"
    assert data["match_score_percent"] > 90.0

def test_api_dna_samples_endpoint():
    res = client.get("/api/ai/dna-samples")
    assert res.status_code == 200
    data = res.json()
    assert any("Yellowfin Tuna" in s["name"] for s in data)

def test_api_fish_migration_endpoint():
    res = client.get("/api/ai/fish-migration")
    assert res.status_code == 200
    data = res.json()
    assert "schools" in data
    assert len(data["schools"]) >= 3

def test_api_ocean_probe_endpoint():
    res = client.get("/api/ocean/probe?lat=18.52&lon=72.85")
    assert res.status_code == 200
    data = res.json()
    assert "ocean_state" in data
    assert "temperature_celsius" in data["ocean_state"]
    assert "salinity_psu" in data["ocean_state"]
    assert "fish_population" in data
    assert "species_likelihood" in data["fish_population"]
    assert "edna_history" in data
