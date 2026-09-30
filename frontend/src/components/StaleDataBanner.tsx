function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "moments ago";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function StaleDataBanner({ cachedAt }: { cachedAt: string }) {
  return (
    <p
      role="status"
      className="w-full max-w-sm rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-300"
    >
      Showing the last saved forecast from {formatRelativeTime(cachedAt)} — you appear to be offline.
    </p>
  );
}
