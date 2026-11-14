import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import AQIRing from "../components/AQIRing";
import ErrorMessage from "../components/ErrorMessage";
import {
  getAQIColor,
  getAQILabel,
  getBreathingDuration,
  getRiskLevel,
  formatAQI,
} from "../utils/aqiHelpers";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

const CITY_FLAG_MAP = {
  Delhi: { flag: "🇮🇳", country: "India" },
  Mumbai: { flag: "🇮🇳", country: "India" },
  Kolkata: { flag: "🇮🇳", country: "India" },
  Beijing: { flag: "🇨🇳", country: "China" },
  Shanghai: { flag: "🇨🇳", country: "China" },
  Tokyo: { flag: "🇯🇵", country: "Japan" },
  Seoul: { flag: "🇰🇷", country: "South Korea" },
  Bangkok: { flag: "🇹🇭", country: "Thailand" },
  Jakarta: { flag: "🇮🇩", country: "Indonesia" },
  Dhaka: { flag: "🇧🇩", country: "Bangladesh" },
  Karachi: { flag: "🇵🇰", country: "Pakistan" },
  Hanoi: { flag: "🇻🇳", country: "Vietnam" },
  Singapore: { flag: "🇸🇬", country: "Singapore" },
  "Hong Kong": { flag: "🇭🇰", country: "Hong Kong" },
  London: { flag: "🇬🇧", country: "United Kingdom" },
  Paris: { flag: "🇫🇷", country: "France" },
  Berlin: { flag: "🇩🇪", country: "Germany" },
  Madrid: { flag: "🇪🇸", country: "Spain" },
  Rome: { flag: "🇮🇹", country: "Italy" },
  Moscow: { flag: "🇷🇺", country: "Russia" },
  Istanbul: { flag: "🇹🇷", country: "Turkey" },
  Warsaw: { flag: "🇵🇱", country: "Poland" },
  Amsterdam: { flag: "🇳🇱", country: "Netherlands" },
  "New York": { flag: "🇺🇸", country: "United States" },
  "Los Angeles": { flag: "🇺🇸", country: "United States" },
  "Mexico City": { flag: "🇲🇽", country: "Mexico" },
  "São Paulo": { flag: "🇧🇷", country: "Brazil" },
  "Buenos Aires": { flag: "🇦🇷", country: "Argentina" },
  Lima: { flag: "🇵🇪", country: "Peru" },
  Bogota: { flag: "🇨🇴", country: "Colombia" },
  Toronto: { flag: "🇨🇦", country: "Canada" },
  Chicago: { flag: "🇺🇸", country: "United States" },
  Lagos: { flag: "🇳🇬", country: "Nigeria" },
  Cairo: { flag: "🇪🇬", country: "Egypt" },
  Nairobi: { flag: "🇰🇪", country: "Kenya" },
  Johannesburg: { flag: "🇿🇦", country: "South Africa" },
  Accra: { flag: "🇬🇭", country: "Ghana" },
  Addis: { flag: "🇪🇹", country: "Ethiopia" },
  Sydney: { flag: "🇦🇺", country: "Australia" },
  Melbourne: { flag: "🇦🇺", country: "Australia" },
  Auckland: { flag: "🇳🇿", country: "New Zealand" },
};

function getCityMeta(cityName) {
  return CITY_FLAG_MAP[cityName] || { flag: "🌐", country: "Global" };
}

function getCityHealthAdvisory(aqi) {
  if (aqi == null) return "No air quality advisory available for this city.";
  if (aqi <= 50) return "Air quality is good. Enjoy outdoor activities.";
  if (aqi <= 100) return "Moderate air quality. Unusually sensitive people should consider reducing prolonged outdoor exertion.";
  if (aqi <= 150) return "Sensitive groups should reduce outdoor exertion. Others can continue normal activities.";
  if (aqi <= 200) return "Everyone should reduce prolonged outdoor exertion. Sensitive groups should avoid outdoor activity.";
  if (aqi <= 300) return "Avoid prolonged outdoor exertion. Everyone especially sensitive groups should stay indoors.";
  return "Hazardous. Everyone should avoid all outdoor activity.";
}

