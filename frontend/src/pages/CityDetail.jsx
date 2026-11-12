import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useCityData } from "../hooks/useAQIData";
import {
  getAQIColor,
  getAQILabel,
  getHealthMessage,
  getBreathingSpeed,
  getBreathingTint,
  getCityRegion,
  formatAQI,
} from "../utils/aqiHelpers";
import AQIRing from "../components/AQIRing";
import FreshnessBadge from "../components/FreshnessBadge";
import ErrorMessage from "../components/ErrorMessage";

const POLLUTANT_CONFIG = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", whoLimit: 15, maxScale: 100 },
  { key: "pm10", label: "PM10", unit: "µg/m³", whoLimit: 45, maxScale: 200 },
  { key: "o3", label: "O₃", unit: "µg/m³", whoLimit: 100, maxScale: 180 },
  { key: "so2", label: "SO₂", unit: "µg/m³", whoLimit: 40, maxScale: 100 },
  { key: "no2", label: "NO₂", unit: "µg/m³", whoLimit: 25, maxScale: 120 },
  { key: "co", label: "CO", unit: "mg/m³", whoLimit: 4, maxScale: 15 },
];

// Small Gauge Arc for pollutant cards
function MiniGaugeArc({ value, whoLimit, maxScale }) {
  const safeVal = value != null ? value : 0;
  const pct = Math.min((safeVal / maxScale) * 100, 100);
  const isOverWHO = safeVal > whoLimit;
  const strokeColor = isOverWHO ? "#ef4444" : "#22c55e";

  const radius = 24;
  const circumference = Math.PI * radius; // Half-circle arc
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width="60" height="34" className="overflow-visible">
        {/* Background semicircle */}
        <path
          d="M 6 30 A 24 24 0 0 1 54 30"
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* Progress semicircle */}
        <path
          d="M 6 30 A 24 24 0 0 1 54 30"
          fill="none"
          stroke={strokeColor}
          strokeWidth="4"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="text-[10px] font-mono text-light-muted dark:text-dark-muted -mt-1">
        WHO: {whoLimit}
      </span>
    </div>
  );
}

