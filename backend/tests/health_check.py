"""
Health check script for Air Quality Analyzer system.
Runs all core system features end-to-end and reports live status PASS/FAIL for each check.
"""

import os
import sys
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.src.data_fetch import fetch_city_aqi, fetch_all_cities, WORLD_CAPITALS, WAQI_TOKEN, RAW_DATA_PATH
from backend.src.cleaning import load_raw_data, standardize_columns, flag_data_quality, handle_missing_values, run_cleaning_pipeline, PROCESSED_DATA_PATH
from backend.src.db_writer import (
    get_db_client,
    write_aqi_data,
    verify_db_contents,
    MONGO_URI
)

results = []


def check(label: str, condition: bool):
    """Evaluates condition, logs PASS/FAIL result, and prints immediate status line."""
    status = "[PASS]" if condition else "[FAIL]"
    message = f"{status} {label}"
    results.append((status, message))
    print(message)


def run_health_check():
    """Runs end-to-end system health checks for data fetcher, cleaning, and MongoDB writer."""
    print("==========================================")
    print("AIR QUALITY ANALYZER — HEALTH CHECK")
    print("==========================================")

    # Check 1: WAQI token is loaded and not empty
    check("WAQI API token loaded", bool(WAQI_TOKEN and str(WAQI_TOKEN).strip()))

    # Check 2: WORLD_CAPITALS has 20 unique string items
    check("City list has 20 unique cities", len(WORLD_CAPITALS) == 20 and len(set(WORLD_CAPITALS)) == 20 and all(isinstance(c, str) for c in WORLD_CAPITALS))

    # Check 3: fetch_city_aqi("London") returns non-empty DataFrame
    df_london = fetch_city_aqi("London")
    check("fetch_city_aqi(London) returned data", isinstance(df_london, pd.DataFrame) and not df_london.empty)

    # Check 4: fetch_city_aqi("INVALIDXYZ") returns empty DataFrame
    df_invalid = fetch_city_aqi("INVALIDXYZ")
    check("fetch_city_aqi(INVALID) handled gracefully", isinstance(df_invalid, pd.DataFrame) and df_invalid.empty)

    # Check 5: fetch_all_cities() runs and CSV exists after
    df_raw_fetch = fetch_all_cities()
    check("fetch_all_cities() saved aqi_raw.csv", os.path.exists(RAW_DATA_PATH) and os.path.getsize(RAW_DATA_PATH) > 0)

    # Check 6: load_raw_data() returns DataFrame with 20+ rows
    df_raw = load_raw_data(RAW_DATA_PATH)
    check(f"load_raw_data() loaded {len(df_raw)} rows", isinstance(df_raw, pd.DataFrame) and len(df_raw) >= 20)

    # Check 7: standardize_columns() adds days_since_update column
    df_std = standardize_columns(df_raw)
    check("standardize_columns() added days_since_update column", "days_since_update" in df_std.columns)

    # Check 8: standardize_columns() adds freshness column
    check("standardize_columns() added freshness columns", "freshness" in df_std.columns)

    # Check 9: flag_data_quality() adds is_high_pollution column
    df_flagged = flag_data_quality(df_std)
    check("flag_data_quality() added is_high_pollution column", "is_high_pollution" in df_flagged.columns)

    # Check 10: flag_data_quality() adds data_quality column
    check("flag_data_quality() added quality columns", "data_quality" in df_flagged.columns)

    # Check 11: handle_missing_values() reduces null count in pm25
    df_clean_step = handle_missing_values(df_flagged)
    check("handle_missing_values() filled missing data", df_clean_step["pm25"].isnull().sum() == 0)

    # Check 12: run_cleaning_pipeline() creates aqi_clean.csv
    df_pipeline = run_cleaning_pipeline()
    check("run_cleaning_pipeline() saved aqi_clean.csv", os.path.exists(PROCESSED_DATA_PATH) and os.path.getsize(PROCESSED_DATA_PATH) > 0)

    # Check 13: Row count is same before and after cleaning
    check("No rows were deleted during cleaning", len(df_raw) == len(df_pipeline))

    # Check 14: aqi column has zero nulls in final dataset
    check("No null AQI values in final dataset", df_pipeline["aqi"].isnull().sum() == 0)

    # Check 15: All freshness values are from valid set
    valid_freshness = {"Live", "Recent", "Aging", "Stale", "Unknown"}
    check("All freshness values are from valid set", set(df_pipeline["freshness"].dropna()).issubset(valid_freshness))

    # Check for pollutant columns after filling
    for col in ["pm25", "pm10", "no2", "co"]:
        null_cities = df_pipeline[df_pipeline[col].isnull()]["city"].tolist()
        if null_cities:
            for c in null_cities:
                check(f"{c} — {col.upper()} still null after filling", False)

    # Check 16: MONGO_URI loaded and valid
    check("MONGO_URI loaded and valid", MONGO_URI is not None and MONGO_URI.startswith("mongodb+srv://"))

    # Check 17: MongoDB Atlas connection
    try:
        client = get_db_client()
        client.close()
        check("MongoDB Atlas connection", True)
    except Exception:
        check("MongoDB Atlas connection", False)

    # Check 18: write_aqi_data handles empty input
    result = write_aqi_data(pd.DataFrame())
    check("write_aqi_data handles empty input", result == 0)

    # Check 19: verify_db_contents returns int >= 0
    count = verify_db_contents()
    check("verify_db_contents returns int >= 0", isinstance(count, int) and count >= 0)

    # Check 20: Database has cities stored
    check("Database has at least 1 city stored", count > 0)

    passed_count = sum(1 for s, _ in results if s == "[PASS]")
    failed_count = sum(1 for s, _ in results if s == "[FAIL]")
    total_count = len(results)

    print("==========================================")
    print("HEALTH CHECK COMPLETE")
    print(f"Passed: {passed_count} / {total_count}")
    print(f"Failed: {failed_count}")
    print("==========================================")

    if failed_count == 0:
        print("All systems operational — ready for API layer")
    else:
        print("Fix failed checks before building API layer")


if __name__ == "__main__":
    run_health_check()
