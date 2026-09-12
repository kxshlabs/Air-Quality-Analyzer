"""
Data Cleaning and Preprocessing Module for Air Quality Analyzer.
Processes raw WAQI snapshot data — one row per city.
Handles type standardization, freshness tracking,
national average imputation, and data quality flagging.
Data source: World Air Quality Index (waqi.info)
"""

import os
import numpy as np
import pandas as pd

RAW_DATA_PATH = os.path.join("data", "raw", "aqi_raw.csv")
PROCESSED_DATA_PATH = os.path.join("data", "processed", "aqi_clean.csv")
POLLUTANT_COLS = ["pm25", "pm10", "no2", "co"]
NUMERIC_COLS = ["aqi"] + POLLUTANT_COLS


def load_raw_data(file_path=RAW_DATA_PATH):
    """
    Loads raw AQI CSV data into a pandas DataFrame.

    Parameters:
        file_path (str): Path to raw CSV file.

    Returns:
        pd.DataFrame: Raw loaded dataset or empty DataFrame if not found.
    """
    if not os.path.exists(file_path):
        print(f"[Error] Raw data file not found at {file_path}")
        return pd.DataFrame()

    try:
        df = pd.read_csv(file_path)
        print(f"[Info] Loaded raw dataset with {len(df)} rows and {len(df.columns)} columns.")
        return df
    except Exception as e:
        print(f"[Error] Failed to load raw data: {e}")
        return pd.DataFrame()


def categorize_freshness(days):
    """Categorize days since update into freshness status string."""
    if pd.isna(days):
        return "Unknown"
    if days <= 1:
        return "Live"
    if days <= 7:
        return "Recent"
    if days <= 30:
        return "Aging"
    return "Stale"


def standardize_columns(df):
    """
    Standardizes column names, converts dates to datetime, converts pollutants to numeric,
    and calculates data freshness metrics.

    Parameters:
        df (pd.DataFrame): Input raw DataFrame.

    Returns:
        pd.DataFrame: Standardized DataFrame with freshness columns added.
    """
    if df.empty:
        return df.copy()

    cleaned_df = df.copy()
    cleaned_df.columns = [col.strip().lower() for col in cleaned_df.columns]

    if "date" in cleaned_df.columns:
        cleaned_df["date"] = pd.to_datetime(cleaned_df["date"], errors="coerce")

    for col in NUMERIC_COLS:
        if col in cleaned_df.columns:
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
        else:
            cleaned_df[col] = np.nan

    now = pd.Timestamp.now()
    cleaned_df["days_since_update"] = (now - cleaned_df["date"]).dt.days
    cleaned_df["freshness"] = cleaned_df["days_since_update"].apply(categorize_freshness)

    print("\n--- Data Freshness Report ---")
    counts = cleaned_df["freshness"].value_counts()
    print(f"Freshness Breakdown: Live={counts.get('Live', 0)}, Recent={counts.get('Recent', 0)}, Aging={counts.get('Aging', 0)}, Stale={counts.get('Stale', 0)}")

    stale_or_aging = cleaned_df[cleaned_df["freshness"].isin(["Stale", "Aging"])]
    if not stale_or_aging.empty:
        print("Cities with Stale or Aging data:")
        for _, row in stale_or_aging.iterrows():
            print(f"  - {row['city']}: {row['days_since_update']} days since update ({row['freshness']})")

    return cleaned_df


def evaluate_quality(valid_count):
    """Evaluate data quality rating based on number of available pollutant measurements."""
    if valid_count == 4:
        return "good"
    if valid_count in [2, 3]:
        return "partial"
    return "poor"


def flag_data_quality(df):
    """
    Flags high pollution cities and evaluates data quality based on original raw pollutant completeness.
    MUST run before missing value imputation.

    Parameters:
        df (pd.DataFrame): Standardized DataFrame before filling missing values.

    Returns:
        pd.DataFrame: DataFrame with is_high_pollution, data_quality, and freshness_status columns.
    """
    if df.empty:
        return df.copy()

    cleaned_df = df.copy()
    cleaned_df["is_high_pollution"] = cleaned_df["aqi"] > 150

    valid_counts = cleaned_df[POLLUTANT_COLS].notna().sum(axis=1)
    cleaned_df["data_quality"] = valid_counts.apply(evaluate_quality)
    cleaned_df["freshness_status"] = cleaned_df["freshness"]

    high_pol_count = cleaned_df["is_high_pollution"].sum()
    good_cities = cleaned_df[cleaned_df["data_quality"] == "good"]["city"].tolist()
    partial_cities = cleaned_df[cleaned_df["data_quality"] == "partial"]["city"].tolist()
    poor_cities = cleaned_df[cleaned_df["data_quality"] == "poor"]["city"].tolist()

    print("\n--- Data Quality & Pollution Summary ---")
    print(f"High pollution cities (AQI > 150): {high_pol_count}")
    print(f"Good data quality (4/4 pollutants): {len(good_cities)} cities -> {', '.join(good_cities)}")
    print(f"Partial data quality (2-3 pollutants): {len(partial_cities)} cities -> {', '.join(partial_cities)}")
    print(f"Poor data quality (0-1 pollutants): {len(poor_cities)} cities -> {', '.join(poor_cities)}")

    return cleaned_df


def handle_missing_values(df):
    """
    Fills missing pollutant values using national/global averages calculated across cities with valid data.

    Parameters:
        df (pd.DataFrame): Flagged DataFrame.

    Returns:
        pd.DataFrame: DataFrame with missing values imputed.
    """
    if df.empty:
        return df.copy()

    cleaned_df = df.copy()

    print("\n--- Missing Value Report ---")
    for col in POLLUTANT_COLS:
        missing_count = cleaned_df[col].isnull().sum()
        print(f"{col}: {missing_count} cities missing")

    print("\n--- Imputation Process ---")
    total_filled = 0

    for col in POLLUTANT_COLS:
        missing_mask = cleaned_df[col].isnull()
        missing_count = missing_mask.sum()

        if missing_count > 0:
            valid_readings = cleaned_df[col].dropna()
            if not valid_readings.empty:
                fill_value = round(valid_readings.mean(), 2)
                missing_cities = cleaned_df.loc[missing_mask, "city"].tolist()
                cleaned_df[col] = cleaned_df[col].fillna(fill_value)
                total_filled += missing_count

                for city in missing_cities:
                    print(f"[Fill] {city} — {col} filled with national average: {fill_value}")
            else:
                print(f"[Warning] {col} has no valid readings across any city — leaving as NaN")

    print(f"\n[Info] Successfully filled {total_filled} missing pollutant values across all cities.")
    return cleaned_df


def save_processed_data(df, output_path=PROCESSED_DATA_PATH):
    """
    Saves cleaned DataFrame to CSV and displays first 20 rows in terminal.
    """
    if df.empty:
        print("[Warning] No cleaned data available to save.")
        return

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print("\n==========================================")
    print("Data cleaning pipeline complete!")
    print(f"Saved {len(df)} cleaned rows to {output_path}")
    print("==========================================")

    print("\nFull Processed Dataset:")
    print(df.head(20).to_string(index=False))


def run_cleaning_pipeline():
    """
    Master pipeline execution function in exact required order.
    """
    print("Starting Air Quality Data Cleaning Pipeline...")
    raw_df = load_raw_data()
    std_df = standardize_columns(raw_df)
    flagged_df = flag_data_quality(std_df)
    clean_df = handle_missing_values(flagged_df)
    save_processed_data(clean_df)

    return clean_df


if __name__ == "__main__":
    run_cleaning_pipeline()
