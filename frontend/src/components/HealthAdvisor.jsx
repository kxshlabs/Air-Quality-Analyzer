import { getAQIColor } from "../utils/aqiHelpers";

export default function HealthAdvisor({ aqi }) {
  if (aqi == null) return null;

  const getAdvice = (score) => {
    if (score <= 50) {
      return {
        exercise: { status: "Safe", icon: "🏃‍♂️", color: "#22c55e", text: "Great conditions for outdoor workouts and sports." },
        sensitive: { status: "Safe", icon: "👶", color: "#22c55e", text: "Air quality is ideal for children, elderly, and asthmatics." },
        windows: { status: "Open", icon: "🪟", color: "#22c55e", text: "Enjoy fresh air! Great time to ventilate your home." },
        mask: { status: "Not Needed", icon: "😷", color: "#22c55e", text: "No protective mask needed outdoors." },
      };
    }
    if (score <= 100) {
      return {
        exercise: { status: "Moderate", icon: "🏃‍♂️", color: "#eab308", text: "Outdoor exercise is fine, but take breaks if unusually sensitive." },
        sensitive: { status: "Caution", icon: "👶", color: "#eab308", text: "Sensitive individuals should monitor for throat irritation." },
        windows: { status: "Open", icon: "🪟", color: "#22c55e", text: "Safe to open windows for ventilation." },
        mask: { status: "Optional", icon: "😷", color: "#eab308", text: "Masks optional, unless sensitive to dust/pollutants." },
      };
    }
    if (score <= 150) {
      return {
        exercise: { status: "Reduce Heavy Effort", icon: "🏃‍♂️", color: "#f97316", text: "Cut back on strenuous outdoor workouts." },
        sensitive: { status: "Limit Exposure", icon: "👶", color: "#f97316", text: "Children & asthmatics should avoid prolonged outdoor play." },
        windows: { status: "Close Windows", icon: "🪟", color: "#f97316", text: "Keep windows closed to avoid indoor pollution buildup." },
        mask: { status: "Recommended", icon: "😷", color: "#f97316", text: "Wear N95/KN95 masks if outdoors for extended periods." },
      };
    }
    if (score <= 200) {
      return {
        exercise: { status: "Avoid Outdoor Workouts", icon: "🏃‍♂️", color: "#ef4444", text: "Move exercise indoors. High respiratory strain risk." },
        sensitive: { status: "Stay Indoors", icon: "👶", color: "#ef4444", text: "Children and elderly must remain indoors in filtered rooms." },
        windows: { status: "Keep Closed", icon: "🪟", color: "#ef4444", text: "Close all windows and run air purifiers." },
        mask: { status: "Mandatory Outdoors", icon: "😷", color: "#ef4444", text: "Wear N95 mask outside at all times." },
      };
    }
    return {
      exercise: { status: "Hazardous — Stop Workouts", icon: "🏃‍♂️", color: "#9333ea", text: "Emergency conditions. Avoid all outdoor activity." },
      sensitive: { status: "Emergency Precautions", icon: "👶", color: "#9333ea", text: "High risk of acute symptoms. Stay in clean air space." },
      windows: { status: "Sealed & Filtered", icon: "🪟", color: "#9333ea", text: "Seal doors/windows and keep air purifier on high speed." },
      mask: { status: "N95/FFP2 Required", icon: "😷", color: "#9333ea", text: "Do not go outside without high-filtration mask." },
    };
  };

  const advice = getAdvice(aqi);
  const mainColor = getAQIColor(aqi);

  return (
    <div className="card p-5 space-y-4 border-l-4" style={{ borderColor: mainColor }}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          🩺 Health & Activity Advisor
        </h2>
        <span className="text-xs font-mono text-light-muted dark:text-dark-muted">
          AQI {aqi} Guidance
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(advice).map(([key, item]) => (
          <div
            key={key}
            className="p-3 rounded-lg bg-light-border/40 dark:bg-dark-border/40 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5 text-light-text dark:text-dark-text">
                <span>{item.icon}</span>
                <span className="capitalize">{key === "exercise" ? "Outdoor Workouts" : key === "sensitive" ? "Sensitive Groups" : key === "windows" ? "Ventilation" : "Mask Advice"}</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: `${item.color}25`, color: item.color }}>
                {item.status}
              </span>
            </div>
            <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
