import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi } from '@/api';
import { Button, ConfirmModal, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import type { Edition, EditionStatus } from '@/types';

type FilterOption = 'all' | EditionStatus;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'configured', label: 'Configuré' },
  { value: 'registrations_open', label: 'Inscriptions ouvertes' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'closed', label: 'Clôturé' },
  { value: 'archived', label: 'Archivé' },
];

const STATUS_LABELS: Record<EditionStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
  configured: { label: 'Configuré', className: 'bg-blue-100 text-blue-800' },
  registrations_open: { label: 'Inscriptions ouvertes', className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'En cours', className: 'bg-green-100 text-green-800' },
  closed: { label: 'Clôturé', className: 'bg-orange-100 text-orange-800' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-500' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface EditionsListPageProps {
  onCreateClick?: () => void;
  onEditClick?: (edition: Edition) => void;
}

export function EditionsListPage({ onCreateClick, onEditClick }: EditionsListPageProps) {
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [editionToDelete, setEditionToDelete] = useState<Edition | null>(null);
  const [editionToArchive, setEditionToArchive] = useState<Edition | null>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isAdmin = user?.role === 'administrator';

  // Fetch editions
  const {
    data: editionsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['editions', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () =>
      editionsApi.getEditions(
        statusFilter === 'all'
          ? undefined
          : {
              status: statusFilter,
              includeArchived: statusFilter === 'archived',
            }
      ),
  });

  const editions = editionsResponse?.items ?? [];

  // Delete edition mutation
  const deleteMutation = useMutation({
    mutationFn: editionsApi.deleteEdition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      setEditionToDelete(null);
    },
    onError: () => {
      setEditionToDelete(null);
    },
  });

  const handleDeleteClick = (edition: Edition) => {
    setEditionToDelete(edition);
  };

  const handleDeleteConfirm = async () => {
    if (editionToDelete) {
      try {
        await deleteMutation.mutateAsync(editionToDelete.id);
      } catch {
        // Error handled by mutation
      }
    }
  };

  const handleDeleteCancel = () => {
    setEditionToDelete(null);
  };

  // Archive edition mutation
  const archiveMutation = useMutation({
    mutationFn: editionsApi.archiveEdition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      setEditionToArchive(null);
    },
    onError: () => {
      setEditionToArchive(null);
    },
  });

  const handleArchiveConfirm = async () => {
    if (editionToArchive) {
      try {
        await archiveMutation.mutateAsync(editionToArchive.id);
      } catch {
        // Error handled by mutation
      }
    }
  };

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (deleteMutation.isSuccess) {
      const timer = setTimeout(() => deleteMutation.reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteMutation.isSuccess]);

  useEffect(() => {
    if (archiveMutation.isSuccess) {
      const timer = setTimeout(() => archiveMutation.reset(), 5000);
      return () => clearTimeout(timer);
    }
  }, [archiveMutation.isSuccess]);

  const isStaleForArchiving = (edition: Edition): boolean => {
    if (edition.status !== 'closed' || !edition.closedAt) return false;
    const closedDate = new Date(edition.closedAt);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return closedDate < oneYearAgo;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement des éditions. Veuillez réessayer.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des éditions</h1>
        <p className="mt-1 text-gray-600">
          Gérez les éditions de la bourse aux vêtements.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{editionsResponse?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Brouillons</p>
          <p className="text-2xl font-bold text-gray-600">
            {editions.filter((e) => e.status === 'draft').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">En cours</p>
          <p className="text-2xl font-bold text-green-600">
            {editions.filter((e) => e.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Clôturées</p>
          <p className="text-2xl font-bold text-orange-600">
            {editions.filter((e) => e.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-48">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FilterOption)}
            aria-label="Filtrer par statut"
          />
        </div>
        {isAdmin && (
          <Button onClick={onCreateClick}>Nouvelle édition</Button>
        )}
      </div>

      {/* Success/Error messages */}
      {deleteMutation.isSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Édition supprimée avec succès !
        </div>
      )}
      {deleteMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de la suppression de l'édition. Veuillez réessayer.
        </div>
      )}
      {archiveMutation.isSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Edition archivee avec succes !
        </div>
      )}
      {archiveMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de l'archivage. Verifiez que l'edition est bien cloturee.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : editions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune édition trouvée.
            {statusFilter !== 'all' && (
              <button
                className="block mx-auto mt-2 text-blue-600 hover:underline"
                onClick={() => setStatusFilter('all')}
              >
                Voir toutes les éditions
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lieu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée par
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editions.map((edition) => {
                  const statusInfo = STATUS_LABELS[edition.status];
                  const canDelete = isAdmin && edition.status === 'draft';

                  return (
                    <tr key={edition.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {edition.name}
                        </div>
                        {edition.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {edition.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(edition.startDatetime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          au {formatDate(edition.endDatetime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {edition.location || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                        {isStaleForArchiving(edition) && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                            A archiver
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {edition.createdBy
                          ? `${edition.createdBy.firstName} ${edition.createdBy.lastName}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditClick?.(edition)}
                        >
                          Modifier
                        </Button>
                        {isAdmin && edition.status === 'closed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditionToArchive(edition)}
                            disabled={archiveMutation.isPending}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            Archiver
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(edition)}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Supprimer
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer info */}
      {editions.length > 0 && (
        <p className="mt-4 text-sm text-gray-500 text-right">
          {editions.length} édition{editions.length > 1 ? 's' : ''} affichée
          {editions.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!editionToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        variant="danger"
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer l'édition{' '}
          <span className="font-medium">{editionToDelete?.name}</span> ?
        </p>
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
          Cette action est irréversible. L'édition sera définitivement supprimée.
        </p>
      </ConfirmModal>

      {/* Archive confirmation modal */}
      <ConfirmModal
        isOpen={!!editionToArchive}
        onClose={() => setEditionToArchive(null)}
        onConfirm={handleArchiveConfirm}
        title="Archiver l'édition"
        variant="warning"
        confirmLabel="Archiver"
        isLoading={archiveMutation.isPending}
      >
        <p className="text-gray-600">
          Archiver l'édition{' '}
          <span className="font-medium">{editionToArchive?.name}</span> ?
        </p>
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
          Une édition archivée n'apparaît plus dans la liste par défaut. Elle reste consultable via le filtre « Archivé ».
        </p>
      </ConfirmModal>
    </div>
  );
}
