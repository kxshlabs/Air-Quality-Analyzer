import { getFreshnessBadgeClass } from "../utils/aqiHelpers";

export default function FreshnessBadge({ freshness }) {
  return (
    <span className={getFreshnessBadgeClass(freshness)}>
      {freshness ?? "Unknown"}
    </span>
  );
}
