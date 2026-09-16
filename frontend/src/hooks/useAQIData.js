import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useAQIData() {
  const [cities, setCities] = useState([]);
  const [rankings, setRankings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [citiesRes, rankingsRes] = await Promise.all([
        axios.get(`${BASE}/api/aqi`),
        axios.get(`${BASE}/api/aqi/rankings`),
      ]);
      setCities(citiesRes.data.data);
      setRankings(rankingsRes.data);
      setLastUpdated(new Date());
    } catch {
      setError("Could not connect to API. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { cities, rankings, loading, error, lastUpdated, refetch: fetchAll };
}

export function useCityData(cityName) {
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityName) return;
    setLoading(true);
    axios.get(`${BASE}/api/aqi/${cityName}`)
      .then(res => { setCity(res.data); setError(null); })
      .catch(() => setError("City not found"))
      .finally(() => setLoading(false));
  }, [cityName]);

  return { city, loading, error };
}
