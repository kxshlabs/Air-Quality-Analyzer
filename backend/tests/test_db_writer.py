"""
Unit tests for db_writer.py using unittest.
Tests MONGO_URI environment setup, DB configuration constants, live Atlas connection,
invalid URI handling, empty/None DataFrame writes, upsert behavior, NaN value conversion,
and database verification.
"""

import sys
import os
import unittest
import pandas as pd
from datetime import datetime, timezone
from unittest.mock import patch, MagicMock
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.db_writer import (
    get_db_client,
    write_aqi_data,
    verify_db_contents,
    MONGO_URI,
    DB_NAME,
    COLLECTION_NAME
)


class TestDBWriter(unittest.TestCase):
    """Test suite for MongoDB database writer module."""

    @classmethod
    def tearDownClass(cls):
        """Clean up any leftover test documents from MongoDB Atlas."""
        try:
            client = get_db_client()
            db = client[DB_NAME]
            collection = db[COLLECTION_NAME]
            collection.delete_many({
                "city": {"$in": [
                    "TestCity1", "TestCity2", 
                    "TestCityDupe", "TestNaN"
                ]}
            })
            client.close()
            print("\n[Cleanup] Test documents removed from MongoDB")
        except Exception as e:
            print(f"\n[Cleanup Warning] Could not clean up test documents: {e}")

    def test_mongo_uri_loaded(self):
        """Verify MONGO_URI is loaded from .env and starts with mongodb+srv://."""
        self.assertIsNotNone(MONGO_URI, "MONGO_URI missing or invalid in .env")
        self.assertNotEqual(MONGO_URI.strip(), "", "MONGO_URI missing or invalid in .env")
        self.assertTrue(MONGO_URI.startswith("mongodb+srv://"), "MONGO_URI missing or invalid in .env")

    def test_db_constants(self):
        """Verify DB and collection names are correct."""
        self.assertEqual(DB_NAME, "airquality", "DB_NAME does not equal 'airquality'")
        self.assertEqual(COLLECTION_NAME, "aqi_snapshots", "COLLECTION_NAME does not equal 'aqi_snapshots'")
        self.assertTrue(isinstance(DB_NAME, str) and len(DB_NAME) > 0, "DB_NAME is empty or not string")
        self.assertTrue(isinstance(COLLECTION_NAME, str) and len(COLLECTION_NAME) > 0, "COLLECTION_NAME is empty or not string")

    def test_get_db_client_returns_client(self):
        """Verify real Atlas connection succeeds."""
        client = get_db_client()
        self.assertIsInstance(client, MongoClient, "Return value is not a MongoClient instance")
        self.assertIsNotNone(client, "MongoClient instance is None")
        client.close()

    def test_get_db_client_invalid_uri(self):
        """Verify graceful failure on bad URI."""
        bad_uri = "mongodb+srv://invalid:invalid@invalid.invalid.net/"
        with patch("src.db_writer.MONGO_URI", bad_uri):
            with self.assertRaises(Exception):
                get_db_client()

    def test_write_aqi_data_empty_df(self):
        """Verify empty DataFrame returns 0."""
        result = write_aqi_data(pd.DataFrame())
        self.assertEqual(result, 0, "write_aqi_data for empty DataFrame did not return 0")

    def test_write_aqi_data_none_input(self):
        """Verify None input returns 0 gracefully."""
        result = write_aqi_data(None)
        self.assertEqual(result, 0, "write_aqi_data for None input did not return 0")

    def test_write_aqi_data_real_data(self):
        """Verify real data writes to MongoDB correctly."""
        test_df = pd.DataFrame([
            {
                "city": "TestCity1",
                "date": "2026-09-06",
                "aqi": 55.0,
                "pm25": 30.0,
                "pm10": 45.0,
                "no2": 12.0,
                "co": 2.1,
                "days_since_update": 0,
                "freshness": "Live",
                "data_quality": "good",
                "is_high_pollution": False
            },
            {
                "city": "TestCity2",
                "date": "2026-09-06",
                "aqi": 180.0,
                "pm25": 150.0,
                "pm10": None,
                "no2": None,
                "co": None,
                "days_since_update": 0,
                "freshness": "Live",
                "data_quality": "partial",
                "is_high_pollution": True
            }
        ])

        count = write_aqi_data(test_df)
        self.assertEqual(count, 2, "write_aqi_data did not process 2 documents")

        client = get_db_client()
        collection = client[DB_NAME][COLLECTION_NAME]

        doc1 = collection.find_one({"city": "TestCity1"})
        doc2 = collection.find_one({"city": "TestCity2"})

        self.assertIsNotNone(doc1, "TestCity1 document not found in MongoDB")
        self.assertIsNotNone(doc2, "TestCity2 document not found in MongoDB")
        self.assertEqual(doc1.get("aqi"), 55.0)
        self.assertEqual(doc2.get("aqi"), 180.0)

        collection.delete_many({"city": {"$in": ["TestCity1", "TestCity2"]}})
        client.close()

    def test_upsert_no_duplicates(self):
        """Verify running write twice does not duplicate documents."""
        test_df = pd.DataFrame([
            {
                "city": "TestCityDupe",
                "date": "2026-09-06",
                "aqi": 75.0,
                "pm25": 40.0,
                "pm10": 50.0,
                "no2": 10.0,
                "co": 1.5,
                "days_since_update": 0,
                "freshness": "Live",
                "data_quality": "good",
                "is_high_pollution": False
            }
        ])

        write_aqi_data(test_df)
        write_aqi_data(test_df)

        client = get_db_client()
        collection = client[DB_NAME][COLLECTION_NAME]

        doc_count = collection.count_documents({"city": "TestCityDupe"})
        self.assertEqual(doc_count, 1, f"Expected 1 document for TestCityDupe, found {doc_count}")

        collection.delete_many({"city": "TestCityDupe"})
        client.close()

    def test_nan_values_converted_to_none(self):
        """Verify NaN becomes None in MongoDB not string."""
        test_df = pd.DataFrame([
            {
                "city": "TestNaN",
                "date": "2026-09-06",
                "aqi": 50.0,
                "pm25": float("nan"),
                "pm10": float("nan"),
                "no2": float("nan"),
                "co": 1.0,
                "days_since_update": 0,
                "freshness": "Live",
                "data_quality": "partial",
                "is_high_pollution": False
            }
        ])

        write_aqi_data(test_df)

        client = get_db_client()
        collection = client[DB_NAME][COLLECTION_NAME]

        doc = collection.find_one({"city": "TestNaN"})
        self.assertIsNotNone(doc, "TestNaN document not found in MongoDB")
        self.assertIsNone(doc.get("pm25"), "pm25 was not stored as None in MongoDB")
        self.assertNotEqual(doc.get("pm25"), "nan", "pm25 was stored as string 'nan'")

        collection.delete_many({"city": "TestNaN"})
        client.close()

    def test_verify_db_contents_returns_int(self):
        """Verify verify_db_contents returns integer."""
        result = verify_db_contents()
        self.assertIsInstance(result, int, "verify_db_contents return type is not int")
        self.assertGreaterEqual(result, 0, "verify_db_contents returned negative count")


if __name__ == "__main__":
    unittest.main(verbosity=2)
