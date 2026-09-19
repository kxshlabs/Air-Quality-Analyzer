"""
Health check for all Air Quality Analyzer API endpoints.
Reads BASE_URL from API_URL env var; defaults to Render deployment.
Exit code 1 if any check fails.
"""

import json
import os
import sys
import urllib.request

BASE_URL = os.getenv("API_URL", "https://air-quality-analyzer.onrender.com")

ENDPOINTS = [
    "/health",
    "/api/aqi",
    "/api/aqi/fresh",
    "/api/aqi/rankings",
    "/api/aqi/delhi",
]

results = []


def check(endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            body = r.read()
            json.loads(body)
            status = "[PASS]"
    except Exception as e:
        status = f"[FAIL] ({e})"
    label = f"{status} {endpoint}"
    results.append(status.startswith("[PASS]"))
    print(label)


def main():
    print("==========================================")
    print("AIR QUALITY ANALYZER — API HEALTH CHECK")
    print(f"Target: {BASE_URL}")
    print("==========================================")
    for ep in ENDPOINTS:
        check(ep)
    passed = sum(results)
    total = len(results)
    print("==========================================")
    print(f"Passed: {passed} / {total}")
    print("==========================================")
    if passed < total:
        sys.exit(1)


if __name__ == "__main__":
    main()
