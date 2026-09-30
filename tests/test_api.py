# pyrefly: ignore [missing-import]
import pytest
from fastapi.testclient import TestClient
from src.api.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "counts" in data

def test_api_ocean_live():
    res = client.get("/api/ocean/live")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_api_depth_profile():
    res = client.get("/api/ocean/depth-profile?station_id=ST_MUMBAI")
    assert res.status_code == 200
    data = res.json()
    assert "profile" in data
    assert len(data["profile"]) > 0

def test_api_fisheries_pfz():
    res = client.get("/api/fisheries/pfz")
    assert res.status_code == 200
    data = res.json()
    assert "zones" in data
    assert len(data["zones"]) > 0

def test_api_edna():
    res = client.get("/api/biodiversity/edna")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_api_analytics_summary():
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert "summary_kpis" in data

def test_api_ai_chat():
    res = client.post("/api/ai/chat", json={"query": "Where are the tuna hotspots?"})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert len(data["response"]) > 0
