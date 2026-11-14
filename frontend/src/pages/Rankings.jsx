import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorMessage from "../components/ErrorMessage";
import { getAQIColor, formatAQI, getCityRegion } from "../utils/aqiHelpers";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:10000";

const CITY_FLAG_MAP = {
  Delhi: { flag: "🇮🇳", country: "India", region: "Asia" },
  Mumbai: { flag: "🇮🇳", country: "India", region: "Asia" },
  Kolkata: { flag: "🇮🇳", country: "India", region: "Asia" },
  Beijing: { flag: "🇨🇳", country: "China", region: "Asia" },
  Shanghai: { flag: "🇨🇳", country: "China", region: "Asia" },
  Tokyo: { flag: "🇯🇵", country: "Japan", region: "Asia" },
  Seoul: { flag: "🇰🇷", country: "South Korea", region: "Asia" },
  Bangkok: { flag: "🇹🇭", country: "Thailand", region: "Asia" },
  Jakarta: { flag: "🇮🇩", country: "Indonesia", region: "Asia" },
  Dhaka: { flag: "🇧🇩", country: "Bangladesh", region: "Asia" },
  Karachi: { flag: "🇵🇰", country: "Pakistan", region: "Asia" },
  Hanoi: { flag: "🇻🇳", country: "Vietnam", region: "Asia" },
  Singapore: { flag: "🇸🇬", country: "Singapore", region: "Asia" },
  "Hong Kong": { flag: "🇭🇰", country: "Hong Kong", region: "Asia" },
  London: { flag: "🇬🇧", country: "United Kingdom", region: "Europe" },
  Paris: { flag: "🇫🇷", country: "France", region: "Europe" },
  Berlin: { flag: "🇩🇪", country: "Germany", region: "Europe" },
  Madrid: { flag: "🇪🇸", country: "Spain", region: "Europe" },
  Rome: { flag: "🇮🇹", country: "Italy", region: "Europe" },
  Moscow: { flag: "🇷🇺", country: "Russia", region: "Europe" },
  Istanbul: { flag: "🇹🇷", country: "Turkey", region: "Europe" },
  Warsaw: { flag: "🇵🇱", country: "Poland", region: "Europe" },
  Amsterdam: { flag: "🇳🇱", country: "Netherlands", region: "Europe" },
  "New York": { flag: "🇺🇸", country: "United States", region: "Americas" },
  "Los Angeles": { flag: "🇺🇸", country: "United States", region: "Americas" },
  "Mexico City": { flag: "🇲🇽", country: "Mexico", region: "Americas" },
  "São Paulo": { flag: "🇧🇷", country: "Brazil", region: "Americas" },
  "Buenos Aires": { flag: "🇦🇷", country: "Argentina", region: "Americas" },
  Lima: { flag: "🇵🇪", country: "Peru", region: "Americas" },
  Bogota: { flag: "🇨🇴", country: "Colombia", region: "Americas" },
  Toronto: { flag: "🇨🇦", country: "Canada", region: "Americas" },
  Chicago: { flag: "🇺🇸", country: "United States", region: "Americas" },
  Lagos: { flag: "🇳🇬", country: "Nigeria", region: "Africa" },
  Cairo: { flag: "🇪🇬", country: "Egypt", region: "Africa" },
  Nairobi: { flag: "🇰🇪", country: "Kenya", region: "Africa" },
  Johannesburg: { flag: "🇿🇦", country: "South Africa", region: "Africa" },
  Accra: { flag: "🇬🇭", country: "Ghana", region: "Africa" },
  Addis: { flag: "🇪🇹", country: "Ethiopia", region: "Africa" },
  Sydney: { flag: "🇦🇺", country: "Australia", region: "Oceania" },
  Melbourne: { flag: "🇦🇺", country: "Australia", region: "Oceania" },
  Auckland: { flag: "🇳🇿", country: "New Zealand", region: "Oceania" },
};

function getCityMeta(cityName) {
  return CITY_FLAG_MAP[cityName] || { flag: "🌐", country: "Global", region: null };
}

const REGIONS = ["All", "Asia", "Europe", "Americas", "Africa", "Oceania"];

