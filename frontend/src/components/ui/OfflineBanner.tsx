interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  lastSyncCount?: number;
  conflicts?: string[];
}

export function OfflineBanner({ isOnline, pendingCount, lastSyncCount, conflicts }: OfflineBannerProps) {
  if (isOnline && !lastSyncCount && (!conflicts || conflicts.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2">
      {!isOnline && (
        <div className="rounded-lg bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 text-sm font-medium">
          Mode offline - {pendingCount} vente{pendingCount !== 1 ? 's' : ''} en attente de synchronisation
        </div>
      )}

      {isOnline && lastSyncCount !== undefined && lastSyncCount > 0 && (
        <div className="rounded-lg bg-green-100 border border-green-300 text-green-800 px-4 py-3 text-sm font-medium">
          {lastSyncCount} vente{lastSyncCount !== 1 ? 's' : ''} synchronisee{lastSyncCount !== 1 ? 's' : ''}
        </div>
      )}

      {conflicts && conflicts.length > 0 && (
        <div className="rounded-lg bg-red-100 border border-red-300 text-red-800 px-4 py-3 text-sm">
          <p className="font-medium">
            {conflicts.length} conflit{conflicts.length !== 1 ? 's' : ''} detecte{conflicts.length !== 1 ? 's' : ''}
          </p>
          <ul className="mt-1 list-disc list-inside">
            {conflicts.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
