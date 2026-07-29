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
        <div className="rounded-xl bg-accent/15 border border-accent/40 text-accent-dark px-4 py-3 text-sm font-medium">
          Mode offline - {pendingCount} vente{pendingCount !== 1 ? 's' : ''} en attente de synchronisation
        </div>
      )}

      {isOnline && lastSyncCount !== undefined && lastSyncCount > 0 && (
        <div className="rounded-xl bg-primary/10 border border-primary/30 text-primary-dark px-4 py-3 text-sm font-medium">
          {lastSyncCount} vente{lastSyncCount !== 1 ? 's' : ''} synchronisée{lastSyncCount !== 1 ? 's' : ''}
        </div>
      )}

      {conflicts && conflicts.length > 0 && (
        <div className="rounded-xl bg-error/10 border border-error/30 text-error px-4 py-3 text-sm">
          <p className="font-medium">
            {conflicts.length} conflit{conflicts.length !== 1 ? 's' : ''} détecté{conflicts.length !== 1 ? 's' : ''}
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
