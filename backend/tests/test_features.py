"""
Feature test suite for all Air Quality Analyzer API endpoints.
Reads BASE_URL from API_URL env var; defaults to Render deployment.
Exit code 1 if any test fails.
"""

import os
import sys

import requests

BASE_URL = os.getenv("API_URL", "https://air-quality-analyzer-mezg.onrender.com")

session = requests.Session()
passed = 0
total = 5


def result(name, ok, detail=""):
    global passed
    status = "[PASS]" if ok else f"[FAIL]{' ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â ' + detail if detail else ''}"
    print(f"{status} {name}")
    if ok:
        passed += 1


def test_health():
    r = session.get(f"{BASE_URL}/health", timeout=30)
    ok = r.status_code == 200 and r.json().get("status") == "ok"
    result("GET /health returns {status: ok}", ok)


def test_aqi_all():
    r = session.get(f"{BASE_URL}/api/aqi", timeout=30)
    data = r.json()
    ok = r.status_code == 200 and isinstance(data.get("data"), list) and len(data["data"]) > 0
    if ok:
        city = data["data"][0]
        ok = all(k in city for k in ("aqi", "city", "freshness"))
    result("GET /api/aqi returns city array with aqi, city, freshness", ok)


def test_aqi_fresh():
    r = session.get(f"{BASE_URL}/api/aqi/fresh", timeout=30)
    data = r.json()
    ok = r.status_code == 200 and "data" in data
    result("GET /api/aqi/fresh returns updated data", ok)


def test_rankings():
    r = session.get(f"{BASE_URL}/api/aqi/rankings", timeout=30)
    data = r.json()
    rankings = data.get("rankings", [])
    ok = r.status_code == 200 and isinstance(rankings, list) and len(rankings) > 1
    if ok:
        ok = all(c.get("aqi") is not None for c in rankings)
    if ok:
        ok = rankings[0]["aqi"] >= rankings[-1]["aqi"]
    result("GET /api/aqi/rankings returns sorted array by AQI with no null aqi", ok)


def test_city_delhi():
    r = session.get(f"{BASE_URL}/api/aqi/delhi", timeout=30)
    data = r.json()
    ok = r.status_code == 200 and data.get("city", "").lower() == "delhi"
    result("GET /api/aqi/delhi returns single city object", ok)


def main():
    print("==========================================")
    print("AIR QUALITY ANALYZER - FEATURE TESTS")
    print(f"Target: {BASE_URL}")
    print("==========================================")
    for test in (test_health, test_aqi_all, test_aqi_fresh, test_rankings, test_city_delhi):
        try:
            test()
        except Exception as e:
            name = test.__name__.replace("test_", "").replace("_", " ")
            result(name, False, str(e))
    print("==========================================")
    print(f"{passed}/{total} tests passed")
    print("==========================================")
    if passed < total:
        sys.exit(1)


if __name__ == "__main__":
    main()
