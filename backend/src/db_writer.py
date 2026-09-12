"""
MongoDB Database Writer Module for Air Quality Analyzer.
Connects to MongoDB Atlas, upserts clean AQI snapshot measurements,
and provides database verification and full pipeline orchestration.
"""

import os
import sys
from datetime import datetime, timezone
from dotenv import load_dotenv
import pandas as pd
from pymongo import MongoClient, UpdateOne
from pymongo.errors import ConnectionFailure, BulkWriteError

# Load environment variables from project root .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

MONGO_URI = os.getenv("MONGO_URI")

DB_NAME = "airquality"
COLLECTION_NAME = "aqi_snapshots"


def get_db_client():
    """
    Connects to MongoDB Atlas using MONGO_URI and returns client instance.

    Returns:
        MongoClient: Connected MongoDB client instance.

    Raises:
        ValueError: If MONGO_URI is missing from environment.
        ConnectionFailure: If database ping fails or times out.
    """
    if not MONGO_URI:
        raise ValueError("MONGO_URI not found in .env file")

    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        client.admin.command("ping")
        print("[DB] Connected to MongoDB Atlas successfully")
        return client
    except ConnectionFailure as e:
        print(f"[DB Error] Connection to MongoDB Atlas failed: {e}")
        raise


def write_aqi_data(df: pd.DataFrame) -> int:
    """
    Upserts clean AQI DataFrame rows as documents into MongoDB collection.

    Parameters:
        df (pd.DataFrame): Cleaned air quality DataFrame.

    Returns:
        int: Total number of documents processed, or 0 on failure/empty input.
    """
    if df is None or df.empty:
        print("[DB Warning] DataFrame is empty or None — skipping database write.")
        return 0

    print(f"[DB] Preparing to write {len(df)} cities to MongoDB...")

    try:
        client = get_db_client()
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        documents = []
        for _, row in df.iterrows():
            doc = {
                "city": row["city"],
                "date": str(row.get("date")) if pd.notna(row.get("date")) else None,
                "aqi": float(row["aqi"]) if pd.notna(row.get("aqi")) else None,
                "pm25": float(row["pm25"]) if pd.notna(row.get("pm25")) else None,
                "pm10": float(row["pm10"]) if pd.notna(row.get("pm10")) else None,
                "no2": float(row["no2"]) if pd.notna(row.get("no2")) else None,
                "co": float(row["co"]) if pd.notna(row.get("co")) else None,
                "days_since_update": int(row["days_since_update"]) if "days_since_update" in row and pd.notna(row["days_since_update"]) else None,
                "freshness": row["freshness"] if "freshness" in row and pd.notna(row["freshness"]) else "Unknown",
                "data_quality": row["data_quality"] if "data_quality" in row and pd.notna(row["data_quality"]) else "Unknown",
                "is_high_pollution": bool(row["is_high_pollution"]) if "is_high_pollution" in row and pd.notna(row["is_high_pollution"]) else False,
                "last_written": datetime.now(timezone.utc)
            }
            documents.append(doc)

        operations = [
            UpdateOne({"city": doc["city"]}, {"$set": doc}, upsert=True)
            for doc in documents
        ]

        result = collection.bulk_write(operations, ordered=False)

        print(f"[DB] Upserted: {result.upserted_count} new cities")
        print(f"[DB] Modified: {result.modified_count} existing cities")
        print(f"[DB] Total processed: {len(operations)} cities")

        client.close()
        return len(operations)

    except BulkWriteError as bwe:
        print(f"[DB Error] Bulk write error occurred: {bwe.details}")
        return 0
    except Exception as e:
        print(f"[DB Error] Failed to write AQI data to MongoDB: {e}")
        return 0


def verify_db_contents() -> int:
    """
    Queries MongoDB to verify stored document count and prints summary ordered by AQI descending.

    Returns:
        int: Total document count in collection, or 0 on failure.
    """
    try:
        client = get_db_client()
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        total = collection.count_documents({})
        docs = collection.find({}, {"city": 1, "aqi": 1, "freshness": 1, "_id": 0}).sort("aqi", -1)

        print(f"\n[DB] Total cities in database: {total}")
        for doc in docs:
            city = doc.get("city", "Unknown")
            aqi = doc.get("aqi", "N/A")
            freshness = doc.get("freshness", "Unknown")
            print(f"  - {city}: AQI = {aqi}, Freshness = {freshness}")

        client.close()
        return total
    except Exception as e:
        print(f"[DB Error] Failed to verify database contents: {e}")
        return 0


def run_full_pipeline():
    """
    Orchestrates full end-to-end data pipeline: fetch -> clean -> MongoDB write -> verification.
    """
    print("=" * 50)
    print("AIR QUALITY ANALYZER — FULL PIPELINE")
    print("=" * 50)

    sys.path.insert(0, os.path.dirname(__file__))
    from data_fetch import fetch_all_cities
    from cleaning import run_cleaning_pipeline

    print("\n[Pipeline] Step 1: Fetching AQI data...")
    raw_df = fetch_all_cities()

    print("\n[Pipeline] Step 2: Cleaning data...")
    clean_df = run_cleaning_pipeline()

    print("\n[Pipeline] Step 3: Writing to MongoDB...")
    count = write_aqi_data(clean_df)

    print("\n[Pipeline] Step 4: Verifying database...")
    verify_db_contents()

    print("\n" + "=" * 50)
    print(f"[Pipeline] Complete! {count} cities in MongoDB")
    print("=" * 50)


if __name__ == "__main__":
    run_full_pipeline()
