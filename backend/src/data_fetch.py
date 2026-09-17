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

ACTIVE_CITIES_100 = [
    # East & Southeast Asia (25)
    "Beijing", "Shanghai", "Chengdu", "Wuhan", "Shenzhen", "Xian", "Hong Kong", "Macau",
    "Tokyo", "Osaka", "Nagoya", "Fukuoka", "Sapporo", "Seoul", "Busan", "Incheon",
    "Gwangju", "Taipei", "Kaohsiung", "Bangkok", "Hanoi", "Singapore", "Jakarta",
    "Kuala Lumpur", "Chiang Mai",

    # Europe (30)
    "London", "Paris", "Berlin", "Madrid", "Amsterdam", "Brussels", "Vienna", "Warsaw",
    "Prague", "Budapest", "Bucharest", "Athens", "Stockholm", "Oslo", "Copenhagen",
    "Helsinki", "Zurich", "Lisbon", "Dublin", "Barcelona", "Lyon", "Rotterdam",
    "Edinburgh", "Krakow", "Tallinn", "Ljubljana", "Zagreb", "Bratislava", "Vilnius", "Valparaiso",

    # North & Central America (19)
    "New York", "Los Angeles", "Chicago", "Houston", "Toronto", "Vancouver", "Ottawa",
    "Mexico City", "Monterrey", "Guadalajara", "Philadelphia", "Phoenix", "Seattle",
    "Denver", "Atlanta", "Miami", "Boston", "Portland", "Minneapolis",

    # South America (7)
    "Sao Paulo", "Santiago", "Lima", "Bogota", "Quito", "Medellin", "Buenos Aires",

    # Oceania (5)
    "Sydney", "Melbourne", "Brisbane", "Auckland", "Perth",

    # Middle East & Central Asia (9)
    "Abu Dhabi", "Kuwait City", "Tel Aviv", "Amman", "Tashkent", "Almaty", "Baku", "Tbilisi", "Moscow",

    # South Asia & Africa (5)
    "Delhi", "Faridabad", "Johannesburg", "Addis Ababa", "Cairo"
]

# Alias for backwards compatibility with existing test suites
WORLD_CAPITALS = ACTIVE_CITIES_100

DEFAULT_COLUMNS = [
    "city", "date", "aqi", "pm25", "pm10", "no2", "co", "so2", "o3",
    "temperature", "humidity", "wind_speed", "pressure",
    "dominant_pollutant", "lat", "lng"
]
NUMERIC_COLUMNS = [
    "aqi", "pm25", "pm10", "no2", "co", "so2", "o3",
    "temperature", "humidity", "wind_speed", "pressure", "lat", "lng"
]
RAW_DATA_PATH = os.path.join("data", "raw", "aqi_raw.csv")


def fetch_city_aqi(city_name: str) -> pd.DataFrame:
    """
    Fetches real-time AQI, pollutants, weather parameters, and coordinates for a specific city.

    Parameters:
        city_name (str): Name of the city to query.

    Returns:
        pd.DataFrame: A single-row DataFrame with extracted fields
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
        city_info = payload.get("city", {})
        geo = city_info.get("geo", [])

        reading = {
            "city": city_name,
            "date": payload.get("time", {}).get("s"),
            "aqi": payload.get("aqi"),
            "pm25": iaqi.get("pm25", {}).get("v"),
            "pm10": iaqi.get("pm10", {}).get("v"),
            "no2": iaqi.get("no2", {}).get("v"),
            "co": iaqi.get("co", {}).get("v"),
            "so2": iaqi.get("so2", {}).get("v"),
            "o3": iaqi.get("o3", {}).get("v"),
            "temperature": iaqi.get("t", {}).get("v"),
            "humidity": iaqi.get("h", {}).get("v"),
            "wind_speed": iaqi.get("w", {}).get("v"),
            "pressure": iaqi.get("p", {}).get("v"),
            "dominant_pollutant": payload.get("dominentpol"),
            "lat": geo[0] if len(geo) > 0 else None,
            "lng": geo[1] if len(geo) > 1 else None
        }

        return pd.DataFrame([reading])

    except Exception as e:
        print(f"[Error] Exception while fetching {city_name}: {e}")
        return pd.DataFrame(columns=DEFAULT_COLUMNS)


def fetch_all_cities() -> pd.DataFrame:
    """
    Loops through all 100 active target cities, calls fetch_city_aqi() for each,
    aggregates valid results, and exports the data to data/raw/aqi_raw.csv.

    Returns:
        pd.DataFrame: Combined DataFrame containing readings for all valid cities.
    """
    print(f"Starting WAQI data fetch for {len(ACTIVE_CITIES_100)} active cities...")

    all_dfs = []
    skipped_cities = []

    for idx, city in enumerate(ACTIVE_CITIES_100, start=1):
        print(f"[{idx}/{len(ACTIVE_CITIES_100)}] Fetching {city}...")
        df_city = fetch_city_aqi(city)

        if not df_city.empty and df_city["aqi"].notna().any():
            all_dfs.append(df_city)
            print(f"  [+] {city} — AQI: {df_city['aqi'].values[0]}")
        else:
            skipped_cities.append(city)
            print(f"  [-] {city} — No data available, skipping")

        time.sleep(0.3)

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
