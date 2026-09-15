import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAQIData } from "../hooks/useAQIData";
import { getAQIColor, getAQILabel, formatAQI } from "../utils/aqiHelpers";
import FreshnessBadge from "../components/FreshnessBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function Rankings() {
  const { rankings, loading, error, refetch } = useAQIData();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner />;
  if (error)   return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-6 space-y-4"
    >
      <h1 className="font-bold text-xl">🏆 City Rankings</h1>
      <p className="text-sm text-light-muted dark:text-dark-muted">
        {rankings?.total} cities ranked by AQI · Global average:{" "}
        {rankings?.average_aqi}
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-light-border dark:border-dark-border text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-10">#</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-right">AQI</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">PM2.5</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Status</th>
              <th className="px-4 py-3 text-right">Freshness</th>
            </tr>
          </thead>
          <tbody>
            {rankings?.rankings?.map((city, i) => (
              <motion.tr
                key={city.city}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/city/${city.city}`)}
                className="border-b border-light-border/50 dark:border-dark-border/50 hover:bg-light-border/30 dark:hover:bg-dark-border/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3 font-mono text-light-muted dark:text-dark-muted">
                  {city.rank}
                </td>
                <td className="px-4 py-3 font-medium">{city.city}</td>
                <td
                  className="px-4 py-3 text-right font-mono font-bold"
                  style={{ color: getAQIColor(city.aqi) }}
                >
                  {formatAQI(city.aqi)}
                </td>
                <td className="px-4 py-3 text-right font-mono hidden sm:table-cell text-light-muted dark:text-dark-muted">
                  {city.pm25 != null ? city.pm25 : "—"}
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell text-xs text-light-muted dark:text-dark-muted">
                  {getAQILabel(city.aqi)}
                </td>
                <td className="px-4 py-3 text-right">
                  <FreshnessBadge freshness={city.freshness} />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
