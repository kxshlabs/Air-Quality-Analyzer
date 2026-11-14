import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAQIData } from "../hooks/useAQIData";
import {
  getAQIColor,
  getAQILabel,
  getAQIBand,
  formatAQI,
} from "../utils/aqiHelpers";
import FreshnessBadge from "../components/FreshnessBadge";
import ErrorMessage from "../components/ErrorMessage";
import HazardousBanner from "../components/HazardousBanner";

// Fix Leaflet's default icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Map controller to smoothly fly to city coordinates
function MapFlyController({ targetCoord }) {
  const map = useMap();
  useEffect(() => {
    if (targetCoord && targetCoord[0] != null && targetCoord[1] != null) {
      map.flyTo(targetCoord, 6, { duration: 1.5 });
    }
  }, [map, targetCoord]);
  return null;
}

// Create custom glowing orb Leaflet DivIcon
function createOrbIcon(aqi, isHighPollution) {
  const color = getAQIColor(aqi);
  const isSevere = isHighPollution || (aqi != null && aqi > 150);

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8 group cursor-pointer">
      ${
        isSevere
          ? `<span class="absolute w-7 h-7 rounded-full animate-ping opacity-40" style="background-color: ${color}"></span>`
          : ""
      }
      <span class="absolute w-6 h-6 rounded-full blur-[3px] opacity-70 transition-transform duration-300 group-hover:scale-150" style="background-color: ${color}"></span>
      <span class="relative w-3.5 h-3.5 rounded-full border border-white/90 shadow-[0_0_10px_${color}] transition-all duration-200 group-hover:scale-125" style="background-color: ${color}"></span>
    </div>
  `;

  return L.divIcon({
    className: "bg-transparent border-none",
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

// SVG Arc generator for the World Risk Clock
function describeArc(x, y, radius, startAngle, endAngle) {
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

export default function Dashboard() {
  const { cities = [], rankings, loading, error, refetch } = useAQIData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [clockHoveredBand, setClockHoveredBand] = useState(null);
  const [targetCoord, setTargetCoord] = useState(null);
  const navigate = useNavigate();

  // Top 10 most polluted cities for sidebar
  const topPollutedCities = useMemo(() => {
    return [...cities]
      .filter((c) => c.aqi != null)
      .sort((a, b) => b.aqi - a.aqi)
      .slice(0, 10);
  }, [cities]);

  // World Risk Clock distribution calculation
  const riskClockData = useMemo(() => {
    const total = cities.length || 1;
    const bandCounts = {
      good: 0,
      moderate: 0,
      usg: 0,
      unhealthy: 0,
      veryUnhealthy: 0,
      hazardous: 0,
    };

    cities.forEach((c) => {
      const band = getAQIBand(c.aqi);
      if (bandCounts[band] !== undefined) {
        bandCounts[band]++;
      }
    });

    const bands = [
      { key: "good", label: "Good", color: "#22c55e", count: bandCounts.good },
      {
        key: "moderate",
        label: "Moderate",
        color: "#eab308",
        count: bandCounts.moderate,
      },
      {
        key: "usg",
        label: "Unhealthy (Sens.)",
        color: "#f97316",
        count: bandCounts.usg,
      },
      {
        key: "unhealthy",
        label: "Unhealthy",
        color: "#ef4444",
        count: bandCounts.unhealthy,
      },
      {
        key: "veryUnhealthy",
        label: "Very Unhealthy",
        color: "#a855f7",
        count: bandCounts.veryUnhealthy,
      },
      {
        key: "hazardous",
        label: "Hazardous",
        color: "#7f1d1d",
        count: bandCounts.hazardous,
      },
    ];

    let currentAngle = 0;
    const segments = bands.map((b) => {
      const fraction = b.count / total;
      const arcLength = fraction * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + Math.max(arcLength - 1.5, 0); // small gap
      currentAngle += arcLength;
      return {
        ...b,
        percentage: Math.round(fraction * 100),
        startAngle,
        endAngle,
      };
    });

    return { total: cities.length, segments };
  }, [cities]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCities = rankings?.total ?? cities.length;
    const avgAqi = rankings?.average_aqi ?? "—";
    const cleanest = rankings?.cleanest ?? "—";
    const mostPolluted = rankings?.most_polluted ?? "—";
    const unhealthyCount = cities.filter(
      (c) => c.aqi != null && c.aqi > 150
    ).length;

    return { totalCities, avgAqi, cleanest, mostPolluted, unhealthyCount };
  }, [cities, rankings]);

  if (loading) {
    return (
      <div className="relative w-full h-[calc(100vh-4rem)] p-6 space-y-4">
        {/* Top bar skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 skeleton rounded-xl" />
          ))}
        </div>
        {/* Map skeleton */}
        <div className="w-full h-[75vh] skeleton rounded-2xl flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-light-muted dark:text-dark-muted">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span className="text-sm font-mono">Initializing Atmospheric Map...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-[#06060f]">
      {/* 1. Full-Viewport Leaflet Hero Map */}
      <MapContainer
        center={[24, 15]}
        zoom={2.5}
        minZoom={2}
        maxZoom={10}
        zoomControl={false}
        className="w-full h-full z-0"
        style={{ background: "#06060f" }}
      >
        {/* Stadia Maps Alidade Smooth Dark Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />

        <MapFlyController targetCoord={targetCoord} />

        {/* City Glowing Orb Markers */}
        {cities
          .filter((c) => c.lat != null && c.lng != null)
          .map((city) => {
            const aqiColor = getAQIColor(city.aqi);
            const isSevere =
              city.is_high_pollution || (city.aqi != null && city.aqi > 150);

            return (
              <Marker
                key={city.city}
                position={[city.lat, city.lng]}
                icon={createOrbIcon(city.aqi, isSevere)}
                eventHandlers={{
                  click: () => {
                    setTargetCoord([city.lat, city.lng]);
                  },
                }}
              >
                {/* Floating Mini-Card on Marker Click/Hover */}
                <Popup className="atmospheric-popup" closeButton={false}>
                  <div className="glass-card p-3 min-w-[200px] border border-white/10 text-white rounded-xl shadow-2xl space-y-2 bg-[#0d0520]/95 backdrop-blur-md">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <span className="font-heading font-bold text-sm tracking-wide text-white">
                        {city.city}
                      </span>
                      <FreshnessBadge freshness={city.freshness} />
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: aqiColor }}
                        />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: aqiColor }}
                        >
                          {getAQILabel(city.aqi)}
                        </span>
                      </div>
                      <span
                        className="font-mono font-bold text-lg"
                        style={{ color: aqiColor }}
                      >
                        AQI {formatAQI(city.aqi)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-dark-muted font-mono bg-white/5 px-2 py-1 rounded">
                      <span>Dominant:</span>
                      <span className="font-semibold text-accent uppercase">
                        {city.dominant_pollutant || "PM2.5"}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        navigate(`/city/${encodeURIComponent(city.city)}`)
                      }
                      className="w-full py-1 text-center text-xs font-medium bg-accent/20 hover:bg-accent text-accent hover:text-white rounded-lg transition-colors duration-200 mt-1"
                    >
                      Deep Dive →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* 2. TOP BAR: 4 Stat Chips (Over Map) */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Stat Chip 1 */}
          <div className="glass-card pointer-events-auto p-2.5 sm:p-3 flex items-center gap-3 border border-white/10 bg-black/40 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center text-accent text-sm">
              🌐
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-muted truncate">
                Global Avg AQI
              </span>
              <span className="font-heading font-bold text-base sm:text-lg text-white font-mono">
                {stats.avgAqi}
              </span>
            </div>
          </div>

          {/* Stat Chip 2 */}
          <div className="glass-card pointer-events-auto p-2.5 sm:p-3 flex items-center gap-3 border border-white/10 bg-black/40 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-green-500/15 flex items-center justify-center text-green-400 text-sm">
              🌱
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-muted truncate">
                Cleanest City
              </span>
              <span className="font-heading font-bold text-xs sm:text-sm text-green-400 truncate">
                {stats.cleanest}
              </span>
            </div>
          </div>

          {/* Stat Chip 3 */}
          <div className="glass-card pointer-events-auto p-2.5 sm:p-3 flex items-center gap-3 border border-white/10 bg-black/40 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 text-sm">
              🔥
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-muted truncate">
                Most Polluted
              </span>
              <span className="font-heading font-bold text-xs sm:text-sm text-red-400 truncate">
                {stats.mostPolluted}
              </span>
            </div>
          </div>

          {/* Stat Chip 4 */}
          <div className="glass-card pointer-events-auto p-2.5 sm:p-3 flex items-center gap-3 border border-white/10 bg-black/40 backdrop-blur-md">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400 text-sm">
              ⚠️
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-mono tracking-wider text-dark-muted truncate">
                Unhealthy Cities
              </span>
              <span className="font-heading font-bold text-base sm:text-lg text-amber-400 font-mono">
                {stats.unhealthyCount}
              </span>
            </div>
          </div>
        </div>

        {/* High Pollution Hazardous Banner if any */}
        <div className="max-w-5xl mx-auto mt-2 pointer-events-auto">
          <HazardousBanner cities={cities} />
        </div>
      </div>

      {/* 3. LEFT SIDEBAR: Live Top 10 Most Polluted Cities (Collapsible) */}
      <div
        className={`absolute top-24 left-4 z-20 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64 sm:w-72" : "w-10"
        }`}
      >
        <div className="glass-card border border-white/10 bg-black/50 backdrop-blur-xl overflow-hidden shadow-2xl rounded-2xl">
          {/* Header & Toggle */}
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-white/5">
            {sidebarOpen ? (
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-xs animate-pulse">●</span>
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                  Most Polluted Live
                </span>
              </div>
            ) : null}
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="p-1 rounded-md text-dark-muted hover:text-white hover:bg-white/10 transition-colors text-xs"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {/* City list */}
          {sidebarOpen && (
            <div className="max-h-[50vh] overflow-y-auto divide-y divide-white/5 p-1">
              {topPollutedCities.map((c, i) => {
                const color = getAQIColor(c.aqi);
                return (
                  <div
                    key={c.city}
                    onClick={() => {
                      if (c.lat && c.lng) {
                        setTargetCoord([c.lat, c.lng]);
                      }
                    }}
                    className="p-2 flex items-center justify-between hover:bg-white/10 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[11px] font-mono text-dark-muted w-4">
                        {i + 1}.
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-white truncate group-hover:text-accent transition-colors">
                          {c.city}
                        </span>
                        <span className="text-[10px] text-dark-muted font-mono uppercase">
                          {c.dominant_pollutant || "PM2.5"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-mono font-bold"
                        style={{
                          backgroundColor: `${color}25`,
                          color,
                        }}
                      >
                        {formatAQI(c.aqi)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/city/${encodeURIComponent(c.city)}`);
                        }}
                        title="View City Detail"
                        className="text-dark-muted hover:text-white text-xs px-1"
                      >
                        →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. BOTTOM BAR: World Risk Clock (Circular Gauge) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="glass-card border border-white/10 bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-5">
          {/* Circular SVG Gauge */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg
              className="w-16 h-16 -rotate-90"
              viewBox="0 0 100 100"
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="10"
              />
              {/* Segment arcs */}
              {riskClockData.segments.map((seg) => {
                if (seg.count === 0) return null;
                const pathData = describeArc(
                  50,
                  50,
                  40,
                  seg.startAngle,
                  seg.endAngle
                );
                return (
                  <path
                    key={seg.key}
                    d={pathData}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onMouseEnter={() => setClockHoveredBand(seg)}
                    onMouseLeave={() => setClockHoveredBand(null)}
                  />
                );
              })}
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] uppercase font-mono text-dark-muted leading-tight">
                Cities
              </span>
              <span className="font-heading font-bold text-xs text-white">
                {riskClockData.total}
              </span>
            </div>
          </div>

          {/* World Risk Clock Info & Legend */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <div className="flex items-center justify-between">
              <span className="font-heading font-semibold text-xs text-white flex items-center gap-1.5">
                <span>⏱️</span> World Risk Clock
              </span>
              {clockHoveredBand ? (
                <span
                  className="text-[11px] font-mono font-bold"
                  style={{ color: clockHoveredBand.color }}
                >
                  {clockHoveredBand.label}: {clockHoveredBand.count} ({clockHoveredBand.percentage}%)
                </span>
              ) : (
                <span className="text-[10px] text-dark-muted font-mono">
                  Global AQI Spread
                </span>
              )}
            </div>

            {/* Micro color dots legend */}
            <div className="flex items-center gap-2 mt-0.5">
              {riskClockData.segments.map((b) => (
                <div
                  key={b.key}
                  className="flex items-center gap-1 text-[10px] font-mono cursor-pointer"
                  onMouseEnter={() => setClockHoveredBand(b)}
                  onMouseLeave={() => setClockHoveredBand(null)}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="text-dark-muted hidden sm:inline">
                    {b.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
