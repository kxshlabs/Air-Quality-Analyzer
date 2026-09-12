"""
WAQI Data Fetcher Module for Air Quality Analyzer.
Pulls real-time air quality measurements (AQI, PM2.5, PM10, NO2, CO) from 
the World Air Quality Index (WAQI) API for 20 major world capitals and 
saves the aggregated dataset to CSV format.
"""

import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

WAQI_TOKEN = os.getenv("WAQI_API_KEY")
BASE_URL = "https://api.waqi.info/feed"

WORLD_CAPITALS = [
    "Beijing",
    "London",
    "Paris",
    "Tokyo",
    "Seoul",
    "Bangkok",
    "Santiago",
    "Rome",
    "Delhi",
    "São Paulo",
    "Berlin",
    "Sydney",
    "New York",
    "Ottawa",
    "Mexico City",
    "Warsaw",
    "Moscow",
    "Hanoi",
    "Singapore",
    "Ulaanbaatar"
]

DEFAULT_COLUMNS = ["city", "date", "aqi", "pm25", "pm10", "no2", "co"]
NUMERIC_COLUMNS = ["aqi", "pm25", "pm10", "no2", "co"]
RAW_DATA_PATH = os.path.join("data", "raw", "aqi_raw.csv")


def fetch_city_aqi(city_name: str) -> pd.DataFrame:
    """
    Fetches real-time AQI and individual pollutant readings for a specific city.

    Parameters:
        city_name (str): Name of the city to query.

    Returns:
        pd.DataFrame: A single-row DataFrame with keys [city, date, aqi, pm25, pm10, no2, co]
                      if successful, or an empty DataFrame if unreachable/no data.
    """
    try:
        url = f"{BASE_URL}/{city_name}/"
        response = requests.get(url, params={"token": WAQI_TOKEN}, timeout=10)

        if response.status_code != 200:
            print(f"[Warning] Could not reach WAQI API for {city_name} — HTTP {response.status_code}")
            return pd.DataFrame(columns=DEFAULT_COLUMNS)

        data = response.json()
        if data.get("status") != "ok":
            print(f"[Warning] No data returned for {city_name} — status: {data.get('status')}")
            return pd.DataFrame(columns=DEFAULT_COLUMNS)

        payload = data.get("data", {})
        iaqi = payload.get("iaqi", {})

        reading = {
            "city": city_name,
            "date": payload.get("time", {}).get("s"),
            "aqi": payload.get("aqi"),
            "pm25": iaqi.get("pm25", {}).get("v"),
            "pm10": iaqi.get("pm10", {}).get("v"),
            "no2": iaqi.get("no2", {}).get("v"),
            "co": iaqi.get("co", {}).get("v")
        }

        return pd.DataFrame([reading])

    except Exception as e:
        print(f"[Error] Exception while fetching {city_name}: {e}")
        return pd.DataFrame(columns=DEFAULT_COLUMNS)


def fetch_all_cities() -> pd.DataFrame:
    """
    Loops through all 20 target world capitals, calls fetch_city_aqi() for each,
    aggregates valid results, and exports the data to data/raw/aqi_raw.csv.

    Returns:
        pd.DataFrame: Combined DataFrame containing readings for all valid cities.
    """
    print(f"Starting WAQI data fetch for {len(WORLD_CAPITALS)} world capitals...")

    all_dfs = []
    skipped_cities = []

    for idx, city in enumerate(WORLD_CAPITALS, start=1):
        print(f"[{idx}/{len(WORLD_CAPITALS)}] Fetching {city}...")
        df_city = fetch_city_aqi(city)

        if not df_city.empty and df_city["aqi"].notna().any():
            all_dfs.append(df_city)
            print(f"  [+] {city} — AQI: {df_city['aqi'].values[0]}")
        else:
            skipped_cities.append(city)
            print(f"  [-] {city} — No data available, skipping")

        time.sleep(0.5)

    os.makedirs(os.path.dirname(RAW_DATA_PATH), exist_ok=True)

    if all_dfs:
        combined_df = pd.concat(all_dfs, ignore_index=True)[DEFAULT_COLUMNS]
        for col in NUMERIC_COLUMNS:
            combined_df[col] = pd.to_numeric(combined_df[col], errors="coerce")

        combined_df.to_csv(RAW_DATA_PATH, index=False)
        print(f"Done! {len(combined_df)} cities saved to {RAW_DATA_PATH}")

        if skipped_cities:
            print(f"Skipped cities ({len(skipped_cities)}): {', '.join(skipped_cities)}")

        return combined_df

    print("[Notice] No data fetched for any city. Check your WAQI token in .env file.")
    empty_df = pd.DataFrame(columns=DEFAULT_COLUMNS)
    empty_df.to_csv(RAW_DATA_PATH, index=False)
    return empty_df


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
