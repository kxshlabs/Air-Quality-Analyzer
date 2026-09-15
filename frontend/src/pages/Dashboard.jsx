import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "framer-motion";
import { useAQIData } from "../hooks/useAQIData";
import { getAQIColor, getAQILabel, formatAQI } from "../utils/aqiHelpers";
import FreshnessBadge from "../components/FreshnessBadge";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

// City coordinates — must match the 20 cities in MongoDB
const CITY_COORDS = {
  "Beijing":      [116.4074, 39.9042],
  "London":       [-0.1278,  51.5074],
  "Paris":        [2.3522,   48.8566],
  "Tokyo":        [139.6917, 35.6895],
  "Seoul":        [126.9780, 37.5665],
  "Bangkok":      [100.5018, 13.7563],
  "Santiago":     [-70.6693, -33.4489],
  "Delhi":        [77.2090,  28.6139],
  "Berlin":       [13.4050,  52.5200],
  "Sydney":       [151.2093, -33.8688],
  "New York":     [-74.0060, 40.7128],
  "Ottawa":       [-75.6972, 45.4215],
  "Mexico City":  [-99.1332, 19.4326],
  "Warsaw":       [21.0122,  52.2297],
  "Moscow":       [37.6173,  55.7558],
  "Hanoi":        [105.8412, 21.0278],
  "Singapore":    [103.8198, 1.3521],
  "Ulaanbaatar":  [106.9057, 47.8864],
  "Lagos":        [3.3792,   6.5244],
  "Jakarta":      [106.8650, -6.2088],
};

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function Dashboard() {
  const { cities, rankings, loading, error, refetch } = useAQIData();
  const [tooltip, setTooltip] = useState(null);
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="Fetching global AQI data..." />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Cities Tracked"
          value={rankings?.total ?? "—"}
          sub="worldwide"
        />
        <StatCard
          label="Most Polluted"
          value={rankings?.most_polluted ?? "—"}
          sub={`AQI ${formatAQI(rankings?.rankings?.[0]?.aqi)}`}
        />
        <StatCard
          label="Cleanest City"
          value={rankings?.cleanest ?? "—"}
          sub={`AQI ${formatAQI(
            rankings?.rankings?.[rankings.rankings.length - 1]?.aqi
          )}`}
        />
        <StatCard
          label="Global Avg AQI"
          value={rankings?.average_aqi ?? "—"}
          sub="across all cities"
        />
      </div>

      {/* World Map */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm">🗺️ Global Air Quality Map</h2>
          <span className="text-xs text-light-muted dark:text-dark-muted">
            Click a city dot for details
          </span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-10 bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs pointer-events-none shadow-lg"
            style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
          >
            <p className="font-semibold text-white">{tooltip.city}</p>
            <p style={{ color: getAQIColor(tooltip.aqi) }}>
              AQI {formatAQI(tooltip.aqi)} — {getAQILabel(tooltip.aqi)}
            </p>
            <FreshnessBadge freshness={tooltip.freshness} />
          </div>
        )}

        <ComposableMap
          projection="geoMercator"
          style={{ width: "100%", height: "420px" }}
        >
          <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={6}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="currentColor"
                    stroke="currentColor"
                    className="text-light-border dark:text-dark-border stroke-light-bg dark:stroke-dark-bg"
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {cities.map(city => {
              const coords = CITY_COORDS[city.city];
              if (!coords) return null;
              const color = getAQIColor(city.aqi);
              return (
                <Marker
                  key={city.city}
                  coordinates={coords}
                  onClick={() => navigate(`/city/${city.city}`)}
                  onMouseEnter={e =>
                    setTooltip({
                      city:      city.city,
                      aqi:       city.aqi,
                      freshness: city.freshness,
                      x:         e.clientX,
                      y:         e.clientY,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    r={5}
                    fill={color}
                    fillOpacity={0.85}
                    stroke="#fff"
                    strokeWidth={1}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* AQI Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-light-muted dark:text-dark-muted">
          {[
            ["#22c55e", "Good (0–50)"],
            ["#eab308", "Moderate (51–100)"],
            ["#f97316", "Unhealthy Sensitive (101–150)"],
            ["#ef4444", "Unhealthy (151–200)"],
            ["#9333ea", "Very Unhealthy (200+)"],
          ].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ background: color }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
