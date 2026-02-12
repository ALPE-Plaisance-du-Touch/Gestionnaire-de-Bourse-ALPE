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
  const [sendEmails, setSendEmails] = useState(true);

  const { data: preview, isLoading, error } = useQuery({
    queryKey: ['billetweb-attendees-preview', editionId],
    queryFn: () => billetwebApiSettings.previewAttendeesSync(editionId),
    enabled: isOpen,
  });

  const syncMutation = useMutation({
    mutationFn: () => billetwebApiSettings.syncAttendees(editionId, sendEmails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billetweb-stats', editionId] });
      queryClient.invalidateQueries({ queryKey: ['billetweb-attendees-preview', editionId] });
      queryClient.invalidateQueries({ queryKey: ['edition', editionId] });
    },
  });

  const stats = preview?.stats;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Synchroniser les inscriptions Billetweb" size="lg">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des inscriptions...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          Erreur lors du chargement des inscriptions Billetweb.
        </div>
      ) : syncMutation.isSuccess ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            <p className="font-medium">Synchronisation terminee</p>
            <p className="text-sm mt-1">
              {syncMutation.data.newCreated} nouvelle(s) invitation(s),{' '}
              {syncMutation.data.existingLinked} existant(s) associe(s),{' '}
              {syncMutation.data.alreadyRegistered} deja inscrit(s).
            </p>
            {syncMutation.data.invitationsSent > 0 && (
              <p className="text-sm mt-1">
                {syncMutation.data.invitationsSent} email(s) d'invitation envoye(s).
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Fermer</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Last sync info */}
          {lastSync && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              Derniere synchronisation : {new Date(lastSync).toLocaleString('fr-FR')}
              <br />
              <span className="text-xs text-blue-600">
                Seules les inscriptions modifiees depuis seront recuperees.
              </span>
            </div>
          )}

          {/* Stats summary */}
          {stats && (
            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalRows}</p>
                  <p className="text-xs text-gray-500">Inscriptions trouvees</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-center">
                  <p className="text-2xl font-semibold text-gray-900">{stats.rowsToProcess}</p>
                  <p className="text-xs text-gray-500">A traiter</p>
                </div>
              </div>

              {stats.rowsToProcess > 0 && (
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-green-50 rounded text-center">
                    <p className="font-medium text-green-800">{stats.newDepositors}</p>
                    <p className="text-xs text-green-600">Nouveaux</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded text-center">
                    <p className="font-medium text-blue-800">{stats.existingDepositors}</p>
                    <p className="text-xs text-blue-600">Existants</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded text-center">
                    <p className="font-medium text-gray-800">{stats.alreadyRegistered}</p>
                    <p className="text-xs text-gray-500">Deja inscrits</p>
                  </div>
                </div>
              )}

              {stats.rowsUnpaidInvalid > 0 && (
                <p className="text-xs text-gray-500">
                  {stats.rowsUnpaidInvalid} inscription(s) non payee(s)/invalide(s) ignoree(s).
                </p>
              )}
              {stats.duplicatesInFile > 0 && (
                <p className="text-xs text-gray-500">
                  {stats.duplicatesInFile} doublon(s) ignore(s).
                </p>
              )}
            </div>
          )}

          {/* Warnings */}
          {preview?.warnings && preview.warnings.length > 0 && (
            <div className="mb-4 space-y-1">
              {preview.warnings.map((w, i) => (
                <div key={i} className="p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded text-sm">
                  {w}
                </div>
              ))}
            </div>
          )}

          {/* Email option */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendEmails}
                onChange={(e) => setSendEmails(e.target.checked)}
                className="rounded border-gray-300"
              />
              Envoyer les emails d'invitation aux nouveaux deposants
            </label>
          </div>

          {/* No data */}
          {stats && stats.rowsToProcess === 0 && (
            <div className="p-4 bg-gray-50 text-gray-500 text-center rounded-lg">
              Aucune nouvelle inscription a importer.
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
              disabled={!stats || stats.rowsToProcess === 0}
            >
              Importer {stats ? stats.rowsToProcess : 0} inscription(s)
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
