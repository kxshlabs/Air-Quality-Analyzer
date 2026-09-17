import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "framer-motion";
import Supercluster from "supercluster";
import { useAQIData } from "../hooks/useAQIData";
import { getAQIColor, getAQILabel, formatAQI } from "../utils/aqiHelpers";
import FreshnessBadge from "../components/FreshnessBadge";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

import HazardousBanner from "../components/HazardousBanner";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function Dashboard() {
  const { cities, rankings, loading, error, refetch } = useAQIData();
  const [tooltip, setTooltip] = useState(null);
  const [position, setPosition] = useState({ coordinates: [0, 20], zoom: 1 });
  const navigate = useNavigate();

  // Prepare GeoJSON points for Supercluster
  const points = useMemo(() => {
    return cities
      .filter(c => c.lng != null && c.lat != null)
      .map(c => ({
        type: "Feature",
        properties: {
          cluster: false,
          city: c.city,
          aqi: c.aqi,
          freshness: c.freshness,
          is_high_pollution: c.is_high_pollution || c.aqi > 150,
        },
        geometry: {
          type: "Point",
          coordinates: [c.lng, c.lat],
        },
      }));
  }, [cities]);

  // Instantiate and load Supercluster
  const supercluster = useMemo(() => {
    const sc = new Supercluster({
      radius: 45,
      maxZoom: 16,
    });
    sc.load(points);
    return sc;
  }, [points]);

  // Compute clusters based on current zoom level
  const clusters = useMemo(() => {
    const zoomInt = Math.min(Math.max(Math.floor(position.zoom), 1), 16);
    return supercluster.getClusters([-180, -85, 180, 85], zoomInt);
  }, [supercluster, position.zoom]);

  const handleMoveEnd = (newPos) => {
    setPosition(newPos);
  };

  if (loading) return <LoadingSpinner message="Fetching global AQI data..." />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  // Scale marker sizes dynamically inversely to zoom level
  const scale = 1 / Math.sqrt(position.zoom);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto px-4 py-6 space-y-6"
    >
      {/* High Pollution Alert Banner */}
      <HazardousBanner cities={cities} />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Cities Tracked"
          value={rankings?.total ?? cities.length}
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
          <h2 className="font-semibold text-sm">🗺️ Global Air Quality Map ({cities.length} Cities)</h2>
          <span className="text-xs text-light-muted dark:text-dark-muted">
            Zoom/Pan & Click markers for details
          </span>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-20 bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-xs pointer-events-none shadow-lg"
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
          style={{ width: "100%", height: "460px" }}
        >
          <ZoomableGroup
            center={position.coordinates}
            zoom={position.zoom}
            minZoom={0.8}
            maxZoom={8}
            onMoveEnd={handleMoveEnd}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="currentColor"
                    stroke="currentColor"
                    className="text-light-border dark:text-dark-border stroke-light-bg dark:stroke-dark-bg transition-colors duration-200"
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {clusters.map(feature => {
              const [lng, lat] = feature.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount } = feature.properties;

              // RENDER CLUSTER MARKER
              if (isCluster) {
                const size = Math.min(18 + (pointCount / points.length) * 30, 36) * scale;
                return (
                  <Marker
                    key={`cluster-${feature.id}`}
                    coordinates={[lng, lat]}
                    onClick={() => {
                      const expansionZoom = Math.min(
                        supercluster.getClusterExpansionZoom(feature.id),
                        8
                      );
                      setPosition({
                        coordinates: [lng, lat],
                        zoom: expansionZoom,
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      r={size / 2}
                      fill="#38bdf8"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5 * scale}
                    />
                    <text
                      textAnchor="middle"
                      y={4 * scale}
                      style={{
                        fontSize: `${11 * scale}px`,
                        fill: "#0a0a0f",
                        fontWeight: "bold",
                        pointerEvents: "none",
                      }}
                    >
                      {pointCount}
                    </text>
                  </Marker>
                );
              }

              // RENDER INDIVIDUAL CITY MARKER
              const { city, aqi, freshness, is_high_pollution } = feature.properties;
              const color = getAQIColor(aqi);

              return (
                <Marker
                  key={city}
                  coordinates={[lng, lat]}
                  onClick={() => navigate(`/city/${city}`)}
                  onMouseEnter={e =>
                    setTooltip({
                      city,
                      aqi,
                      freshness,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{ cursor: "pointer" }}
                >
                  {/* Pulsing ring for high pollution cities (AQI > 150) */}
                  {is_high_pollution && (
                    <circle
                      r={10 * scale}
                      fill={color}
                      opacity={0.35}
                      className="animate-ping"
                    />
                  )}

                  <circle
                    r={5.5 * scale}
                    fill={color}
                    fillOpacity={0.9}
                    stroke="#ffffff"
                    strokeWidth={1 * scale}
                  />
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* AQI Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs text-light-muted dark:text-dark-muted border-t border-light-border dark:border-dark-border pt-3">
          <div className="flex flex-wrap gap-3">
            {[
              ["#22c55e", "Good (0–50)"],
              ["#eab308", "Moderate (51–100)"],
              ["#f97316", "Unhealthy Sensitive (101–150)"],
              ["#ef4444", "Unhealthy (151–200)"],
              ["#9333ea", "Very Unhealthy (200+)"],
            ].map(([color, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ background: color }}
                />
                {label}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#38bdf8] flex items-center justify-center text-[8px] font-bold text-black">#</span>
            <span>Cluster Group</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
