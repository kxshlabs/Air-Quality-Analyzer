export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <span className="text-4xl">⚠️</span>
      <p className="text-light-muted dark:text-dark-muted text-sm">
        {message}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn-accent">
          Retry
        </button>
      )}
    </div>
  );
}
