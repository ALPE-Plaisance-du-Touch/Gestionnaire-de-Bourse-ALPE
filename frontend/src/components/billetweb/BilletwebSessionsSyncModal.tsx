import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billetwebApiSettings } from '@/api/billetweb-api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface BilletwebSessionsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  editionId: string;
}

export function BilletwebSessionsSyncModal({
  isOpen,
  onClose,
  editionId,
}: BilletwebSessionsSyncModalProps) {
  const queryClient = useQueryClient();

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ['billetweb-sessions-preview', editionId],
    queryFn: () => billetwebApiSettings.previewSessionsSync(editionId),
    enabled: isOpen,
  });

  const syncMutation = useMutation({
    mutationFn: () => billetwebApiSettings.syncSessions(editionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', editionId] });
      queryClient.invalidateQueries({ queryKey: ['billetweb-sessions-preview', editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition', editionId] });
    },
  });

  const sessions = preview?.sessions ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Synchroniser les créneaux Billetweb" size="lg">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-bark-muted">Chargement des créneaux...</p>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="p-4 bg-error/10 border border-error/30 text-error rounded-lg">
            Erreur lors du chargement des créneaux Billetweb.
            {error instanceof Error && error.message && (
              <p className="text-sm mt-1">{error.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      ) : syncMutation.isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 bg-primary/10 border border-primary/30 text-primary-dark rounded-lg">
            <p className="font-medium">Synchronisation terminée</p>
            <p className="text-sm mt-1">
              {syncMutation.data.created} créé(s), {syncMutation.data.updated} mis à jour.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="mb-4 p-3 bg-cream rounded-lg text-sm">
            <span className="font-medium">{preview?.totalSessions ?? 0}</span> créneaux trouvés
            {preview && preview.newSessions > 0 && (
              <span className="ml-2 text-primary">
                ({preview.newSessions} nouveau{preview.newSessions > 1 ? 'x' : ''})
              </span>
            )}
          </div>

          {/* Sessions list */}
          {sessions.length === 0 ? (
            <p className="text-center text-bark-muted py-4">Aucun créneau trouvé.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`p-3 border rounded-lg ${
                    session.alreadySynced ? 'bg-cream border-sand' : 'bg-white border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-bark">
                        {session.name || 'Créneau'}
                      </span>
                      {session.alreadySynced && (
                        <span className="ml-2 text-xs bg-sand text-bark-light px-2 py-0.5 rounded-full">
                          Déjà synchronisé
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-bark-muted">
                      {session.capacity} places
                    </span>
                  </div>
                  <div className="text-sm text-bark-muted mt-1">
                    {session.start} &mdash; {session.end}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sync error */}
          {syncMutation.isError && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 text-error rounded-lg text-sm">
              Erreur lors de la synchronisation.
              {syncMutation.error instanceof Error && syncMutation.error.message && (
                <span className="block mt-1">{syncMutation.error.message}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={() => syncMutation.mutate()}
              isLoading={syncMutation.isPending}
              disabled={sessions.length === 0}
            >
              Synchroniser
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
