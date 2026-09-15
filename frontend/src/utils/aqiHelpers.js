export function getAQIColor(aqi) {
  if (aqi === null || aqi === undefined) return "#64748b";
  if (aqi <= 50)  return "#22c55e";
  if (aqi <= 100) return "#eab308";
  if (aqi <= 150) return "#f97316";
  if (aqi <= 200) return "#ef4444";
  return "#9333ea";
}

export function getAQILabel(aqi) {
  if (aqi === null || aqi === undefined) return "Unknown";
  if (aqi <= 50)  return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  return "Very Unhealthy";
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
  return "Health alert. Everyone should avoid outdoor exposure. Wear N95 masks.";
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
