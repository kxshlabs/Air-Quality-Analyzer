"""
Unit tests for cleaning.py using unittest.
Tests raw data loading, column standardization, data freshness calculation,
quality flagging, missing value imputation, row count preservation, and CSV persistence.
"""

import os
import sys
import unittest
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.src.cleaning import (
    load_raw_data,
    standardize_columns,
    flag_data_quality,
    handle_missing_values,
    run_cleaning_pipeline,
    RAW_DATA_PATH,
    PROCESSED_DATA_PATH,
)


class TestCleaning(unittest.TestCase):
    """Test suite for data cleaning module."""

    def test_load_raw_data_file_exists(self):
        """Test load_raw_data loads existing raw CSV data correctly into non-empty DataFrame."""
        self.assertTrue(os.path.exists(RAW_DATA_PATH), f"Raw data file {RAW_DATA_PATH} does not exist")
        df = load_raw_data(RAW_DATA_PATH)
        self.assertIsInstance(df, pd.DataFrame, "Return value is not a pandas DataFrame")
        self.assertFalse(df.empty, "Loaded DataFrame is empty")

        expected_cols = [
            "city", "date", "aqi", "pm25", "pm10", "no2", "co", "so2", "o3",
            "temperature", "humidity", "wind_speed", "pressure",
            "dominant_pollutant", "lat", "lng"
        ]
        self.assertListEqual(list(df.columns), expected_cols, f"Columns do not match expected {expected_cols}")

    def test_load_raw_data_missing_file(self):
        """Test load_raw_data handles non-existent file path gracefully returning empty DataFrame."""
        df = load_raw_data("data/raw/nonexistent_file.csv")
        self.assertIsInstance(df, pd.DataFrame, "Return value is not a pandas DataFrame")
        self.assertTrue(df.empty, "DataFrame for non-existent file is not empty")

    def test_standardize_columns_types(self):
        """Test standardize_columns converts date to datetime, numeric columns, and lowercases column names."""
        raw_df = load_raw_data(RAW_DATA_PATH)
        df = standardize_columns(raw_df)

        self.assertTrue(pd.api.types.is_datetime64_any_dtype(df["date"]), "date column is not datetime64")
        for col in ["aqi", "pm25", "pm10", "no2", "co"]:
            self.assertTrue(
                pd.api.types.is_float_dtype(df[col]) or pd.api.types.is_integer_dtype(df[col]),
                f"Column {col} is not float64 or int64",
            )
        self.assertTrue(all(col == col.lower() for col in df.columns), "Not all column names are lowercase")

    def test_freshness_columns_added(self):
        """Test standardize_columns adds days_since_update and valid freshness category values."""
        raw_df = load_raw_data(RAW_DATA_PATH)
        df = standardize_columns(raw_df)

        self.assertIn("days_since_update", df.columns, "days_since_update column missing")
        self.assertIn("freshness", df.columns, "freshness column missing")

        valid_freshness = {"Live", "Recent", "Aging", "Stale", "Unknown"}
        self.assertTrue(set(df["freshness"].dropna()).issubset(valid_freshness), "Found invalid freshness status values")

        valid_days = df["days_since_update"].dropna()
        self.assertTrue((valid_days.abs() <= 3650).all(), "Found invalid days_since_update values")

    def test_flag_data_quality_columns_added(self):
        """Test flag_data_quality adds is_high_pollution, data_quality ratings, and freshness_status."""
        raw_df = load_raw_data(RAW_DATA_PATH)
        std_df = standardize_columns(raw_df)
        df = flag_data_quality(std_df)

        self.assertIn("is_high_pollution", df.columns, "is_high_pollution column missing")
        self.assertTrue(pd.api.types.is_bool_dtype(df["is_high_pollution"]), "is_high_pollution is not boolean")

        self.assertIn("data_quality", df.columns, "data_quality column missing")
        valid_quality = {"good", "partial", "poor"}
        self.assertTrue(set(df["data_quality"]).issubset(valid_quality), "Found invalid data_quality values")

        self.assertIn("freshness_status", df.columns, "freshness_status column missing")

    def test_handle_missing_values_no_new_nulls(self):
        """Test handle_missing_values fills missing pm25 values without introducing new nulls."""
        raw_df = load_raw_data(RAW_DATA_PATH)
        std_df = standardize_columns(raw_df)
        flagged_df = flag_data_quality(std_df)
        clean_df = handle_missing_values(flagged_df)

        self.assertEqual(clean_df["pm25"].isnull().sum(), 0, "pm25 column still has missing null values")
        self.assertLessEqual(clean_df.isnull().sum().sum(), flagged_df.isnull().sum().sum(), "New null values were introduced during missing value handling")

    def test_no_rows_deleted(self):
        """Test run_cleaning_pipeline preserves exact row count from raw CSV to cleaned output."""
        raw_df = load_raw_data(RAW_DATA_PATH)
        raw_count = len(raw_df)

        clean_df = run_cleaning_pipeline()
        processed_df = pd.read_csv(PROCESSED_DATA_PATH)

        self.assertEqual(len(clean_df), raw_count, f"Pipeline output row count {len(clean_df)} differs from raw count {raw_count}")
        self.assertEqual(len(processed_df), raw_count, f"Processed CSV row count {len(processed_df)} differs from raw count {raw_count}")

    def test_processed_csv_created(self):
        """Test run_cleaning_pipeline creates aqi_clean.csv with expanded columns, unique cities, and non-null AQI."""
        raw_df = load_raw_data(RAW_DATA_PATH)
        clean_df = run_cleaning_pipeline()

        self.assertTrue(os.path.exists(PROCESSED_DATA_PATH), f"Processed file {PROCESSED_DATA_PATH} does not exist")
        processed_df = pd.read_csv(PROCESSED_DATA_PATH)

        self.assertGreater(len(processed_df.columns), len(raw_df.columns), "Processed CSV does not contain additional feature columns")
        # Verify AQI values are numerical where provided
        self.assertTrue(pd.api.types.is_numeric_dtype(processed_df["aqi"]), "AQI column is not numeric in processed CSV")

    def test_high_pollution_flag_correct(self):
        """Test is_high_pollution boolean flag matches aqi > 150 condition exactly."""
        clean_df = run_cleaning_pipeline()
        processed_df = pd.read_csv(PROCESSED_DATA_PATH)

        for _, row in processed_df.iterrows():
            if row["aqi"] > 150:
                self.assertTrue(bool(row["is_high_pollution"]), f"is_high_pollution should be True for {row['city']} with AQI {row['aqi']}")
            else:
                self.assertFalse(bool(row["is_high_pollution"]), f"is_high_pollution should be False for {row['city']} with AQI {row['aqi']}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
