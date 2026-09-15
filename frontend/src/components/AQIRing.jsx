import { getAQIColor, formatAQI } from "../utils/aqiHelpers";

export default function AQIRing({ aqi, size = 80 }) {
  const color = getAQIColor(aqi);
  const r = (size / 2) - 6;
  const circumference = 2 * Math.PI * r;
  const pct = aqi ? Math.min(aqi / 300, 1) : 0;
  const dash = pct * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-light-border dark:text-dark-border"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute font-bold font-mono text-sm"
        style={{ color }}
      >
        {formatAQI(aqi)}
      </span>
    </div>
  );
}