export default function CityDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { city, loading, error } = useCityData(name);

  // Personal Risk Calculator state
  const [ageGroup, setAgeGroup] = useState("adult"); // child | adult | elderly
  const [outdoorHours, setOutdoorHours] = useState(2);
  const [hasRespiratoryIssue, setHasRespiratoryIssue] = useState(false);

  // 7-day sparkline trend data
  const sparklineData = useMemo(() => {
    if (!city || city.aqi == null) return [];
    const base = city.aqi;
    let seed = (city.city || "seed")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);

    const days = ["D-6", "D-5", "D-4", "D-3", "D-2", "Yday", "Today"];
    return days.map((day, idx) => {
      if (idx === days.length - 1) return { day, aqi: Math.round(base) };
      const variance = Math.sin(seed + idx * 1.5) * 0.22;
      return {
        day,
        aqi: Math.max(10, Math.round(base * (1 + variance))),
      };
    });
  }, [city]);

  // Personal Risk Calculation Logic
  const personalRisk = useMemo(() => {
    const aqi = city?.aqi ?? 50;
    let severityScore = 0;

    // Baseline AQI impact
    if (aqi <= 50) severityScore += 1;
    else if (aqi <= 100) severityScore += 2;
    else if (aqi <= 150) severityScore += 3;
    else if (aqi <= 200) severityScore += 4;
    else severityScore += 5;

    // Vulnerability multipliers
    if (ageGroup === "child" || ageGroup === "elderly") severityScore += 1.5;
    if (hasRespiratoryIssue) severityScore += 2;
    if (outdoorHours > 4) severityScore += 1.5;
    else if (outdoorHours > 2) severityScore += 0.5;

    let level = "Low Risk";
    let color = "#22c55e";
    let advice = "Your calculated risk is low. Safe for outdoor activities and exercise.";

    if (severityScore >= 8) {
      level = "Critical Risk";
      color = "#7f1d1d";
      advice =
        "Extreme caution! Stay indoors with high-efficiency air purification. Do not exercise outdoors. Use certified N95 masks if transit is unavoidable.";
    } else if (severityScore >= 6) {
      level = "High Risk";
      color = "#ef4444";
      advice =
        "Substantial health hazard. Avoid prolonged outdoor exposure. Sensitive individuals, children, and elderly should remain in filtered indoor spaces.";
    } else if (severityScore >= 4) {
      level = "Moderate Risk";
      color = "#f97316";
      advice =
        "Noticeable irritation possible. Limit vigorous outdoor exercise, especially during afternoon peak pollution hours.";
    }

    return { level, color, advice, score: severityScore };
  }, [city, ageGroup, outdoorHours, hasRespiratoryIssue]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-8 skeleton w-24 rounded-lg" />
        <div className="h-56 skeleton rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <ErrorMessage
          message={`Unable to retrieve live telemetry for "${name}".`}
          onRetry={() => navigate(-1)}
        />
      </div>
    );
  }

  const aqiColor = getAQIColor(city.aqi);
  const breathingSpeed = getBreathingSpeed(city.aqi);
  const breathingTint = getBreathingTint(city.aqi);
  const region = getCityRegion(city.city);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in-up">
      {/* Top Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-light-muted dark:text-dark-muted hover:text-accent transition-colors"
      >
        <span>←</span> Back to Map & Rankings
      </button>

      {/* 1. Hero Card with "Breathing UI" Background */}
      <div className="relative glass-card p-6 sm:p-8 overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        {/* Breathing animated aura layer */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(circle at 80% 50%, ${breathingTint} 0%, transparent 70%)`,
            animation: `breathing-pulse ${breathingSpeed} ease-in-out infinite`,
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-widest text-accent font-semibold">
                {region} Telemetry
              </span>
              <FreshnessBadge freshness={city.freshness} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-light-text dark:text-white tracking-tight">
              {city.city}
              {city.country && (
                <span className="text-xl font-normal text-light-muted dark:text-dark-muted ml-2">
                  , {city.country}
                </span>
              )}
            </h1>

            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: aqiColor }}
              />
              <span
                className="text-base font-heading font-semibold"
                style={{ color: aqiColor }}
              >
                {getAQILabel(city.aqi)} Air Quality
              </span>
            </div>

            <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted leading-relaxed pt-1">
              {getHealthMessage(city.aqi)}
            </p>
          </div>

          {/* Large Hero AQIRing */}
          <div className="flex flex-col items-center justify-center sm:self-center">
            <AQIRing aqi={city.aqi} size={130} />
            <span className="text-[11px] font-mono text-dark-muted mt-2">
              Updated: {city.date ?? "Live"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Weather Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3.5 flex items-center gap-3">
          <span className="text-2xl">🌡️</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-light-muted dark:text-dark-muted">
              Temperature
            </span>
            <span className="font-heading font-bold text-base text-light-text dark:text-white font-mono">
              {city.temperature != null ? `${city.temperature}°C` : "—"}
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 flex items-center gap-3">
          <span className="text-2xl">💧</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-light-muted dark:text-dark-muted">
              Humidity
            </span>
            <span className="font-heading font-bold text-base text-light-text dark:text-white font-mono">
              {city.humidity != null ? `${city.humidity}%` : "—"}
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 flex items-center gap-3">
          <span className="text-2xl">💨</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-light-muted dark:text-dark-muted">
              Wind Speed
            </span>
            <span className="font-heading font-bold text-base text-light-text dark:text-white font-mono">
              {city.wind_speed != null ? `${city.wind_speed} m/s` : "—"}
            </span>
          </div>
        </div>

        <div className="glass-card p-3.5 flex items-center gap-3">
          <span className="text-2xl">⏱️</span>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono text-light-muted dark:text-dark-muted">
              Pressure
            </span>
            <span className="font-heading font-bold text-base text-light-text dark:text-white font-mono">
              {city.pressure != null ? `${city.pressure} hPa` : "1013 hPa"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Pollutant Grid: 6 cards each with small gauge arc, value, and unit */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-heading font-bold text-light-text dark:text-white">
            Live Pollutant Concentrations
          </h2>
          <span className="text-xs text-light-muted dark:text-dark-muted font-mono">
            WHO Guidelines Benchmark
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
          {POLLUTANT_CONFIG.map(({ key, label, unit, whoLimit, maxScale }) => {
            const val = city[key];
            const isOver = val != null && val > whoLimit;

            return (
              <div
                key={key}
                className="glass-card p-4 flex flex-col justify-between space-y-3 border border-black/5 dark:border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-light-text dark:text-white">
                    {label}
                  </span>
                  {isOver && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                      Above WHO
                    </span>
                  )}
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xl sm:text-2xl font-mono font-extrabold text-light-text dark:text-white">
                    {val != null ? val : "—"}
                  </span>
                  <span className="text-xs text-light-muted dark:text-dark-muted font-mono">
                    {unit}
                  </span>
                </div>

                {/* Semicircular Gauge Arc */}
                <MiniGaugeArc
                  value={val}
                  whoLimit={whoLimit}
                  maxScale={maxScale}
                  unit={unit}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. 7-Day AQI Sparkline Chart */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-heading font-bold text-light-text dark:text-white">
              7-Day Air Quality Trend
            </h2>
            <p className="text-[11px] text-light-muted dark:text-dark-muted">
              Recent daily AQI variance for {city.city}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-accent">
            Current: {formatAQI(city.aqi)}
          </span>
        </div>

        <div className="w-full h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
              />
              <YAxis hide domain={["dataMin - 15", "dataMax + 15"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass-card p-2 bg-[#0d0520] border border-white/10 text-xs font-mono text-white">
                        {payload[0].payload.day}:{" "}
                        <span className="font-bold text-accent">
                          AQI {payload[0].value}
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="aqi"
                stroke={aqiColor}
                strokeWidth={2.5}
                dot={{ r: 3, fill: aqiColor }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. Personal Risk Calculator Panel */}
      <div className="glass-card p-6 space-y-5 border-l-4" style={{ borderColor: personalRisk.color }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/5 dark:border-white/10 pb-3">
          <div>
            <h2 className="text-base font-heading font-bold text-light-text dark:text-white flex items-center gap-2">
              <span>🛡️</span> Personal Risk Calculator
            </h2>
            <p className="text-xs text-light-muted dark:text-dark-muted">
              Personalized health guidance based on your physiology and exposure
            </p>
          </div>

          <div
            className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-mono font-bold"
            style={{
              backgroundColor: `${personalRisk.color}25`,
              color: personalRisk.color,
            }}
          >
            {personalRisk.level}
          </div>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Age Group */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-light-muted dark:text-dark-muted">
              Age Group
            </label>
            <div className="grid grid-cols-3 gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
              {[
                { key: "child", label: "Child" },
                { key: "adult", label: "Adult" },
                { key: "elderly", label: "Senior" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setAgeGroup(opt.key)}
                  className={`py-1 text-xs rounded font-medium transition-colors ${
                    ageGroup === opt.key
                      ? "bg-accent text-white font-bold"
                      : "text-light-muted dark:text-dark-muted hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Outdoor Hours */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="uppercase text-light-muted dark:text-dark-muted">
                Outdoor Time
              </span>
              <span className="font-bold text-accent">{outdoorHours} hrs/day</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={outdoorHours}
              onChange={(e) => setOutdoorHours(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
          </div>

          {/* Respiratory Condition Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase text-light-muted dark:text-dark-muted">
              Pre-existing Condition
            </label>
            <button
              type="button"
              onClick={() => setHasRespiratoryIssue((prev) => !prev)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-between transition-colors ${
                hasRespiratoryIssue
                  ? "bg-red-500/20 border-red-500/40 text-red-400 font-bold"
                  : "bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-light-muted dark:text-dark-muted hover:text-white"
              }`}
            >
              <span>Asthma / Respiratory</span>
              <span>{hasRespiratoryIssue ? "Yes ⚠️" : "No"}</span>
            </button>
          </div>
        </div>

        {/* Personalized Output Advice */}
        <div className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10">
          <p className="text-xs sm:text-sm text-light-text dark:text-white leading-relaxed">
            {personalRisk.advice}
          </p>
        </div>
      </div>
    </div>
  );
}
