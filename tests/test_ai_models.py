import pytest
from src.ai.pfz_predictor import pfz_ai
from src.ai.marine_heatwave import mhw_ai
from src.ai.cross_correlator import cross_correlator_ai
from src.ai.copilot import copilot_ai

def test_pfz_prediction():
    pred = pfz_ai.predict_point(
        sst=28.0,
        sst_gradient=0.7,
        chlorophyll=2.8,
        salinity=35.2,
        current_velocity=0.85,
        depth=50.0
    )
    assert "pfz_score" in pred
    assert "category" in pred
    assert pred["pfz_score"] >= 0.0

    zones = pfz_ai.generate_regional_pfz_zones()
    assert len(zones) > 0
    assert "polygon" in zones[0]

def test_marine_heatwave_detection():
    # Normal state
    normal = mhw_ai.assess_thermal_stress("Arabian Sea (Eastern Basin)", 28.0)
    assert normal["is_heatwave"] is False
    assert normal["alert_level"] == "GREEN"

    # Extreme heatwave state (>30.5°C)
    extreme = mhw_ai.assess_thermal_stress("Arabian Sea (Eastern Basin)", 31.0)
    assert extreme["is_heatwave"] is True
    assert extreme["sst_anomaly"] > 1.5

def test_cross_correlator():
    ocean = [{"temperature": 28.5, "salinity": 35.0}]
    fisheries = [{"catch_weight_kg": 500.0}]
    edna = [{"shannon_index": 1.45, "species_richness": 5}]

    metrics = cross_correlator_ai.compute_cross_domain_metrics(ocean, fisheries, edna)
    assert "summary_kpis" in metrics
    assert "cross_domain_correlations" in metrics
    assert metrics["summary_kpis"]["unified_ecosystem_health_index"] > 0

def test_marine_copilot_queries():
    ans1 = copilot_ai.ask("Where are the tuna hotspots today?")
    assert "pfz" in ans1["response"].lower() or "tuna" in ans1["response"].lower()

    ans2 = copilot_ai.ask("Is there a marine heatwave?")
    assert "heatwave" in ans2["response"].lower() or "hobday" in ans2["response"].lower()

    ans3 = copilot_ai.ask("Show eDNA detected endangered species")
    assert "whale shark" in ans3["response"].lower() or "edna" in ans3["response"].lower()

    # Verify answering arbitrary real-time questions via Gemini LLM
    ans4 = copilot_ai.ask("What causes ocean tides?")
    assert len(ans4["response"]) > 0
    assert any(w in ans4["response"].lower() for w in ["moon", "gravity", "gravitational", "tide", "earth"])

