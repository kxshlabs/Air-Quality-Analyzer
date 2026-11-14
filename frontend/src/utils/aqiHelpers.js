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

export function getBreathingDuration(aqi) {
  if (aqi == null || aqi <= 50) return "7s";
  if (aqi <= 100) return "5s";
  if (aqi <= 150) return "3.5s";
  if (aqi <= 200) return "2.5s";
  if (aqi <= 300) return "1.5s";
  return "1s";
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

export const RISK_LEVELS = [
  { level: 0, label: "Safe", color: "#22c55e", advice: "Air quality is good. Safe for all outdoor activities." },
  { level: 1, label: "Low Risk", color: "#22c55e", advice: "Low health risk. Safe for most individuals to engage in outdoor activities." },
  { level: 2, label: "Moderate Risk", color: "#eab308", advice: "Moderate risk. Sensitive individuals should consider taking breaks during prolonged exertion." },
  { level: 3, label: "High Risk", color: "#f97316", advice: "Increased health risk. Reduce prolonged or heavy outdoor exertion." },
  { level: 4, label: "Very High Risk", color: "#ef4444", advice: "Significant health risk. Limit outdoor exposure and consider wearing an N95 mask." },
  { level: 5, label: "Dangerous", color: "#7f1d1d", advice: "Critical health hazard. Avoid all outdoor activity and stay indoors in filtered air." },
];

export function getRiskLevel(aqi, { ageGroup = "Adult", outdoorHours = "1h", respiratory = false } = {}) {
  let base = 0;
  if (aqi == null) {
    base = 0;
  } else if (aqi <= 50) {
    base = 0;
  } else if (aqi <= 100) {
    base = 1;
  } else if (aqi <= 150) {
    base = 2;
  } else if (aqi <= 200) {
    base = 3;
  } else if (aqi <= 300) {
    base = 4;
  } else {
    base = 5;
  }

  const isChildOrSenior =
    ageGroup === "child" ||
    ageGroup === "senior" ||
    ageGroup === "Child (< 12)" ||
    ageGroup === "Senior (65+)" ||
    ageGroup === "Child" ||
    ageGroup === "Senior";

  if (isChildOrSenior) {
    base += 1;
  }

  if (respiratory === true || respiratory === "Yes" || respiratory === "yes") {
    base += 1;
  }

  const hoursNum = typeof outdoorHours === "number" ? outdoorHours : parseInt(outdoorHours, 10);
  if (hoursNum >= 4 || outdoorHours === "4h" || outdoorHours === "8h+" || outdoorHours === "8h") {
    base += 1;
  }

  const index = Math.min(5, Math.max(0, base));
  return RISK_LEVELS[index];
}
