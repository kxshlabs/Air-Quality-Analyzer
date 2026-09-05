"""
WAQI Data Fetcher Module for Air Quality Analyzer.
Pulls real-time air quality measurements (AQI, PM2.5, PM10, NO2, CO) from 
the World Air Quality Index (WAQI) API for 20 major Indian cities and 
saves the aggregated dataset to CSV format.
"""

# ==============================================================================
# SECTION 1 — Imports and Setup
# Imports required libraries, loads environment variables, and configures
# API base settings and target cities list.
# ==============================================================================

import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Read WAQI API Token from environment variables
WAQI_TOKEN = os.getenv("WAQI_API_KEY")

# Base URL for WAQI Feed API
BASE_URL = "https://api.waqi.info/feed"

# Full list of 20 Indian cities to monitor
CITIES = [
    "Delhi", "Mumbai", "Pune", "Bangalore", "Chennai", "Hyderabad",
    "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Kanpur", "Patna",
    "Bhopal", "Nagpur", "Surat", "Vadodara", "Amritsar", "Varanasi",
    "Indore", "Agra"
]


# ==============================================================================
# SECTION 2 — fetch_city_aqi(city_name) function
# Fetches live AQI and pollutant concentrations for a single city from WAQI API.
# ==============================================================================

def fetch_city_aqi(city_name: str) -> pd.DataFrame:
    """
    Fetches real-time AQI and individual pollutant readings for a specific city.

    Parameters:
        city_name (str): Name of the city to query.

    Returns:
        pd.DataFrame: A single-row DataFrame with keys [city, date, aqi, pm25, pm10, no2, co]
                      if successful, or an empty DataFrame with the same columns if
                      unreachable or no data is found.
    """
    empty_df = pd.DataFrame(columns=["city", "date", "aqi", "pm25", "pm10", "no2", "co"])

    try:
        # Step 1: Build the API URL
        url = f"{BASE_URL}/{city_name}/"

        # Step 2: Make GET request with params dict and 10-second timeout
        response = requests.get(url, params={"token": WAQI_TOKEN}, timeout=10)

        # Step 3: Check HTTP status code
        if response.status_code != 200:
            print(f"[Warning] Could not reach WAQI API for {city_name} — HTTP {response.status_code}")
            return empty_df

        # Step 4: Parse JSON response
        data = response.json()

        # Step 5: Check API response status
        if data.get("status") != "ok":
            print(f"[Warning] No data returned for {city_name} — status: {data.get('status')}")
            return empty_df

        # Step 6: Extract actual data from data["data"]
        payload = data.get("data", {})
        
        aqi_val = payload.get("aqi")
        iaqi = payload.get("iaqi", {})
        
        pm25 = iaqi.get("pm25", {}).get("v", None)
        pm10 = iaqi.get("pm10", {}).get("v", None)
        no2 = iaqi.get("no2", {}).get("v", None)
        co = iaqi.get("co", {}).get("v", None)
        date_str = payload.get("time", {}).get("s")

        # Step 7: Build clean dictionary
        reading = {
            "city": city_name,
            "date": date_str,
            "aqi": aqi_val,
            "pm25": pm25,
            "pm10": pm10,
            "no2": no2,
            "co": co
        }

        # Step 8: Convert to DataFrame and return
        return pd.DataFrame([reading])

    except Exception as e:
        # Step 9: Catch any runtime exception
        print(f"[Error] Exception while fetching {city_name}: {e}")
        return empty_df


# ==============================================================================
# SECTION 3 — fetch_all_cities() function
# Orchestrates fetching across all 20 target cities, manages rate limiting,
# and saves the consolidated raw data to CSV.
# ==============================================================================

def fetch_all_cities() -> pd.DataFrame:
    """
    Loops through all 20 target Indian cities, calls fetch_city_aqi() for each,
    aggregates valid results, and exports the data to data/raw/aqi_raw.csv.

    Returns:
        pd.DataFrame: Combined DataFrame containing readings for all valid cities,
                      or an empty DataFrame if no data could be retrieved.
    """
    # Step 1: Start notification
    print(f"Starting WAQI data fetch for {len(CITIES)} Indian cities...")

    # Step 2: Container for city DataFrames
    all_dfs = []
    skipped_cities = []

    # Step 3: Loop through cities with index
    for idx, city in enumerate(CITIES, start=1):
        print(f"[{idx}/{len(CITIES)}] Fetching {city}...")
        df_city = fetch_city_aqi(city)

        if not df_city.empty:
            all_dfs.append(df_city)
            print(f"  [+] {city} — AQI: {df_city['aqi'].values[0]}")
        else:
            skipped_cities.append(city)
            print(f"  [-] {city} — No data available, skipping")

        # Rate limiting delay (0.5s)
        time.sleep(0.5)

    # Step 4: Create output directory
    os.makedirs("data/raw", exist_ok=True)

    # Step 5: Define output path
    output_path = "data/raw/aqi_raw.csv"

    # Step 6: Process combined data if not empty
    if all_dfs:
        combined_df = pd.concat(all_dfs, ignore_index=True)
        combined_df = combined_df[["city", "date", "aqi", "pm25", "pm10", "no2", "co"]]
        
        # Convert numeric columns safely (coerce non-numeric strings like '-' to NaN)
        for col in ["aqi", "pm25", "pm10", "no2", "co"]:
            combined_df[col] = pd.to_numeric(combined_df[col], errors="coerce")

        combined_df.to_csv(output_path, index=False)
        print(f"Done! {len(combined_df)} cities saved to {output_path}")
        
        if skipped_cities:
            print(f"Skipped cities ({len(skipped_cities)}): {', '.join(skipped_cities)}")
            
        return combined_df

    # Step 7: Handle case where no data was fetched
    else:
        print("[Notice] No data fetched for any city. Check your WAQI token in .env file.")
        empty_df = pd.DataFrame(columns=["city", "date", "aqi", "pm25", "pm10", "no2", "co"])
        empty_df.to_csv(output_path, index=False)
        return empty_df


# ==============================================================================
# SECTION 4 — Main block
# Entry point script execution displaying data sample and summary analytics.
# ==============================================================================

if __name__ == "__main__":
    print("=" * 50)
    print("WAQI Air Quality Data Fetcher")
    print("Data source: World Air Quality Index (waqi.info)")
    print("=" * 50)
    
    df = fetch_all_cities()
    
    if not df.empty:
        print("\nSample of fetched data:")
        print(df.to_string(index=False))
        print(f"\nTotal cities with real data: {len(df)}")
        print(f"Cities with PM2.5 reading: {df['pm25'].notna().sum()}")
        print(f"Cities with PM10 reading: {df['pm10'].notna().sum()}")
        print(f"Highest AQI city: {df.loc[df['aqi'].idxmax(), 'city']} — AQI {df['aqi'].max()}")
        print(f"Lowest AQI city: {df.loc[df['aqi'].idxmin(), 'city']} — AQI {df['aqi'].min()}")
