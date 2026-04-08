import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billetwebApiSettings } from '@/api/billetweb-api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface BilletwebAttendeesSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  editionId: string;
  lastSync: string | null;
}

export function BilletwebAttendeesSyncModal({
  isOpen,
  onClose,
  editionId,
  lastSync,
}: BilletwebAttendeesSyncModalProps) {
  const queryClient = useQueryClient();
  const [forceFull, setForceFull] = useState(false);

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ['billetweb-attendees-preview', editionId, forceFull],
    queryFn: () => billetwebApiSettings.previewAttendeesSync(editionId, forceFull),
    enabled: isOpen,
  });

  const syncMutation = useMutation({
    mutationFn: () => billetwebApiSettings.syncAttendees(editionId, false, forceFull),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billetweb-stats', editionId] });
      queryClient.invalidateQueries({ queryKey: ['billetweb-attendees-preview', editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition', editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition-depositors', editionId] });
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', editionId] });
    },
  });

  const stats = preview?.stats;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Synchroniser les inscriptions Billetweb" size="lg">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-bark-muted">Chargement des inscriptions...</p>
        </div>
      ) : error ? (
        <div className="space-y-4">
          <div className="p-4 bg-error/10 border border-error/30 text-error rounded-lg">
            Erreur lors du chargement des inscriptions Billetweb.
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
              {syncMutation.data.newCreated} nouvelle(s) invitation(s),{' '}
              {syncMutation.data.existingLinked} existant(s) associé(s),{' '}
              {syncMutation.data.alreadyRegistered} déjà inscrit(s).
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Last sync info */}
          {lastSync && !forceFull && (
            <div className="mb-4 p-3 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary-dark">
              Dernière synchronisation : {new Date(lastSync).toLocaleString('fr-FR')}
              <br />
              <span className="text-xs text-primary">
                Seules les inscriptions modifiées depuis seront récupérées.
              </span>
            </div>
          )}

          {/* Force full sync info */}
          {forceFull && (
            <div className="mb-4 p-3 bg-accent/10 border border-accent/40 rounded-lg text-sm text-accent-dark">
              Synchronisation complète activée : toutes les inscriptions Billetweb seront récupérées.
            </div>
          )}

          {/* Stats summary */}
          {stats && (
            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-cream rounded-lg text-center">
                  <p className="text-2xl font-semibold text-bark">{stats.totalRows}</p>
                  <p className="text-xs text-bark-muted">Inscriptions trouvées</p>
                </div>
                <div className="p-3 bg-cream rounded-lg text-center">
                  <p className="text-2xl font-semibold text-bark">{stats.rowsToProcess}</p>
                  <p className="text-xs text-bark-muted">À traiter</p>
                </div>
              </div>

              {stats.rowsToProcess > 0 && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-primary/10 rounded text-center">
                    <p className="font-medium text-primary-dark">{stats.newDepositors}</p>
                    <p className="text-xs text-primary">Nouveaux</p>
                  </div>
                  <div className="p-2 bg-primary/10 rounded text-center">
                    <p className="font-medium text-primary-dark">{stats.existingDepositors}</p>
                    <p className="text-xs text-primary">Existants</p>
                  </div>
                  <div className="p-2 bg-cream rounded text-center">
                    <p className="font-medium text-bark">{stats.alreadyRegistered}</p>
                    <p className="text-xs text-bark-muted">Déjà inscrits</p>
                  </div>
                </div>
              )}

              {stats.rowsUnpaidInvalid > 0 && (
                <p className="text-xs text-bark-muted">
                  {stats.rowsUnpaidInvalid} inscription(s) non payée(s)/invalide(s) ignorée(s).
                </p>
              )}
              {stats.duplicatesInFile > 0 && (
                <p className="text-xs text-bark-muted">
                  {stats.duplicatesInFile} doublon(s) ignoré(s).
                </p>
              )}
            </div>
          )}

          {/* Warnings */}
          {preview?.warnings && preview.warnings.length > 0 && (
            <div className="mb-4 space-y-1">
              {preview.warnings.map((w, i) => (
                <div key={i} className="p-2 bg-accent/10 border border-accent/40 text-accent-dark rounded text-sm">
                  {w}
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

          {/* No data + force full sync link */}
          {stats && stats.rowsToProcess === 0 && (
            <div className="p-4 bg-cream text-bark-muted text-center rounded-lg">
              <p>Aucune nouvelle inscription à importer.</p>
              {lastSync && !forceFull && (
                <button
                  type="button"
                  className="mt-2 text-sm text-primary hover:text-primary-dark underline"
                  onClick={() => setForceFull(true)}
                >
                  Relancer une synchronisation complète
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {lastSync && stats && stats.rowsToProcess > 0 && !forceFull && (
                <button
                  type="button"
                  className="text-xs text-bark-muted hover:text-bark underline"
                  onClick={() => setForceFull(true)}
                >
                  Sync complète
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={() => syncMutation.mutate()}
                isLoading={syncMutation.isPending}
                disabled={!stats || stats.rowsToProcess === 0}
              >
                Importer {stats ? stats.rowsToProcess : 0} inscription(s)
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
