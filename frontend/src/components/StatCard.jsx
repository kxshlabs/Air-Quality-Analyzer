export default function StatCard({ label, value, sub }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs text-light-muted dark:text-dark-muted uppercase tracking-wider">
        {label}
      </span>
      <span className="text-2xl font-bold font-mono">{value}</span>
      {sub && (
        <span className="text-xs text-light-muted dark:text-dark-muted">
          {sub}
        </span>
      )}
    </div>
  );
}
