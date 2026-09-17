import { motion } from "framer-motion";
import { formatAQI, getAQIColor, getAQILabel } from "../utils/aqiHelpers";

export default function HazardousBanner({ cities }) {
  if (!cities || cities.length === 0) return null;

  // Filter cities with AQI > 150 or is_high_pollution true
  const hazardousCities = cities.filter(
    c => (c.aqi != null && c.aqi > 150) || c.is_high_pollution
  );

  if (hazardousCities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 flex items-start gap-3 shadow-lg"
    >
      <span className="text-xl leading-none">🚨</span>
      <div className="flex-1 text-xs sm:text-sm">
        <div className="flex items-center justify-between font-semibold text-red-400 mb-1">
          <span>HIGH POLLUTION ALERT</span>
          <span className="text-[10px] uppercase tracking-wider bg-red-500/20 px-2 py-0.5 rounded border border-red-500/30 font-mono">
            {hazardousCities.length} {hazardousCities.length === 1 ? "City" : "Cities"} Impacted
          </span>
        </div>
        <p className="text-light-muted dark:text-dark-muted mb-2 text-xs">
          Unhealthy / Hazardous air quality detected (AQI &gt; 150). Sensitive individuals should remain indoors.
        </p>
        <div className="flex flex-wrap gap-2">
          {hazardousCities.map(city => {
            const color = getAQIColor(city.aqi);
            return (
              <div
                key={city.city}
                className="flex items-center gap-1.5 bg-dark-bg/80 border border-dark-border px-2.5 py-1 rounded-md text-xs"
              >
                <span className="font-medium text-white">{city.city}</span>
                <span
                  className="font-bold font-mono px-1.5 py-0.2 rounded text-[11px]"
                  style={{ backgroundColor: `${color}25`, color }}
                >
                  AQI {formatAQI(city.aqi)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
