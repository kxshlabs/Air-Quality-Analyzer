import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCityData } from "../hooks/useAQIData";
import {
  getAQIColor,
  getAQILabel,
  getHealthMessage,
  formatAQI,
} from "../utils/aqiHelpers";
import AQIRing from "../components/AQIRing";
import HealthAdvisor from "../components/HealthAdvisor";
import FreshnessBadge from "../components/FreshnessBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

const POLLUTANTS = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", who: 15 },
  { key: "pm10", label: "PM10",  unit: "µg/m³", who: 45 },
  { key: "no2",  label: "NO₂",   unit: "µg/m³", who: 25 },
  { key: "co",   label: "CO",    unit: "mg/m³",  who: 4  },
];

export default function CityDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { city, loading, error } = useCityData(name);

  if (loading) return <LoadingSpinner message={`Loading ${name}...`} />;
  if (error)   return (
    <ErrorMessage
      message={`No data found for "${name}"`}
      onRetry={() => navigate(-1)}
    />
  );
  if (!city) return null;

  const color = getAQIColor(city.aqi);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto px-4 py-6 space-y-5"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-light-muted dark:text-dark-muted hover:text-accent transition-colors"
      >
        ← Back
      </button>

      {/* Header card */}
      <div className="card p-6 flex items-center gap-6">
        <AQIRing aqi={city.aqi} size={90} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{city.city}</h1>
            <FreshnessBadge freshness={city.freshness} />
          </div>
          <p className="text-sm font-medium mt-1" style={{ color }}>
            {getAQILabel(city.aqi)}
          </p>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-1">
            Last reading: {city.date ?? "Unknown"}
          </p>
        </div>
      </div>

      {/* Health Advisory */}
      <HealthAdvisor aqi={city.aqi} />

      {/* Pollutant bars */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-sm">Pollutant Breakdown</h2>
        {POLLUTANTS.map(({ key, label, unit, who }) => {
          const val = city[key];
          const pct = val != null
            ? Math.min((val / (who * 3)) * 100, 100)
            : 0;
          const overWHO = val != null && val > who;
          return (
            <div key={key}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-mono">{label}</span>
                <span
                  className={
                    overWHO
                      ? "text-aqi-veryPoor font-medium"
                      : "text-light-muted dark:text-dark-muted"
                  }
                >
                  {val != null ? `${val} ${unit}` : "No data"}
                  {overWHO && " ⚠️ above WHO limit"}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-light-border dark:bg-dark-border overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="h-full rounded-full"
                  style={{ background: overWHO ? "#ef4444" : "#a78bfa" }}
                />
              </div>
              <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                WHO limit: {who} {unit}
              </p>
            </div>
          );
        })}
      </div>

      {/* Data quality */}
      <div className="card p-4 flex items-center justify-between text-sm">
        <span className="text-light-muted dark:text-dark-muted">
          Data quality
        </span>
        <span className="font-medium capitalize">
          {city.data_quality ?? "Unknown"}
        </span>
      </div>
    </motion.div>
  );
}
