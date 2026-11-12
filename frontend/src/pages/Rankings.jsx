import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAQIData } from "../hooks/useAQIData";
import {
  getAQIColor,
  getAQILabel,
  getCityRegion,
  formatAQI,
} from "../utils/aqiHelpers";
import FreshnessBadge from "../components/FreshnessBadge";
import ErrorMessage from "../components/ErrorMessage";

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
  "New York": { flag: "🇺🇸", country: "USA" },
  "Los Angeles": { flag: "🇺🇸", country: "USA" },
  "Mexico City": { flag: "🇲🇽", country: "Mexico" },
  "São Paulo": { flag: "🇧🇷", country: "Brazil" },
  "Buenos Aires": { flag: "🇦🇷", country: "Argentina" },
  Lima: { flag: "🇵🇪", country: "Peru" },
  Bogota: { flag: "🇨🇴", country: "Colombia" },
  Toronto: { flag: "🇨🇦", country: "Canada" },
  Chicago: { flag: "🇺🇸", country: "USA" },
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

const REGION_TABS = ["All", "Asia", "Europe", "Americas", "Africa", "Oceania"];

export default function Rankings() {
  const { cities = [], rankings, loading, error, refetch } = useAQIData();
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("aqi"); // "aqi" | "pm25" | "city" | "country"
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" | "desc"
  const navigate = useNavigate();

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "city" || field === "country" ? "asc" : "desc");
    }
  };

  // Filter & Sort Pipeline
  const filteredAndSortedCities = useMemo(() => {
    let result = cities.map((c, index) => {
      const meta = getCityMeta(c.city);
      const region = getCityRegion(c.city);
      return {
        ...c,
        countryName: c.country || meta.country,
        flag: meta.flag,
        region,
        originalRank: index + 1,
      };
    });

    // 1. Region Filter
    if (selectedRegion !== "All") {
      result = result.filter((c) => c.region === selectedRegion);
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.city.toLowerCase().includes(q) ||
          c.countryName.toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA, valB;

      if (sortField === "aqi") {
        valA = a.aqi ?? -1;
        valB = b.aqi ?? -1;
      } else if (sortField === "pm25") {
        valA = a.pm25 ?? -1;
        valB = b.pm25 ?? -1;
      } else if (sortField === "city") {
        return sortOrder === "asc"
          ? a.city.localeCompare(b.city)
          : b.city.localeCompare(a.city);
      } else if (sortField === "country") {
        return sortOrder === "asc"
          ? a.countryName.localeCompare(b.countryName)
          : b.countryName.localeCompare(a.countryName);
      }

      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

    return result;
  }, [cities, selectedRegion, searchQuery, sortField, sortOrder]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <div className="h-10 skeleton w-64 rounded-xl" />
        <div className="h-12 skeleton rounded-xl" />
        <div className="h-96 skeleton rounded-2xl" />
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-light-text dark:text-white flex items-center gap-2">
            <span>🏆</span> Global Air Quality Rankings
          </h1>
          <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted mt-1">
            {rankings?.total ?? cities.length} cities worldwide · Global Average AQI:{" "}
            <span className="font-mono font-bold text-accent">
              {rankings?.average_aqi ?? "—"}
            </span>
          </p>
        </div>

        {/* Search input at top right */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by city or country..."
            className="w-full bg-light-card dark:bg-[#0d0520] border border-light-border dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-light-text dark:text-white placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:border-accent"
          />
          <svg
            className="w-4 h-4 text-light-muted dark:text-dark-muted absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light-muted hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Region Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {REGION_TABS.map((region) => (
          <button
            key={region}
            onClick={() => setSelectedRegion(region)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex-shrink-0 ${
              selectedRegion === region
                ? "bg-accent text-white shadow-sm shadow-accent/30 font-semibold"
                : "bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-white"
            }`}
          >
            {region}
          </button>
        ))}
      </div>

      {/* Full-Width Sortable Table */}
      <div className="glass-card overflow-hidden border border-black/10 dark:border-white/10 shadow-xl rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-white/10 text-[11px] font-mono text-light-muted dark:text-dark-muted uppercase tracking-wider bg-black/5 dark:bg-white/5">
                <th className="px-4 py-3.5 w-12 text-center">#</th>

                <th
                  onClick={() => handleSort("city")}
                  className="px-4 py-3.5 cursor-pointer hover:text-accent transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>City</span>
                    {sortField === "city" && (
                      <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("country")}
                  className="px-4 py-3.5 hidden sm:table-cell cursor-pointer hover:text-accent transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Country</span>
                    {sortField === "country" && (
                      <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("aqi")}
                  className="px-4 py-3.5 text-right cursor-pointer hover:text-accent transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>AQI</span>
                    {sortField === "aqi" && (
                      <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("pm25")}
                  className="px-4 py-3.5 text-right hidden md:table-cell cursor-pointer hover:text-accent transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>PM2.5</span>
                    {sortField === "pm25" && (
                      <span>{sortOrder === "asc" ? "▲" : "▼"}</span>
                    )}
                  </div>
                </th>

                <th className="px-4 py-3.5 text-center hidden lg:table-cell">
                  Dominant Pollutant
                </th>

                <th className="px-4 py-3.5 text-center hidden sm:table-cell">
                  Status
                </th>

                <th className="px-4 py-3.5 text-right">Freshness</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredAndSortedCities.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-light-muted dark:text-dark-muted font-mono"
                  >
                    No cities matching current filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCities.map((city, index) => {
                  const aqiColor = getAQIColor(city.aqi);
                  return (
                    <tr
                      key={city.city}
                      onClick={() =>
                        navigate(`/city/${encodeURIComponent(city.city)}`)
                      }
                      className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-all duration-150 group"
                    >
                      {/* Rank Number */}
                      <td className="px-4 py-3.5 text-center font-mono text-light-muted dark:text-dark-muted font-bold text-xs">
                        <span className="group-hover:text-accent transition-colors">
                          {index + 1}
                        </span>
                      </td>

                      {/* City Name with Country Flag Emoji */}
                      <td className="px-4 py-3.5 font-heading font-semibold text-light-text dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="text-base sm:text-lg leading-none">
                            {city.flag}
                          </span>
                          <span className="group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                            {city.city}
                          </span>
                        </div>
                      </td>

                      {/* Country Name */}
                      <td className="px-4 py-3.5 text-light-muted dark:text-dark-muted hidden sm:table-cell text-xs">
                        {city.countryName}
                      </td>

                      {/* AQI Pill Badge */}
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-mono font-bold inline-block shadow-sm"
                          style={{
                            backgroundColor: `${aqiColor}20`,
                            color: aqiColor,
                            border: `1px solid ${aqiColor}40`,
                          }}
                        >
                          {formatAQI(city.aqi)}
                        </span>
                      </td>

                      {/* PM2.5 */}
                      <td className="px-4 py-3.5 text-right font-mono text-light-muted dark:text-dark-muted hidden md:table-cell">
                        {city.pm25 != null ? `${city.pm25} µg/m³` : "—"}
                      </td>

                      {/* Dominant Pollutant Tag */}
                      <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                        <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-light-text dark:text-dark-text">
                          {city.dominant_pollutant || "PM2.5"}
                        </span>
                      </td>

                      {/* AQI Status Label */}
                      <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                        <span
                          className="text-xs font-medium"
                          style={{ color: aqiColor }}
                        >
                          {getAQILabel(city.aqi)}
                        </span>
                      </td>

                      {/* Freshness Badge */}
                      <td className="px-4 py-3.5 text-right">
                        <FreshnessBadge freshness={city.freshness} />
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