export default function Rankings() {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Controls state
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [sortField, setSortField] = useState("aqi"); // "aqi" | "pm25" | "country"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchRankings = () => {
    setLoading(true);
    setError(null);

    axios
      .get(`${BASE}/api/aqi/rankings`)
      .then((res) => {
        let list = [];
        if (Array.isArray(res.data?.rankings)) {
          list = res.data.rankings;
        } else if (Array.isArray(res.data?.data)) {
          list = res.data.data;
        } else if (Array.isArray(res.data)) {
          list = res.data;
        }
        setCities(list);
      })
      .catch((err) => {
        setError(err.message || "Failed to load rankings telemetry");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  // Sort click handler
  const handleSortClick = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "country" ? "asc" : "desc");
    }
  };

  // Filter and Sort Pipeline
  const displayedCities = useMemo(() => {
    let result = cities.map((c, idx) => {
      const meta = getCityMeta(c.city);
      const resolvedRegion = c.region || meta.region || getCityRegion(c.city);
      const resolvedCountry = c.country || meta.country;
      const flag = meta.flag || "🌐";

      return {
        ...c,
        resolvedRegion: resolvedRegion !== "Other" ? resolvedRegion : null,
        resolvedCountry,
        flag,
        originalRank: c.rank != null ? c.rank : idx + 1,
      };
    });

    // 1. Filter by Region (if null, city only appears in "All")
    if (selectedRegion !== "All") {
      result = result.filter((c) => c.resolvedRegion === selectedRegion);
    }

    // 2. Filter by Search Query
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const nameMatch = c.city && c.city.toLowerCase().includes(q);
        const countryMatch = c.resolvedCountry && c.resolvedCountry.toLowerCase().includes(q);
        return nameMatch || countryMatch;
      });
    }

    // 3. Sort
    result.sort((a, b) => {
      if (sortField === "aqi") {
        const valA = a.aqi != null ? a.aqi : -1;
        const valB = b.aqi != null ? b.aqi : -1;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      if (sortField === "pm25") {
        const valA = a.pm25 != null ? a.pm25 : -1;
        const valB = b.pm25 != null ? b.pm25 : -1;
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      if (sortField === "country") {
        const strA = a.resolvedCountry || "";
        const strB = b.resolvedCountry || "";
        return sortOrder === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      }
      return 0;
    });

    return result;
  }, [cities, selectedRegion, debouncedQuery, sortField, sortOrder]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>🏆</span> Global Air Quality Rankings
          </h1>
          <p className="text-xs sm:text-sm text-dark-muted mt-1">
            Real-time urban telemetry ranked by Air Quality Index and particulate metrics
          </p>
        </div>
      </div>

      {/* CONTROLS ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Region Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {REGIONS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedRegion(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                selectedRegion === tab
                  ? "bg-accent text-white font-semibold shadow-sm shadow-accent/30"
                  : "bg-white/5 border border-white/10 text-dark-muted hover:text-white hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sort & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Sort Buttons */}
          <div className="inline-flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <span className="px-2 text-dark-muted font-mono uppercase text-[10px]">Sort:</span>
            {[
              { id: "aqi", label: "AQI" },
              { id: "pm25", label: "PM2.5" },
              { id: "country", label: "Country" },
            ].map(({ id, label }) => {
              const isActive = sortField === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSortClick(id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    isActive
                      ? "bg-accent text-white font-bold"
                      : "text-dark-muted hover:text-white"
                  }`}
                >
                  <span>{label}</span>
                  {isActive && <span>{sortOrder === "asc" ? "▲" : "▼"}</span>}
                </button>
              );
            })}
          </div>

          {/* Search Input (Debounced 300ms) */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by city or country..."
              className="w-full bg-[#0d0520] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-dark-muted focus:outline-none focus:border-accent"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-dark-muted">
              🔍
            </span>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-dark-muted hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="py-12">
          <ErrorMessage message={error} onRetry={fetchRankings} />
        </div>
      )}

      {/* TABLE */}
      <div className="glass-card overflow-hidden border border-white/10 rounded-2xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-mono text-dark-muted uppercase tracking-wider bg-white/5">
                <th className="px-4 py-3.5 w-16 text-center">#</th>
                <th className="px-4 py-3.5">City</th>
                <th className="px-4 py-3.5">Country</th>
                <th className="px-4 py-3.5 text-right cursor-pointer" onClick={() => handleSortClick("aqi")}>
                  AQI {sortField === "aqi" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="px-4 py-3.5 text-right cursor-pointer" onClick={() => handleSortClick("pm25")}>
                  PM2.5 {sortField === "pm25" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                </th>
                <th className="px-4 py-3.5 text-center">Dominant Pollutant</th>
                <th className="px-4 py-3.5 text-center">Data Quality</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                /* 8 Placeholder Skeleton Rows while loading */
                [...Array(8)].map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse h-14" data-testid="ranking-skeleton-row">
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-4 w-6 bg-white/5 rounded mx-auto" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-28 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-4 w-24 bg-white/5 rounded" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-6 w-12 bg-white/5 rounded-full ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="h-4 w-12 bg-white/5 rounded ml-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-5 w-16 bg-white/5 rounded-md mx-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-4 w-20 bg-white/5 rounded mx-auto" />
                    </td>
                  </tr>
                ))
              ) : displayedCities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-dark-muted font-mono">
                    No cities matching the selected criteria.
                  </td>
                </tr>
              ) : (
                displayedCities.map((city, idx) => {
                  const aqiColor = getAQIColor(city.aqi);
                  const dq = city.data_quality ? String(city.data_quality).toLowerCase() : null;
                  const isGood = dq === "good";
                  const isPartial = dq === "partial";

                  return (
                    <tr
                      key={city.city || idx}
                      onClick={() => navigate(`/city/${encodeURIComponent(city.city)}`)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-white/10 even:bg-white/[0.02]"
                    >
                      {/* Rank # (Large muted number) */}
                      <td className="px-4 py-3.5 text-center font-mono text-base font-bold text-dark-muted">
                        {idx + 1}
                      </td>

                      {/* City Name */}
                      <td className="px-4 py-3.5 font-heading font-semibold text-white">
                        <span className="hover:text-accent transition-colors">
                          {city.city || "—"}
                        </span>
                      </td>

                      {/* Country: flag emoji + country name */}
                      <td className="px-4 py-3.5 text-dark-muted">
                        <div className="flex items-center gap-2">
                          <span className="text-base leading-none">{city.flag}</span>
                          <span>{city.resolvedCountry || "—"}</span>
                        </div>
                      </td>

                      {/* AQI: colored pill badge */}
                      <td className="px-4 py-3.5 text-right">
                        {city.aqi != null ? (
                          <span
                            className="inline-block px-2.5 py-0.5 rounded-full font-mono text-xs font-bold shadow-sm"
                            style={{
                              backgroundColor: `${aqiColor}20`,
                              color: aqiColor,
                              border: `1px solid ${aqiColor}40`,
                            }}
                          >
                            {formatAQI(city.aqi)}
                          </span>
                        ) : (
                          <span className="font-mono text-dark-muted">—</span>
                        )}
                      </td>

                      {/* PM2.5: value or "—" */}
                      <td className="px-4 py-3.5 text-right font-mono text-white/90">
                        {city.pm25 != null ? `${city.pm25} µg/m³` : "—"}
                      </td>

                      {/* Dominant Pollutant tag */}
                      <td className="px-4 py-3.5 text-center">
                        {city.dominant_pollutant ? (
                          <span className="inline-block px-2 py-0.5 rounded-md font-mono text-[11px] uppercase tracking-wide bg-white/5 border border-white/10 text-accent font-semibold">
                            {city.dominant_pollutant}
                          </span>
                        ) : (
                          <span className="font-mono text-dark-muted">—</span>
                        )}
                      </td>

                      {/* Data Quality: good=green, partial=yellow, poor=red */}
                      <td className="px-4 py-3.5 text-center">
                        {dq ? (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs capitalize">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isGood
                                  ? "bg-green-400"
                                  : isPartial
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              }`}
                            />
                            <span className="text-white/80">{dq}</span>
                          </div>
                        ) : (
                          <span className="font-mono text-dark-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
