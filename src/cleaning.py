"""
Data Cleaning and Preprocessing Module for Air Quality Analyzer.
Processes raw WAQI snapshot data — one row per city.
Handles type standardization, freshness tracking,
national average imputation, and data quality flagging.
Data source: World Air Quality Index (waqi.info)
"""

import os
import pandas as pd
import numpy as np
from datetime import datetime, timezone


def load_raw_data(file_path=os.path.join("data", "raw", "aqi_raw.csv")):
    """
    Loads raw AQI CSV data into a pandas DataFrame.

    Parameters:
        file_path (str): Path to raw CSV file.

    Returns:
        pd.DataFrame: Raw loaded dataset.
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
        return df

    cleaned_df = df.copy()

    # Step 1: Lowercase column names and strip whitespace
    cleaned_df.columns = [col.strip().lower() for col in cleaned_df.columns]

    # Step 2: Convert date column to datetime
    if "date" in cleaned_df.columns:
        cleaned_df["date"] = pd.to_datetime(cleaned_df["date"], errors="coerce", utc=False)

    # Step 3: Convert pollutant columns to numeric
    pollutant_cols = ["aqi", "pm25", "pm10", "no2", "co"]
    for col in pollutant_cols:
        if col in cleaned_df.columns:
            cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
        else:
            cleaned_df[col] = np.nan

    # Step 4: Add freshness columns
    now = pd.Timestamp.now()
    cleaned_df["days_since_update"] = (now - cleaned_df["date"]).dt.days

    def categorize_freshness(days):
        if pd.isna(days):
            return "Unknown"
        elif days <= 1:
            return "Live"
        elif days <= 7:
            return "Recent"
        elif days <= 30:
            return "Aging"
        else:
            return "Stale"

    cleaned_df["freshness"] = cleaned_df["days_since_update"].apply(categorize_freshness)

    # Step 5: Print freshness report
    print("\n--- Data Freshness Report ---")
    live_count = (cleaned_df["freshness"] == "Live").sum()
    recent_count = (cleaned_df["freshness"] == "Recent").sum()
    aging_count = (cleaned_df["freshness"] == "Aging").sum()
    stale_count = (cleaned_df["freshness"] == "Stale").sum()

    print(f"Freshness Breakdown: Live={live_count}, Recent={recent_count}, Aging={aging_count}, Stale={stale_count}")

    stale_or_aging = cleaned_df[cleaned_df["freshness"].isin(["Stale", "Aging"])]
    if not stale_or_aging.empty:
        print("Cities with Stale or Aging data:")
        for _, row in stale_or_aging.iterrows():
            print(f"  - {row['city']}: {row['days_since_update']} days since update ({row['freshness']})")

    # Step 6: Return DataFrame
    return cleaned_df


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
        return df

    cleaned_df = df.copy()
    pollutant_cols = ["pm25", "pm10", "no2", "co"]

    # Step 1: Add is_high_pollution column (threshold 150 for world cities)
    cleaned_df["is_high_pollution"] = cleaned_df["aqi"] > 150

    # Step 2: Add data_quality column based on present raw pollutants BEFORE filling
    def evaluate_quality(row):
        valid_count = sum(pd.notna(row[col]) for col in pollutant_cols)
        if valid_count == 4:
            return "good"
        elif valid_count in [2, 3]:
            return "partial"
        else:
            return "poor"

    cleaned_df["data_quality"] = cleaned_df.apply(evaluate_quality, axis=1)

    # Step 3: Add freshness_status column copying freshness
    cleaned_df["freshness_status"] = cleaned_df["freshness"]

    # Step 4: Print summary
    high_pol_count = cleaned_df["is_high_pollution"].sum()
    good_cities = cleaned_df[cleaned_df["data_quality"] == "good"]["city"].tolist()
    partial_cities = cleaned_df[cleaned_df["data_quality"] == "partial"]["city"].tolist()
    poor_cities = cleaned_df[cleaned_df["data_quality"] == "poor"]["city"].tolist()

    print("\n--- Data Quality & Pollution Summary ---")
    print(f"High pollution cities (AQI > 150): {high_pol_count}")
    print(f"Good data quality (4/4 pollutants): {len(good_cities)} cities -> {', '.join(good_cities)}")
    print(f"Partial data quality (2-3 pollutants): {len(partial_cities)} cities -> {', '.join(partial_cities)}")
    print(f"Poor data quality (0-1 pollutants): {len(poor_cities)} cities -> {', '.join(poor_cities)}")

    # Step 5: Return DataFrame
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
        return df

    cleaned_df = df.copy()
    pollutant_cols = ["pm25", "pm10", "no2", "co"]

    # Step 1: Print missing value report
    print("\n--- Missing Value Report ---")
    for col in pollutant_cols:
        missing_count = cleaned_df[col].isnull().sum()
        print(f"{col}: {missing_count} cities missing")

    print("\n--- Imputation Process ---")
    total_filled = 0

    # Step 2: Impute missing pollutant values with global average
    for col in pollutant_cols:
        valid_readings = cleaned_df[col].dropna()

        if not valid_readings.empty:
            avg_value = valid_readings.mean()
            missing_mask = cleaned_df[col].isnull()

            for idx in cleaned_df[missing_mask].index:
                city = cleaned_df.loc[idx, "city"]
                fill_value = round(avg_value, 2)
                cleaned_df.loc[idx, col] = fill_value
                total_filled += 1
                print(f"[Fill] {city} — {col} filled with national average: {fill_value}")
        else:
            print(f"[Warning] {col} has no valid readings across any city — leaving as NaN")

    print(f"\n[Info] Successfully filled {total_filled} missing pollutant values across all cities.")

    # Step 3: Return filled DataFrame
    return cleaned_df


def save_processed_data(df, output_path=os.path.join("data", "processed", "aqi_clean.csv")):
    """
    Saves cleaned DataFrame to CSV and displays all 20 rows in terminal.
    """
    if df.empty:
        print("[Warning] No cleaned data available to save.")
        return

    output_dir = os.path.dirname(output_path)
    os.makedirs(output_dir, exist_ok=True)

    df.to_csv(output_path, index=False)
    print(f"\n==========================================")
    print(f"Data cleaning pipeline complete!")
    print(f"Saved {len(df)} cleaned rows to {output_path}")
    print(f"==========================================")

    print("\nFull Processed Dataset:")
    print(df.head(20).to_string(index=False))


def run_cleaning_pipeline():
    """
    Master pipeline execution function in exact required order.
    """
    print("Starting Air Quality Data Cleaning Pipeline...")
    raw_df = load_raw_data()
    std_df = standardize_columns(raw_df)
    flagged_df = flag_data_quality(std_df)      # MUST run BEFORE handle_missing_values
    clean_df = handle_missing_values(flagged_df)
    save_processed_data(clean_df)

    return clean_df


if __name__ == "__main__":
    run_cleaning_pipeline()
