import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_check():
    """Test the /api/v1/health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ok", "degraded"]
    assert "version" in data
    assert "emergency_paused" in data


def test_regions_priority_and_counts():
    """Test that the 4 regions exist in proper priority order (PK, EU, ASIA, ARAB) and have 25 total countries."""
    response = client.get("/api/v1/regions")
    assert response.status_code == 200
    regions = response.json()
    assert len(regions) == 4

    codes = [r["code"] for r in regions]
    assert codes == ["PK", "EU", "ASIA", "ARAB"]
    assert [r["priority"] for r in regions] == [1, 2, 3, 4]

    # Verify country counts
    country_counts = {r["code"]: len(r["countries"]) for r in regions}
    assert country_counts["PK"] == 1
    assert country_counts["EU"] == 9
    assert country_counts["ASIA"] == 7
    assert country_counts["ARAB"] == 8
    assert sum(country_counts.values()) == 25


def test_config_endpoints():
    """Test getting and updating the job search preferences."""
    # GET config
    response = client.get("/api/v1/config")
    assert response.status_code == 200
    config = response.json()
    assert config["global_daily_cap"] == 30
    assert config["max_job_age_hours"] == 72
    assert config["min_match_score"] == 75

    # PUT config
    update_payload = {
        "min_match_score": 80,
        "is_emergency_paused": True
    }
    put_response = client.put("/api/v1/config", json=update_payload)
    assert put_response.status_code == 200
    updated = put_response.json()
    assert updated["min_match_score"] == 80
    assert updated["is_emergency_paused"] is True

    # Reset back to unpaused
    client.put("/api/v1/config", json={"is_emergency_paused": False, "min_match_score": 75})


def test_agent_pause_and_resume():
    """Test agent emergency pause and resume controls."""
    # Pause
    pause_res = client.post("/api/v1/agent/pause")
    assert pause_res.status_code == 200
    assert pause_res.json()["is_emergency_paused"] is True

    # Resume
    resume_res = client.post("/api/v1/agent/resume")
    assert resume_res.status_code == 200
    assert resume_res.json()["is_emergency_paused"] is False


def test_daily_report_structure():
    """Test daily report endpoint structure."""
    response = client.get("/api/v1/reports/daily")
    assert response.status_code == 200
    report = response.json()
    assert report["timezone"] == "Asia/Karachi"
    assert report["max_quota"] == 30
    assert "region_breakdown" in report
    for reg in ["PK", "EU", "ASIA", "ARAB"]:
        assert reg in report["region_breakdown"]
