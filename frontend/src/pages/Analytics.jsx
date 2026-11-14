import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import AQIRing from "../components/AQIRing";
import ErrorMessage from "../components/ErrorMessage";
import { getAQIColor, getAQILabel, formatAQI, getCityRegion } from "../utils/aqiHelpers";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

const POLLUTANT_AXES = [
  { key: "pm25", label: "PM2.5", max: 300, unit: "µg/m³" },
  { key: "pm10", label: "PM10", max: 400, unit: "µg/m³" },
  { key: "o3", label: "O₃", max: 200, unit: "µg/m³" },
  { key: "so2", label: "SO₂", max: 200, unit: "µg/m³" },
  { key: "no2", label: "NO₂", max: 200, unit: "µg/m³" },
  { key: "co", label: "CO", max: 50, unit: "mg/m³" },
];

export default function Analytics() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Section 1 & 2 & 5 active city
  const [selectedCity, setSelectedCity] = useState("");
  const [cityData, setCityData] = useState(null);
  const [cityLoading, setCityLoading] = useState(false);

  // Section 1: History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Section 3: Regions summary
  const [regionsSummary, setRegionsSummary] = useState([]);

  // Section 4: Duel cities
  const [duelCityA, setDuelCityA] = useState("");
  const [duelCityB, setDuelCityB] = useState("");
  const [duelDataA, setDuelDataA] = useState(null);
  const [duelDataB, setDuelDataB] = useState(null);
  const [duelLoading, setDuelLoading] = useState(false);

  // Section 5: Forecast
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Initial load: Fetch all cities & regions summary
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      axios.get(`${BASE}/api/aqi`),
      axios.get(`${BASE}/api/aqi/regions/summary`),
    ])
      .then(([citiesRes, regionsRes]) => {
        if (!isMounted) return;

        let cityList = [];
        if (citiesRes.status === "fulfilled" && citiesRes.value.data) {
          cityList = Array.isArray(citiesRes.value.data.data)
            ? citiesRes.value.data.data
            : Array.isArray(citiesRes.value.data)
            ? citiesRes.value.data
            : [];
          setCities(cityList);

          if (cityList.length > 0) {
            setSelectedCity(cityList[0].city);
            setDuelCityA(cityList[0].city);
            setDuelCityB(cityList[1]?.city || cityList[0].city);
          }
        } else {
          throw new Error("Could not connect to API. Make sure the server is running.");
        }

        // Regions summary
        if (regionsRes.status === "fulfilled" && Array.isArray(regionsRes.value.data)) {
          setRegionsSummary(regionsRes.value.data);
        } else {
          // Fallback: Compute region summary dynamically from cities list
          const regionMap = {};
          cityList.forEach((c) => {
            const reg = getCityRegion(c.city);
            if (!regionMap[reg]) {
              regionMap[reg] = { region: reg, totalAqi: 0, city_count: 0, cities: [] };
            }
            if (c.aqi != null) {
              regionMap[reg].totalAqi += c.aqi;
              regionMap[reg].city_count += 1;
              regionMap[reg].cities.push(c);
            }
          });

          const derived = Object.values(regionMap).map((r) => {
            const avg = r.city_count > 0 ? Math.round(r.totalAqi / r.city_count) : 0;
            return {
              region: r.region,
              avg_aqi: avg,
              city_count: r.city_count,
            };
          });
          setRegionsSummary(derived);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load analytics data");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When selectedCity changes: fetch city data, 7-day history, and 3-day forecast
  useEffect(() => {
    if (!selectedCity) return;
    let isMounted = true;

    setCityLoading(true);
    setHistoryLoading(true);
    setForecastLoading(true);

    // 1. City Full Data
    axios
      .get(`${BASE}/api/aqi/${encodeURIComponent(selectedCity)}`)
      .then((res) => {
        if (isMounted) setCityData(res.data);
      })
      .catch(() => {
        if (isMounted) {
          // Fallback to local snapshot
          const found = cities.find((c) => c.city === selectedCity);
          setCityData(found || null);
        }
      })
      .finally(() => {
        if (isMounted) setCityLoading(false);
      });

    // 2. 7-Day History
    axios
      .get(`${BASE}/api/aqi/${encodeURIComponent(selectedCity)}/history?days=7`)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.data)
            ? res.data.data
            : [];
          setHistory(list);
        }
      })
      .catch(() => {
        if (isMounted) setHistory([]);
      })
      .finally(() => {
        if (isMounted) setHistoryLoading(false);
      });

    // 3. 3-Day Forecast
    axios
      .get(`${BASE}/api/aqi/forecast/${encodeURIComponent(selectedCity)}`)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.forecast)
            ? res.data.forecast
            : null;
          setForecast(list);
        }
      })
      .catch(() => {
        if (isMounted) setForecast(null);
      })
      .finally(() => {
        if (isMounted) setForecastLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCity, cities]);

  // When Duel cities change: fetch both cities
  useEffect(() => {
    if (!duelCityA || !duelCityB) return;
    let isMounted = true;
    setDuelLoading(true);

    Promise.allSettled([
      axios.get(`${BASE}/api/aqi/${encodeURIComponent(duelCityA)}`),
      axios.get(`${BASE}/api/aqi/${encodeURIComponent(duelCityB)}`),
    ])
      .then(([resA, resB]) => {
        if (!isMounted) return;
        if (resA.status === "fulfilled" && resA.value.data) {
          setDuelDataA(resA.value.data);
        } else {
          setDuelDataA(cities.find((c) => c.city === duelCityA) || null);
        }

        if (resB.status === "fulfilled" && resB.value.data) {
          setDuelDataB(resB.value.data);
        } else {
          setDuelDataB(cities.find((c) => c.city === duelCityB) || null);
        }
      })
      .finally(() => {
        if (isMounted) setDuelLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [duelCityA, duelCityB, cities]);

  // Section 2: Pollutant Radar normalizations
  const radarData = useMemo(() => {
    if (!cityData) return [];
    return POLLUTANT_AXES.map((axis) => {
      const rawVal = cityData[axis.key];
      const hasValue = rawVal != null && !isNaN(rawVal);
      const normalized = hasValue ? Math.min(100, Math.round((rawVal / axis.max) * 100)) : 0;
      return {
        pollutant: axis.label,
        value: normalized,
        raw: hasValue ? rawVal : null,
        unit: axis.unit,
      };
    });
  }, [cityData]);

  const hasMissingPollutant = useMemo(() => {
    if (!cityData) return false;
    return POLLUTANT_AXES.some((a) => cityData[a.key] == null);
  }, [cityData]);

  // Latest AQI color for gradient
  const latestAqi = cityData?.aqi ?? (history.length > 0 ? history[history.length - 1]?.aqi : null);
  const trendColor = getAQIColor(latestAqi);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-pulse" data-testid="analytics-skeleton">
        {/* Skeleton Top Bar */}
        <div className="h-10 bg-white/5 rounded-xl w-64" />
        {/* Section 1 Skeleton */}
        <div className="h-72 bg-white/5 rounded-2xl w-full" />
        {/* Section 2 & 3 Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-2xl" />
          <div className="h-80 bg-white/5 rounded-2xl" />
        </div>
        {/* Section 4 Skeleton */}
        <div className="h-96 bg-white/5 rounded-2xl" />
        {/* Section 5 Skeleton */}
        <div className="h-48 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>📊</span> Atmospheric Analytics
          </h1>
          <p className="text-xs sm:text-sm text-dark-muted mt-1">
            Real-time pollutant saturation, regional benchmarks, and head-to-head city duels.
          </p>
        </div>

        {/* Global Section 1 / 2 / 5 City Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono uppercase tracking-wider text-dark-muted">
            Focus City:
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-[#0d0520] border border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-accent"
          >
            {cities.map((c) => (
              <option key={c.city} value={c.city}>
                {c.city} (AQI {formatAQI(c.aqi)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1 — City Trend (top of page, full width) */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <span>📈</span> 7-Day AQI Trajectory: <span className="text-accent">{selectedCity}</span>
            </h2>
            <p className="text-xs text-dark-muted">
              Historical air quality index recorded over the last 7 days
            </p>
          </div>
          {latestAqi != null && (
            <span
              className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: `${trendColor}25`,
                color: trendColor,
                border: `1px solid ${trendColor}40`,
              }}
            >
              Latest AQI: {formatAQI(latestAqi)} · {getAQILabel(latestAqi)}
            </span>
          )}
        </div>

        {historyLoading ? (
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        ) : history.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center gap-3 text-center px-4">
            <span className="text-3xl text-dark-muted">🕒</span>
            <p className="text-sm text-dark-muted font-medium max-w-md">
              Historical data accumulates with each pipeline run — check back soon
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aqiTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={trendColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => {
                    if (!val) return "";
                    const parts = val.split(" ");
                    return parts[0]?.slice(5) || val;
                  }}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, "auto"]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const aqiVal = data.aqi;
                      const col = getAQIColor(aqiVal);
                      return (
                        <div className="glass-card p-2.5 bg-[#0d0520]/95 border border-white/10 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-heading font-semibold text-white">{data.date || "Date"}</p>
                          <p className="font-mono font-bold" style={{ color: col }}>
                            AQI {formatAQI(aqiVal)} ({getAQILabel(aqiVal)})
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="aqi"
                  stroke={trendColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#aqiTrendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* SECTION 2 & SECTION 3 (Split Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2 — Pollutant Radar (left half) */}
        <section className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <span>🕸️</span> Pollutant Radar Array
              </h2>
              <p className="text-xs text-dark-muted">
                Normalized saturation profile for {selectedCity}
              </p>
            </div>
            <span className="text-[11px] font-mono uppercase text-accent font-semibold">
              {cityData?.dominant_pollutant ? `Dominant: ${cityData.dominant_pollutant}` : "Telemetry"}
            </span>
          </div>

          {cityLoading ? (
            <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="pollutant" stroke="#94a3b8" fontSize={11} />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="rgba(255,255,255,0.05)"
                    tick={false}
                  />
                  <Radar
                    name={selectedCity}
                    dataKey="value"
                    stroke="#38bdf8"
                    fill="#38bdf8"
                    fillOpacity={0.35}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const row = payload[0].payload;
                        return (
                          <div className="glass-card p-2.5 bg-[#0d0520]/95 border border-white/10 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-heading font-semibold text-white">{row.pollutant}</p>
                            <p className="font-mono text-accent">
                              {row.raw != null ? `${row.raw} ${row.unit}` : "No sensor data"}
                            </p>
                            <p className="text-[10px] text-dark-muted">Scale Index: {row.value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {hasMissingPollutant && (
            <p className="text-[11px] text-amber-400/90 font-mono text-center">
              * Some pollutants unavailable for this station
            </p>
          )}
        </section>

        {/* SECTION 3 — Region Comparison (right half) */}
        <section className="glass-card p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                <span>🌍</span> Continental Benchmarks
              </h2>
              <p className="text-xs text-dark-muted">
                Average AQI across continental clusters
              </p>
            </div>
            <span className="text-[11px] font-mono text-dark-muted">Lower = Healthier</span>
          </div>

          <div className="h-64 w-full">
            {regionsSummary.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-dark-muted">
                No regional data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionsSummary} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey="region"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    tick={({ x, y, payload }) => {
                      const regionObj = regionsSummary.find((r) => r.region === payload.value);
                      const count = regionObj?.city_count;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={10} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                            {payload.value}
                          </text>
                          {count != null && (
                            <text x={0} y={23} textAnchor="middle" fill="#64748b" fontSize={9}>
                              ({count} cities)
                            </text>
                          )}
                        </g>
                      );
                    }}
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        const col = getAQIColor(item.avg_aqi);
                        return (
                          <div className="glass-card p-2.5 bg-[#0d0520]/95 border border-white/10 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-heading font-semibold text-white">{item.region}</p>
                            <p className="font-mono font-bold" style={{ color: col }}>
                              Avg AQI: {item.avg_aqi} ({getAQILabel(item.avg_aqi)})
                            </p>
                            {item.city_count != null && (
                              <p className="text-[10px] text-dark-muted">Cities: {item.city_count}</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avg_aqi" radius={[6, 6, 0, 0]}>
                    {regionsSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getAQIColor(entry.avg_aqi)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      {/* SECTION 4 — City vs City Duel (full width) */}
      <section className="glass-card p-6 space-y-6">
        <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
              <span>⚔️</span> City vs City Duel
            </h2>
            <p className="text-xs text-dark-muted">
              Direct head-to-head pollutant comparison. Lower pollutant values indicate cleaner air.
            </p>
          </div>
        </div>

        {/* Dropdown Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold">
              City A:
            </label>
            <select
              value={duelCityA}
              onChange={(e) => setDuelCityA(e.target.value)}
              className="w-full bg-[#0d0520] border border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-accent"
            >
              {cities.map((c) => (
                <option key={`duelA-${c.city}`} value={c.city}>
                  {c.city} (AQI {formatAQI(c.aqi)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-semibold">
              City B:
            </label>
            <select
              value={duelCityB}
              onChange={(e) => setDuelCityB(e.target.value)}
              className="w-full bg-[#0d0520] border border-white/10 rounded-xl px-3 py-2 text-sm font-medium text-white focus:outline-none focus:border-purple-400"
            >
              {cities.map((c) => (
                <option key={`duelB-${c.city}`} value={c.city}>
                  {c.city} (AQI {formatAQI(c.aqi)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Split Duel Panel with Center VS */}
        {duelLoading ? (
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Left Contender: City A */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <AQIRing aqi={duelDataA?.aqi} size={80} />
                <div>
                  <h3 className="text-xl font-heading font-extrabold text-white">
                    {duelDataA?.city || duelCityA}
                  </h3>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: getAQIColor(duelDataA?.aqi) }}
                  >
                    AQI {formatAQI(duelDataA?.aqi)} · {getAQILabel(duelDataA?.aqi)}
                  </p>
                  <p className="text-[11px] text-dark-muted font-mono mt-0.5">
                    Dominant: {duelDataA?.dominant_pollutant || "PM2.5"}
                  </p>
                </div>
              </div>
            </div>

            {/* VS Divider in Center */}
            <div className="md:col-span-1 flex items-center justify-center">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 text-white font-extrabold text-xs flex items-center justify-center shadow-lg shadow-accent/20">
                VS
              </span>
            </div>

            {/* Right Contender: City B */}
            <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center gap-4">
                <AQIRing aqi={duelDataB?.aqi} size={80} />
                <div>
                  <h3 className="text-xl font-heading font-extrabold text-white">
                    {duelDataB?.city || duelCityB}
                  </h3>
                  <p
                    className="text-xs font-semibold"
                    style={{ color: getAQIColor(duelDataB?.aqi) }}
                  >
                    AQI {formatAQI(duelDataB?.aqi)} · {getAQILabel(duelDataB?.aqi)}
                  </p>
                  <p className="text-[11px] text-dark-muted font-mono mt-0.5">
                    Dominant: {duelDataB?.dominant_pollutant || "PM2.5"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        <div className="divide-y divide-white/5 border-t border-white/10 pt-2">
          {POLLUTANT_AXES.map((axis) => {
            const valA = duelDataA?.[axis.key];
            const valB = duelDataB?.[axis.key];

            const hasA = valA != null && !isNaN(valA);
            const hasB = valB != null && !isNaN(valB);

            // Lower value wins (cleaner)
            let winner = null;
            if (hasA && hasB && valA !== valB) {
              winner = valA < valB ? "A" : "B";
            }

            return (
              <div
                key={axis.key}
                className="py-3 grid grid-cols-3 items-center text-xs sm:text-sm font-mono"
              >
                {/* City A Value */}
                <div className="text-left flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      winner === "A"
                        ? "bg-green-500/20 text-green-400 font-bold border border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                        : "text-white"
                    }`}
                  >
                    {hasA ? `${valA} ${axis.unit}` : "—"}
                  </span>
                  {winner === "A" && (
                    <span className="text-[10px] uppercase font-bold text-green-400 hidden sm:inline">
                      Cleaner ★
                    </span>
                  )}
                </div>

                {/* Pollutant Name */}
                <div className="text-center font-heading font-semibold text-dark-muted text-xs">
                  {axis.label}
                </div>

                {/* City B Value */}
                <div className="text-right flex items-center justify-end gap-2">
                  {winner === "B" && (
                    <span className="text-[10px] uppercase font-bold text-green-400 hidden sm:inline">
                      ★ Cleaner
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      winner === "B"
                        ? "bg-green-500/20 text-green-400 font-bold border border-green-500/40 shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                        : "text-white"
                    }`}
                  >
                    {hasB ? `${valB} ${axis.unit}` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 5 — 3-Day Forecast (full width, bottom) */}
      <section className="glass-card p-6 space-y-4">
        <div className="border-b border-white/10 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <span>🔮</span> 3-Day Atmospheric Forecast: <span className="text-accent">{selectedCity}</span>
            </h2>
            <p className="text-xs text-dark-muted">
              Projected concentrations for PM2.5, Ozone, and UV radiation
            </p>
          </div>
        </div>

        {forecastLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-28 rounded-xl bg-white/5 animate-pulse" />
          </div>
        ) : !forecast || forecast.length === 0 ? (
          <div className="py-8 text-center text-xs text-dark-muted font-mono">
            Forecast data unavailable for this station
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.slice(0, 3).map((day, i) => (
              <div
                key={day.date || day.day || i}
                className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 space-y-3"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-heading font-semibold text-sm text-white">
                    {day.date || `Day ${i + 1}`}
                  </span>
                  <span className="text-[10px] font-mono uppercase text-accent font-semibold">
                    {day.weather || "Forecast"}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">PM2.5 Avg:</span>
                    <span className="text-white font-bold">{day.pm25_avg != null ? `${day.pm25_avg} µg/m³` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">O₃ Avg:</span>
                    <span className="text-white font-bold">{day.o3_avg != null ? `${day.o3_avg} µg/m³` : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">UVI Avg:</span>
                    <span className="text-white font-bold">{day.uvi_avg != null ? day.uvi_avg : "—"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
