"""
Unit tests for data_fetch.py using unittest.
Tests API fetching, environment token loading, capitals list integrity,
DataFrame conversions, and output CSV persistence without altering production data.
"""

import os
import sys
import time
import numbers
import unittest
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.data_fetch import (
    WAQI_TOKEN,
    WORLD_CAPITALS,
    RAW_DATA_PATH,
    fetch_city_aqi,
    fetch_all_cities,
)


class TestDataFetch(unittest.TestCase):
    """Test suite for WAQI data fetcher module."""

    def test_waqi_token_loaded(self):
        """Test that WAQI_TOKEN is set and non-empty in environment."""
        self.assertIsNotNone(WAQI_TOKEN, "WAQI_API_KEY not found in environment")
        self.assertNotEqual(WAQI_TOKEN.strip(), "", "WAQI_API_KEY not found in environment")

    def test_cities_list_not_empty(self):
        """Test that WORLD_CAPITALS list contains exactly 20 unique strings."""
        self.assertGreaterEqual(len(WORLD_CAPITALS), 1, "WORLD_CAPITALS list is empty")
        self.assertTrue(all(isinstance(city, str) for city in WORLD_CAPITALS), "Not all items in WORLD_CAPITALS are strings")
        self.assertEqual(len(WORLD_CAPITALS), len(set(WORLD_CAPITALS)), "Duplicate city names found in WORLD_CAPITALS")
        self.assertEqual(len(WORLD_CAPITALS), 20, "WORLD_CAPITALS list length is not 20")

    def test_fetch_city_aqi_returns_dataframe(self):
        """Test fetching AQI for London returns a DataFrame with expected columns and city name."""
        df = fetch_city_aqi("London")
        self.assertIsInstance(df, pd.DataFrame, "Return value is not a pandas DataFrame")

        if not df.empty:
            expected_cols = ["city", "date", "aqi", "pm25", "pm10", "no2", "co"]
            self.assertListEqual(list(df.columns), expected_cols, f"DataFrame columns do not match {expected_cols}")
            self.assertEqual(df["city"].iloc[0], "London", "City column value does not match 'London'")

    def test_fetch_city_aqi_invalid_city(self):
        """Test fetching AQI for an invalid city returns an empty DataFrame gracefully without raising exceptions."""
        df = fetch_city_aqi("INVALIDCITYXYZ123")
        self.assertIsInstance(df, pd.DataFrame, "Return value is not a pandas DataFrame")
        self.assertTrue(df.empty, "Returned DataFrame for invalid city is not empty")

    def test_fetch_city_aqi_aqi_is_numeric(self):
        """Test fetching AQI for Tokyo returns a numeric AQI within valid 0-999 range."""
        df = fetch_city_aqi("Tokyo")
        if not df.empty and df["aqi"].notna().iloc[0]:
            aqi_val = df["aqi"].iloc[0]
            self.assertTrue(isinstance(aqi_val, (int, float, numbers.Number)), "AQI value is not numeric")
            self.assertTrue(0 <= float(aqi_val) <= 999, f"AQI value {aqi_val} is outside valid range [0, 999]")

    def test_output_csv_created(self):
        """Test fetch_all_cities creates raw CSV file with expected columns, rows, and unique cities."""
        df = fetch_all_cities()
        self.assertTrue(os.path.exists(RAW_DATA_PATH), f"CSV file {RAW_DATA_PATH} was not created")
        self.assertGreater(len(df), 0, "Fetched CSV has 0 rows")

        expected_cols = ["city", "date", "aqi", "pm25", "pm10", "no2", "co"]
        self.assertListEqual(list(df.columns), expected_cols, f"CSV columns do not match expected {expected_cols}")
        self.assertEqual(len(df["city"]), len(df["city"].unique()), "Duplicate city names found in saved CSV")

    def test_no_random_data(self):
        """Test fetch_all_cities returns consistent non-random data across two runs separated by a sleep interval."""
        df1 = fetch_all_cities()
        time.sleep(5)
        df2 = fetch_all_cities()

        common_cities = set(df1["city"]).intersection(set(df2["city"]))
        self.assertGreater(len(common_cities), 0, "No overlapping cities found between consecutive fetch runs")

        for city in common_cities:
            aqi1 = df1.loc[df1["city"] == city, "aqi"].values[0]
            aqi2 = df2.loc[df2["city"] == city, "aqi"].values[0]
            if pd.notna(aqi1) and pd.notna(aqi2):
                self.assertLessEqual(abs(float(aqi1) - float(aqi2)), 50, f"AQI value for {city} varied wildly between runs: {aqi1} vs {aqi2}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
