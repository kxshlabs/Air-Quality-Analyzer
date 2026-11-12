export function getAQIColor(aqi) {
  if (aqi === null || aqi === undefined) return "#64748b";
  if (aqi <= 50)  return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  if (aqi <= 300) return "#a855f7";
  return "#7f1d1d";
}

export function getAQILabel(aqi) {
  if (aqi === null || aqi === undefined) return "Unknown";
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export function getAQIBand(aqi) {
  if (aqi === null || aqi === undefined) return "unknown";
  if (aqi <= 50)  return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "usg";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "veryUnhealthy";
  return "hazardous";
}

export function getHealthMessage(aqi) {
  if (aqi === null || aqi === undefined)
    return "No data available for this city.";
  if (aqi <= 50)
    return "Air quality is satisfactory. Safe for all groups.";
  if (aqi <= 100)
    return "Acceptable. Unusually sensitive people should limit prolonged outdoor exertion.";
  if (aqi <= 150)
    return "Sensitive groups (children, elderly, respiratory patients) should reduce outdoor activity.";
  if (aqi <= 200)
    return "Everyone may begin to experience health effects. Limit outdoor activity.";
  if (aqi <= 300)
    return "Health alert: Serious effects for everyone. Avoid all outdoor exposure.";
  return "HAZARDOUS: Emergency conditions. Everyone must stay indoors with air filtration.";
}

export function getFreshnessBadgeClass(freshness) {
  const map = {
    Live:   "badge-live",
    Recent: "badge-recent",
    Aging:  "badge-aging",
    Stale:  "badge-stale",
  };
  return map[freshness] ?? "badge-stale";
}

export function formatAQI(val) {
  if (val === null || val === undefined) return "—";
  return Math.round(val).toString();
}

const CITY_REGION_MAP = {
  Delhi: "Asia", Mumbai: "Asia", Kolkata: "Asia", Beijing: "Asia",
  Shanghai: "Asia", Tokyo: "Asia", Seoul: "Asia", Bangkok: "Asia",
  Jakarta: "Asia", Dhaka: "Asia", Karachi: "Asia", Hanoi: "Asia",
  Singapore: "Asia", "Hong Kong": "Asia",
  London: "Europe", Paris: "Europe", Berlin: "Europe", Madrid: "Europe",
  Rome: "Europe", Moscow: "Europe", Istanbul: "Europe", Warsaw: "Europe",
  Amsterdam: "Europe",
  "New York": "Americas", "Los Angeles": "Americas", "Mexico City": "Americas",
  "São Paulo": "Americas", "Buenos Aires": "Americas", Lima: "Americas",
  Bogota: "Americas", Toronto: "Americas", Chicago: "Americas",
  Lagos: "Africa", Cairo: "Africa", Nairobi: "Africa",
  Johannesburg: "Africa", Accra: "Africa", Addis: "Africa",
  Sydney: "Oceania", Melbourne: "Oceania", Auckland: "Oceania",
};

export function getCityRegion(city) {
  return CITY_REGION_MAP[city] ?? "Other";
}

export function getBreathingSpeed(aqi) {
  if (aqi === null || aqi === undefined) return "6s";
  if (aqi <= 50)  return "6s";
  if (aqi <= 100) return "5s";
  if (aqi <= 150) return "4s";
  if (aqi <= 200) return "3s";
  if (aqi <= 300) return "2.5s";
  return "2s";
}

export function getBreathingTint(aqi) {
  if (aqi === null || aqi === undefined) return "rgba(100,116,139,0.05)";
  if (aqi <= 50)  return "rgba(34,197,94,0.06)";
  if (aqi <= 100) return "rgba(234,179,8,0.06)";
  if (aqi <= 150) return "rgba(249,115,22,0.08)";
  if (aqi <= 200) return "rgba(239,68,68,0.10)";
  if (aqi <= 300) return "rgba(168,85,247,0.12)";
  return "rgba(127,29,29,0.15)";
}

export const AQI_BANDS = [
  { label: "Good",                range: "0–50",   color: "#22c55e" },
  { label: "Moderate",            range: "51–100",  color: "#eab308" },
  { label: "Unhealthy (Sensitive)", range: "101–150", color: "#f97316" },
  { label: "Unhealthy",           range: "151–200", color: "#ef4444" },
  { label: "Very Unhealthy",      range: "201–300", color: "#a855f7" },
  { label: "Hazardous",           range: "301+",    color: "#7f1d1d" },
];
