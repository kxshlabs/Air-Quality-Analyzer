import { getAQIColor, formatAQI } from "../utils/aqiHelpers";

export default function AQIRing({ aqi, size = 80 }) {
  const color = getAQIColor(aqi);
  const strokeWidth = size >= 110 ? 8 : size >= 80 ? 6 : 4;
  const r = size / 2 - strokeWidth - 2;
  const circumference = 2 * Math.PI * r;
  const pct = aqi ? Math.min(aqi / 350, 1) : 0;
  const dash = pct * circumference;

  const fontSizeClass =
    size >= 120
      ? "text-3xl font-extrabold"
      : size >= 90
      ? "text-xl font-bold"
      : "text-sm font-bold";

  return (
    <div
      className="relative flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-black/10 dark:text-white/10"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className={`font-mono ${fontSizeClass} tracking-tight leading-none`}
          style={{ color }}
        >
          {formatAQI(aqi)}
        </span>
        {size >= 110 && (
          <span className="text-[10px] font-mono tracking-widest uppercase text-light-muted dark:text-dark-muted mt-1">
            AQI
          </span>
        )}
      </div>
    </div>
  );
}
