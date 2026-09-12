"""
Analysis & Streamlit Data Loader Module for Air Quality Analyzer.
Provides helper functions for Streamlit dashboard to consume processed datasets.
"""

import os
import pandas as pd
import numpy as np

PROCESSED_DIR = os.path.join("data", "processed")

def _get_file_path(filename):
    """Helper to locate CSV file relative to project root."""
    path = os.path.join(PROCESSED_DIR, filename)
    if not os.path.exists(path):
        # Alternative path fallback if executed from src directory
        path = os.path.join("..", "data", "processed", filename)
    return path

def load_clean_data():
    """Loads clean AQI dataset."""
    path = _get_file_path("aqi_clean.csv")
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

def load_city_risk():
    """Loads city risk ranking dataset sorted by rank."""
    path = _get_file_path("city_risk_ranking.csv")
    if os.path.exists(path):
        df = pd.read_csv(path)
        if "risk_rank" in df.columns:
            return df.sort_values(by="risk_rank").reset_index(drop=True)
        return df
    return pd.DataFrame()

def load_spike_data():
    """Loads AQI spike detection dataset."""
    path = _get_file_path("aqi_with_spikes.csv")
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

def load_pollutant_profiles():
    """Loads pollutant fingerprint contribution shares per city."""
    path = _get_file_path("pollutant_profiles.csv")
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

def load_monthly_patterns():
    """Loads monthly AQI trend dataset."""
    path = _get_file_path("monthly_patterns.csv")
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

def load_diwali_effect():
    """Loads Diwali historical effect dataset."""
    path = _get_file_path("diwali_effect.csv")
    if os.path.exists(path):
        return pd.read_csv(path)
    return pd.DataFrame()

def get_city_summary(city_name):
    """
    Returns summary metrics, risk rank, total spikes, and health advisory message for a city.
    
    Parameters:
        city_name (str): Name of city.
        
    Returns:
        dict: City summary metadata.
    """
    clean_df = load_clean_data()
    risk_df = load_city_risk()
    spike_df = load_spike_data()
    profile_df = load_pollutant_profiles()

    city_clean = clean_df[clean_df["city"].str.lower() == city_name.lower()] if not clean_df.empty and "city" in clean_df.columns else pd.DataFrame()
    city_risk = risk_df[risk_df["city"].str.lower() == city_name.lower()] if not risk_df.empty and "city" in risk_df.columns else pd.DataFrame()
    city_spikes = spike_df[spike_df["city"].str.lower() == city_name.lower()] if not spike_df.empty and "city" in spike_df.columns else pd.DataFrame()
    city_profile = profile_df[profile_df["city"].str.lower() == city_name.lower()] if not profile_df.empty and "city" in profile_df.columns else pd.DataFrame()

    # Determine latest AQI
    if not city_clean.empty:
        pm25 = city_clean.iloc[-1].get("pm25", 50)
        current_aqi = round(pm25 * 1.5, 2)
    elif not city_risk.empty:
        current_aqi = city_risk.iloc[0].get("avg_aqi", 100.0)
    else:
        current_aqi = 100.0

    # Determine category
    if current_aqi <= 50:
        aqi_category = "Good"
        health_message = "Air quality is satisfactory. Safe for all groups."
    elif current_aqi <= 100:
        aqi_category = "Satisfactory"
        health_message = "Acceptable air quality. Sensitive groups should limit prolonged outdoor exposure."
    elif current_aqi <= 200:
        aqi_category = "Moderate"
        health_message = "Sensitive groups may experience health effects. General public unlikely to be affected."
    elif current_aqi <= 300:
        aqi_category = "Poor"
        health_message = "Everyone may begin to experience health effects. Sensitive groups should avoid outdoor activity."
    elif current_aqi <= 400:
        aqi_category = "Very Poor"
        health_message = "Health alert. Everyone should avoid outdoor activity. Wear N95 masks outdoors."
    else:
        aqi_category = "Severe"
        health_message = "Health emergency. Avoid all outdoor exposure. Schools and outdoor events should be cancelled."

    # Dominant pollutant
    if not city_profile.empty:
        dominant_pollutant = city_profile.iloc[0].get("dominant_pollutant", "PM2.5")
    elif not city_risk.empty:
        dominant_pollutant = city_risk.iloc[0].get("dominant_pollutant", "PM2.5")
    else:
        dominant_pollutant = "PM2.5"

    # Risk rank
    if not city_risk.empty:
        risk_rank = int(city_risk.iloc[0].get("risk_rank", 1))
    else:
        risk_rank = 1

    # Total spikes
    if not city_spikes.empty and "is_spike" in city_spikes.columns:
        total_spikes = int(city_spikes["is_spike"].sum())
    else:
        total_spikes = 0

    return {
        "city": city_name,
        "current_aqi": current_aqi,
        "aqi_category": aqi_category,
        "dominant_pollutant": dominant_pollutant,
        "risk_rank": risk_rank,
        "total_spikes": total_spikes,
        "health_message": health_message
    }

def get_top_polluted_cities(n=10):
    """Returns top n cities sorted by average AQI."""
    risk_df = load_city_risk()
    if not risk_df.empty:
        return risk_df.head(n)
    return pd.DataFrame()

def get_spike_summary():
    """Returns total spike count per city sorted descending."""
    spike_df = load_spike_data()
    if not spike_df.empty and "is_spike" in spike_df.columns:
        summary = spike_df.groupby("city")["is_spike"].sum().reset_index()
        summary.columns = ["city", "spike_count"]
        return summary.sort_values(by="spike_count", ascending=False).reset_index(drop=True)
    return pd.DataFrame(columns=["city", "spike_count"])

if __name__ == "__main__":
    df = load_clean_data()
    print("Clean data loaded shape:", df.shape)
    risk = load_city_risk()
    print("\nTop 5 at-risk cities:")
    print(risk.head())
    if not risk.empty:
        sample_city = risk.iloc[0]['city']
        summary = get_city_summary(sample_city)
        print(f"\nCity summary for '{sample_city}':")
        print(summary)