const POLLUTANT_CONFIG = [
  { key: "pm25", label: "PM2.5", unit: "µg/m³", max: 300 },
  { key: "pm10", label: "PM10", unit: "µg/m³", max: 400 },
  { key: "o3", label: "O₃", unit: "ppb", max: 200 },
  { key: "so2", label: "SO₂", unit: "µg/m³", max: 200 },
  { key: "no2", label: "NO₂", unit: "µg/m³", max: 200 },
  { key: "co", label: "CO", unit: "mg/m³", max: 50 },
];

function SemicircleGauge({ value, max, color }) {
  const isNull = value == null || isNaN(value);
  const pct = isNull ? 0 : Math.min(1, Math.max(0, value / max));
  const strokeColor = isNull ? "#64748b" : color;
  const radius = 24;
  const arcLength = Math.PI * radius; // 180 degrees semicircle
  const strokeDash = pct * arcLength;

  return (
    <svg width="56" height="32" viewBox="0 0 56 32" className="overflow-visible">
      {/* Background arc */}
      <path
        d="M 4 28 A 24 24 0 0 1 52 28"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Foreground progress arc */}
      <path
        d="M 4 28 A 24 24 0 0 1 52 28"
        fill="none"
        stroke={strokeColor}
        strokeWidth="4"
        strokeDasharray={`${strokeDash} ${arcLength}`}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function CityDetail() {
  const { name } = useParams();
  const navigate = useNavigate();

  const [city, setCity] = useState(null);
  const [history, setHistory] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Personal Risk Calculator state
  const [ageGroup, setAgeGroup] = useState("Adult");
  const [outdoorHours, setOutdoorHours] = useState("1h");
  const [respiratory, setRespiratory] = useState(false);

  useEffect(() => {
    if (!name) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      axios.get(`${BASE}/api/aqi/${encodeURIComponent(name)}`),
      axios.get(`${BASE}/api/aqi/${encodeURIComponent(name)}/history?days=7`),
      axios.get(`${BASE}/api/aqi/forecast/${encodeURIComponent(name)}`),
    ])
      .then(([cityRes, historyRes, forecastRes]) => {
        if (!isMounted) return;

        if (cityRes.status === "fulfilled" && cityRes.value.data) {
          setCity(cityRes.value.data);
        } else {
          throw new Error(`City "${name}" not found`);
        }

        if (historyRes.status === "fulfilled" && historyRes.value.data) {
          const list = Array.isArray(historyRes.value.data)
            ? historyRes.value.data
            : Array.isArray(historyRes.value.data?.data)
            ? historyRes.value.data.data
            : [];
          setHistory(list);
        } else {
          setHistory([]);
        }

        if (forecastRes.status === "fulfilled" && forecastRes.value.data) {
          const fc = Array.isArray(forecastRes.value.data)
            ? forecastRes.value.data
            : Array.isArray(forecastRes.value.data?.forecast)
            ? forecastRes.value.data.forecast
            : null;
          setForecast(fc);
        } else {
          setForecast(null);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "City telemetry not found");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [name]);

  // Derived properties
  const aqiColor = getAQIColor(city?.aqi);
  const breathingDuration = getBreathingDuration(city?.aqi);
  const cityMeta = useMemo(() => getCityMeta(city?.city || name), [city?.city, name]);
  const advisoryText = useMemo(() => getCityHealthAdvisory(city?.aqi), [city?.aqi]);

  // Personal Risk calculation
  const calculatedRisk = useMemo(() => {
    return getRiskLevel(city?.aqi, {
      ageGroup,
      outdoorHours,
      respiratory,
    });
  }, [city?.aqi, ageGroup, outdoorHours, respiratory]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse" data-testid="city-skeleton">
        <div className="h-6 w-24 bg-white/5 rounded-lg" />
        <div className="h-80 bg-white/5 rounded-2xl w-full" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl" />
          ))}
        </div>
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-2xl" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (error || !city) {
    return (
      <div className="max-w-md mx-auto py-20 px-4">
        <ErrorMessage
          message={error || `No telemetry data available for "${name}".`}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Inline Keyframes for breathe-pulse to guarantee execution */}
      <style>{`
        @keyframes breathe-pulse {
          0%, 100% {
            opacity: 0.04;
            transform: scale(1);
          }
          50% {
            opacity: 0.10;
            transform: scale(1.02);
          }
        }
      `}</style>

      {/* Back Link */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-dark-muted hover:text-accent transition-colors"
      >
        <span>←</span> Back
      </button>

      {/* HERO SECTION */}
      <div className="relative glass-card p-6 sm:p-10 overflow-hidden rounded-2xl border border-white/10">
        {/* Breathing Animation Layer */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl z-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${aqiColor} 0%, transparent 75%)`,
            animation: `breathe-pulse ${breathingDuration} ease-in-out infinite`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center space-y-5">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl font-heading font-extrabold text-white tracking-tight flex items-center justify-center gap-3">
              <span>{city.city}</span>
              <span className="text-3xl sm:text-4xl leading-none">{cityMeta.flag}</span>
            </h1>
            <p className="text-sm font-mono text-dark-muted uppercase tracking-wider">
              {city.country || cityMeta.country}
            </p>
          </div>

          {/* 160px AQIRing */}
          <div className="py-2">
            <AQIRing aqi={city.aqi} size={160} />
          </div>

          {/* Health Advisory String */}
          <div className="max-w-xl">
            <p className="text-sm sm:text-base font-medium text-white/90 leading-relaxed">
              {advisoryText}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: aqiColor }}
              />
              <span className="text-xs font-mono font-bold" style={{ color: aqiColor }}>
                {getAQILabel(city.aqi)} Air Quality (AQI {formatAQI(city.aqi)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* POLLUTANT GRID (2 rows × 3 cols) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-white">
            Live Pollutant Concentrations
          </h2>
          <span className="text-xs font-mono text-dark-muted">
            Telemetry Breakdown
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {POLLUTANT_CONFIG.map(({ key, label, unit, max }) => {
            const rawVal = city[key];
            const isNull = rawVal == null || isNaN(rawVal);
            const isImputed = Boolean(city.data_quality_imputed || city[`${key}_imputed`]);
            const polColor = isNull ? "#64748b" : getAQIColor(city.aqi);

            return (
              <div
                key={key}
                className="glass-card p-4 flex flex-col justify-between space-y-3 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-sm text-white">
                    {label}
                  </span>
                  <SemicircleGauge value={rawVal} max={max} color={polColor} />
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span
                    className="text-2xl font-mono font-extrabold text-white"
                    title={isImputed ? "Estimated via regional median" : undefined}
                  >
                    {isImputed && !isNull ? "~" : ""}
                    {isNull ? "—" : rawVal}
                  </span>
                  <span className="text-xs font-mono text-dark-muted">
                    {unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WEATHER STRIP (horizontal row) */}
      <section className="glass-card p-4 overflow-x-auto">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 min-w-[500px]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌡️</span>
            <div>
              <p className="text-[10px] font-mono uppercase text-dark-muted">Temp</p>
              <p className="text-sm font-heading font-bold text-white">
                {city.temperature != null ? `${city.temperature}°C` : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">💧</span>
            <div>
              <p className="text-[10px] font-mono uppercase text-dark-muted">Humidity</p>
              <p className="text-sm font-heading font-bold text-white">
                {city.humidity != null ? `${city.humidity}%` : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">💨</span>
            <div>
              <p className="text-[10px] font-mono uppercase text-dark-muted">Wind</p>
              <p className="text-sm font-heading font-bold text-white">
                {city.wind_speed != null ? `${city.wind_speed} m/s` : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">🔽</span>
            <div>
              <p className="text-[10px] font-mono uppercase text-dark-muted">Pressure</p>
              <p className="text-sm font-heading font-bold text-white">
                {city.pressure != null ? `${city.pressure} hPa` : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl">☀️</span>
            <div>
              <p className="text-[10px] font-mono uppercase text-dark-muted">UV Index</p>
              <p className="text-sm font-heading font-bold text-white">
                {city.uvi != null ? city.uvi : "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7-DAY TREND (Recharts LineChart) */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-heading font-bold text-white">
              7-Day Air Quality Trend
            </h2>
            <p className="text-xs text-dark-muted">
              Historical readings recorded for {city.city}
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-accent">
            Current AQI: {formatAQI(city.aqi)}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-dark-muted font-medium">
              Historical trend accumulates over time
            </p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cityTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={aqiColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={aqiColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (!val) return "";
                    const parts = val.split(" ");
                    return parts[0]?.slice(5) || val;
                  }}
                />
                <YAxis hide domain={["dataMin - 15", "dataMax + 15"]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="glass-card p-2 bg-[#0d0520] border border-white/10 text-xs font-mono text-white">
                          <p className="text-dark-muted">{item.date || "Date"}</p>
                          <p className="font-bold text-accent">AQI {formatAQI(item.aqi)}</p>
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
        )}
      </section>

      {/* PERSONAL RISK CALCULATOR (pure frontend, NO <form>) */}
      <section className="glass-card p-6 space-y-5 border-l-4" style={{ borderColor: calculatedRisk.color }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
              <span>🛡️</span> Your Personal Risk
            </h2>
            <p className="text-xs text-dark-muted">
              Dynamic risk assessment customized for your health profile and outdoor exposure
            </p>
          </div>

          <span
            className="self-start sm:self-auto px-3.5 py-1 rounded-full text-xs font-mono font-bold"
            style={{
              backgroundColor: `${calculatedRisk.color}25`,
              color: calculatedRisk.color,
              border: `1px solid ${calculatedRisk.color}40`,
            }}
          >
            {calculatedRisk.label}
          </span>
        </div>

        {/* Interactive Controls (NO <form> tags) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Age Group Control */}
          <div className="space-y-1.5">
            <span className="block text-xs font-mono uppercase text-dark-muted">
              Age Group
            </span>
            <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {["Child (< 12)", "Adult", "Senior (65+)"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAgeGroup(opt)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                    ageGroup === opt
                      ? "bg-accent text-white font-bold shadow-sm shadow-accent/30"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  {opt === "Child (< 12)" ? "Child" : opt === "Senior (65+)" ? "Senior" : "Adult"}
                </button>
              ))}
            </div>
          </div>

          {/* Outdoor Hours Control */}
          <div className="space-y-1.5">
            <span className="block text-xs font-mono uppercase text-dark-muted">
              Outdoor Hours
            </span>
            <div className="grid grid-cols-4 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {["1h", "2h", "4h", "8h+"].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setOutdoorHours(h)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                    outdoorHours === h
                      ? "bg-accent text-white font-bold shadow-sm shadow-accent/30"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Respiratory Condition Toggle */}
          <div className="space-y-1.5">
            <span className="block text-xs font-mono uppercase text-dark-muted">
              Respiratory Condition
            </span>
            <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              {[
                { label: "No", val: false },
                { label: "Yes", val: true },
              ].map(({ label, val }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setRespiratory(val)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all text-center ${
                    respiratory === val
                      ? val
                        ? "bg-red-500/30 text-red-400 font-bold border border-red-500/40"
                        : "bg-accent text-white font-bold shadow-sm shadow-accent/30"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Advice Output */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
            {calculatedRisk.advice}
          </p>
        </div>
      </section>

      {/* 3-DAY FORECAST */}
      <section className="glass-card p-6 space-y-4">
        <div className="border-b border-white/10 pb-3">
          <h2 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <span>🔮</span> 3-Day Forecast
          </h2>
          <p className="text-xs text-dark-muted">
            Predicted pollutant levels and UV index for {city.city}
          </p>
        </div>

        {!forecast || forecast.length === 0 ? (
          <div className="py-8 text-center text-xs text-dark-muted font-mono">
            Forecast unavailable for this station
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecast.slice(0, 3).map((day, idx) => (
              <div
                key={day.date || idx}
                className="glass-card p-4 rounded-xl border border-white/10 bg-white/5 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-heading font-bold text-sm text-white">
                    {day.date || `Day ${idx + 1}`}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-dark-muted">PM2.5 Avg:</span>
                    <span className="text-white font-bold">
                      {day.pm25_avg != null ? `${day.pm25_avg} µg/m³` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">O₃ Avg:</span>
                    <span className="text-white font-bold">
                      {day.o3_avg != null ? `${day.o3_avg} ppb` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-muted">UVI:</span>
                    <span className="text-white font-bold">
                      {day.uvi != null ? day.uvi : day.uvi_avg != null ? day.uvi_avg : "—"}
                    </span>
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
