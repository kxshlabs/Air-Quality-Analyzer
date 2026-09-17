import { useState } from "react";
import { motion } from "framer-motion";
import { useAQIData } from "../hooks/useAQIData";
import { getAQIColor, getAQILabel, formatAQI } from "../utils/aqiHelpers";
import AQIRing from "../components/AQIRing";
import HealthAdvisor from "../components/HealthAdvisor";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function Compare() {
  const { cities, loading, error, refetch } = useAQIData();
  const [city1Name, setCity1Name] = useState("Delhi");
  const [city2Name, setCity2Name] = useState("Beijing");

  if (loading) return <LoadingSpinner message="Loading city comparison engine..." />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  const city1 = cities.find(c => c.city.toLowerCase() === city1Name.toLowerCase()) || cities[0];
  const city2 = cities.find(c => c.city.toLowerCase() === city2Name.toLowerCase()) || (cities[1] || cities[0]);

  const metrics = [
    { key: "aqi", label: "Overall AQI", unit: "", isPollutant: true },
    { key: "pm25", label: "PM2.5", unit: "µg/m³", isPollutant: true },
    { key: "pm10", label: "PM10", unit: "µg/m³", isPollutant: true },
    { key: "no2", label: "NO₂", unit: "µg/m³", isPollutant: true },
    { key: "co", label: "CO", unit: "mg/m³", isPollutant: true },
    { key: "so2", label: "SO₂", unit: "µg/m³", isPollutant: true },
    { key: "o3", label: "O₃", unit: "µg/m³", isPollutant: true },
    { key: "temperature", label: "Temperature", unit: "°C", isPollutant: false },
    { key: "humidity", label: "Humidity", unit: "%", isPollutant: false },
    { key: "wind_speed", label: "Wind Speed", unit: "m/s", isPollutant: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto px-4 py-6 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-light-border dark:border-dark-border pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            ⚖️ City vs City Comparator
          </h1>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Compare live air quality, pollutant levels, and weather metrics side-by-side.
          </p>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 space-y-2">
          <label className="text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
            City 1
          </label>
          <select
            value={city1Name}
            onChange={e => setCity1Name(e.target.value)}
            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-accent"
          >
            {cities.map(c => (
              <option key={c.city} value={c.city}>
                {c.city} (AQI {formatAQI(c.aqi)})
              </option>
            ))}
          </select>
        </div>

        <div className="card p-4 space-y-2">
          <label className="text-xs font-semibold text-light-muted dark:text-dark-muted uppercase tracking-wider">
            City 2
          </label>
          <select
            value={city2Name}
            onChange={e => setCity2Name(e.target.value)}
            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:border-accent"
          >
            {cities.map(c => (
              <option key={c.city} value={c.city}>
                {c.city} (AQI {formatAQI(c.aqi)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Side by Side Ring Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[city1, city2].map((c, idx) => {
          if (!c) return null;
          const color = getAQIColor(c.aqi);
          return (
            <div key={c.city + idx} className="card p-5 flex items-center gap-5 relative overflow-hidden">
              <AQIRing aqi={c.aqi} size={80} />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono text-accent uppercase tracking-widest font-semibold">
                  {idx === 0 ? "City A" : "City B"}
                </span>
                <h3 className="text-xl font-bold truncate">{c.city}</h3>
                <p className="text-xs font-medium mt-0.5" style={{ color }}>
                  {getAQILabel(c.aqi)}
                </p>
                <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1">
                  Dominant: <span className="font-mono text-light-text dark:text-dark-text uppercase">{c.dominant_pollutant || "—"}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Direct Comparison Matrix */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-sm">📊 Detailed Head-to-Head Comparison</h2>
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {metrics.map(({ key, label, unit, isPollutant }) => {
            const val1 = city1?.[key];
            const val2 = city2?.[key];

            let winner = null; // 1 means city1 is better (lower pollutant or positive weather)
            if (val1 != null && val2 != null && val1 !== val2) {
              if (isPollutant) {
                winner = val1 < val2 ? 1 : 2;
              }
            }

            return (
              <div key={key} className="py-3 grid grid-cols-3 items-center text-xs sm:text-sm">
                {/* City 1 Value */}
                <div className="text-left font-mono">
                  <span className={`px-2 py-1 rounded ${winner === 1 ? "bg-green-500/20 text-green-400 font-bold" : "text-light-text dark:text-dark-text"}`}>
                    {val1 != null ? `${val1} ${unit}` : "N/A"}
                  </span>
                </div>

                {/* Metric Label */}
                <div className="text-center font-medium text-light-muted dark:text-dark-muted text-xs">
                  {label}
                </div>

                {/* City 2 Value */}
                <div className="text-right font-mono">
                  <span className={`px-2 py-1 rounded ${winner === 2 ? "bg-green-500/20 text-green-400 font-bold" : "text-light-text dark:text-dark-text"}`}>
                    {val2 != null ? `${val2} ${unit}` : "N/A"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Health Advisors for both cities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
            Advisory for {city1.city}
          </h3>
          <HealthAdvisor aqi={city1.aqi} />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
            Advisory for {city2.city}
          </h3>
          <HealthAdvisor aqi={city2.aqi} />
        </div>
      </div>
    </motion.div>
  );
}
