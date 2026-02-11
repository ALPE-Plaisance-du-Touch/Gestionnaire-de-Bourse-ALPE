import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/api';
import { Button, ConfirmModal, Select } from '@/components/ui';
import type { Invitation, InvitationStatusFilter, BulkDeleteResult, BulkResendResult } from '@/types';

type FilterOption = 'all' | InvitationStatusFilter;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'activated', label: 'Activées' },
  { value: 'expired', label: 'Expirées' },
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
  sent: { label: 'Envoyé', className: 'bg-blue-100 text-blue-800' },
  activated: { label: 'Activé', className: 'bg-green-100 text-green-800' },
  expired: { label: 'Expiré', className: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Annulé', className: 'bg-gray-100 text-gray-800' },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

interface InvitationsPageProps {
  onCreateClick?: () => void;
  onBulkCreateClick?: () => void;
}

export function InvitationsPage({ onCreateClick, onBulkCreateClick }: InvitationsPageProps) {
  const [statusFilter, setStatusFilter] = useState<FilterOption>('all');
  const [invitationToDelete, setInvitationToDelete] = useState<Invitation | null>(null);
  const [invitationToResend, setInvitationToResend] = useState<Invitation | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showBulkResendModal, setShowBulkResendModal] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<BulkDeleteResult | null>(null);
  const [bulkResendResult, setBulkResendResult] = useState<BulkResendResult | null>(null);
  const queryClient = useQueryClient();

  // Fetch invitations
  const {
    data: invitations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invitations', statusFilter === 'all' ? undefined : statusFilter],
    queryFn: () =>
      invitationsApi.getInvitations(
        statusFilter === 'all' ? undefined : statusFilter
      ),
  });

  // Resend invitation mutation
  const resendMutation = useMutation({
    mutationFn: invitationsApi.resendInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });

  // Delete invitation mutation
  const deleteMutation = useMutation({
    mutationFn: invitationsApi.deleteInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setInvitationToDelete(null);
    },
    onError: () => {
      setInvitationToDelete(null);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: invitationsApi.bulkDeleteInvitations,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setBulkDeleteResult(result);
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
    },
    onError: () => {
      setShowBulkDeleteModal(false);
    },
  });

  // Bulk resend mutation
  const bulkResendMutation = useMutation({
    mutationFn: invitationsApi.bulkResendInvitations,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      setBulkResendResult(result);
      setSelectedIds(new Set());
      setShowBulkResendModal(false);
    },
    onError: () => {
      setShowBulkResendModal(false);
    },
  });

  // Compute statistics
  const stats = useMemo(() => {
    const total = invitations.length;
    const pending = invitations.filter((i) => i.status === 'pending' || i.status === 'sent').length;
    const activated = invitations.filter((i) => i.status === 'activated').length;
    const expired = invitations.filter((i) => i.status === 'expired').length;
    return { total, pending, activated, expired };
  }, [invitations]);

  const handleResendConfirm = async () => {
    if (invitationToResend) {
      try {
        await resendMutation.mutateAsync(invitationToResend.id);
      } catch {
        // Error handled by mutation
      }
      setInvitationToResend(null);
    }
  };

  const handleDeleteClick = (invitation: Invitation) => {
    setInvitationToDelete(invitation);
  };

  const handleDeleteConfirm = async () => {
    if (invitationToDelete) {
      try {
        await deleteMutation.mutateAsync(invitationToDelete.id);
      } catch {
        // Error handled by mutation
      }
    }
  };

  const handleDeleteCancel = () => {
    setInvitationToDelete(null);
  };

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === invitations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invitations.map((i) => i.id)));
    }
  }, [invitations, selectedIds.size]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleBulkDeleteClick = () => {
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size > 0) {
      try {
        await bulkDeleteMutation.mutateAsync(Array.from(selectedIds));
      } catch {
        // Error handled by mutation
      }
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
  };

  const resendableSelectedCount = useMemo(() => {
    return invitations.filter(
      (i) => selectedIds.has(i.id) && (i.status === 'pending' || i.status === 'sent' || i.status === 'expired')
    ).length;
  }, [invitations, selectedIds]);

  const handleBulkResendConfirm = async () => {
    const resendableIds = invitations
      .filter((i) => selectedIds.has(i.id) && (i.status === 'pending' || i.status === 'sent' || i.status === 'expired'))
      .map((i) => i.id);
    if (resendableIds.length > 0) {
      try {
        await bulkResendMutation.mutateAsync(resendableIds);
      } catch {
        // Error handled by mutation
      }
    }
  };

  const isAllSelected = invitations.length > 0 && selectedIds.size === invitations.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < invitations.length;

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement des invitations. Veuillez réessayer.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des invitations</h1>
        <p className="mt-1 text-gray-600">
          Gérez les invitations des déposants pour l'édition en cours.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">En attente</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Activés</p>
          <p className="text-2xl font-bold text-green-600">{stats.activated}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Expirés</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
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
        <div className="flex gap-2">
          <Link to="/admin/invitations/stats">
            <Button variant="outline">Statistiques</Button>
          </Link>
          <Button variant="outline" onClick={onBulkCreateClick}>
            Invitations en masse
          </Button>
          <Button onClick={onCreateClick}>Nouvelle invitation</Button>
        </div>
      </div>

      {/* Success/Error messages */}
      {resendMutation.isSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Invitation renvoyée avec succès !
        </div>
      )}
      {resendMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de l'envoi de l'invitation. Veuillez réessayer.
        </div>
      )}
      {deleteMutation.isSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Invitation supprimée avec succès !
        </div>
      )}
      {deleteMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de la suppression de l'invitation. Veuillez réessayer.
        </div>
      )}
      {bulkDeleteResult && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>
            {bulkDeleteResult.deleted} invitation{bulkDeleteResult.deleted > 1 ? 's' : ''} supprimée{bulkDeleteResult.deleted > 1 ? 's' : ''} avec succès
            {bulkDeleteResult.notFound > 0 && ` (${bulkDeleteResult.notFound} non trouvée${bulkDeleteResult.notFound > 1 ? 's' : ''})`}
          </span>
          <button onClick={() => setBulkDeleteResult(null)} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        </div>
      )}
      {bulkDeleteMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de la suppression en masse. Veuillez réessayer.
        </div>
      )}
      {bulkResendResult && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>
            {bulkResendResult.resent} invitation{bulkResendResult.resent > 1 ? 's' : ''} relancee{bulkResendResult.resent > 1 ? 's' : ''} avec succes
            {bulkResendResult.skipped > 0 && ` (${bulkResendResult.skipped} ignoree${bulkResendResult.skipped > 1 ? 's' : ''})`}
          </span>
          <button onClick={() => setBulkResendResult(null)} className="text-green-700 hover:text-green-900">
            ✕
          </button>
        </div>
      )}
      {bulkResendMutation.isError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors de la relance en masse. Veuillez reessayer.
        </div>
      )}

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg flex justify-between items-center">
          <span className="text-blue-700">
            {selectedIds.size} invitation{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Désélectionner
            </Button>
            {resendableSelectedCount > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowBulkResendModal(true)}
              >
                Relancer la selection ({resendableSelectedCount})
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkDeleteClick}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer la sélection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune invitation trouvée.
            {statusFilter !== 'all' && (
              <button
                className="block mx-auto mt-2 text-blue-600 hover:underline"
                onClick={() => setStatusFilter('all')}
              >
                Voir toutes les invitations
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      aria-label="Sélectionner tout"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créée le
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {statusFilter === 'activated' ? 'Activée le' : 'Expire le'}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitations.map((invitation) => {
                  const statusInfo = STATUS_LABELS[invitation.status] || {
                    label: invitation.status,
                    className: 'bg-gray-100 text-gray-800',
                  };
                  const canResend =
                    invitation.status === 'pending' ||
                    invitation.status === 'sent' ||
                    invitation.status === 'expired';

                  return (
                    <tr key={invitation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(invitation.id)}
                          onChange={() => handleSelectOne(invitation.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Sélectionner ${invitation.email}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {invitation.firstName || invitation.lastName
                            ? `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim()
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatShortDate(invitation.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invitation.status === 'activated' && invitation.usedAt
                          ? formatDate(invitation.usedAt)
                          : invitation.expiresAt
                            ? formatShortDate(invitation.expiresAt)
                            : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        {canResend && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setInvitationToResend(invitation)}
                            disabled={resendMutation.isPending}
                          >
                            Relancer
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(invitation)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Supprimer
                        </Button>
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
      {invitations.length > 0 && (
        <p className="mt-4 text-sm text-gray-500 text-right">
          {invitations.length} invitation{invitations.length > 1 ? 's' : ''} affichée
          {invitations.length > 1 ? 's' : ''}
        </p>
      )}

      {/* Resend confirmation modal */}
      <ConfirmModal
        isOpen={!!invitationToResend}
        onClose={() => setInvitationToResend(null)}
        onConfirm={handleResendConfirm}
        title="Relancer l'invitation"
        message={`Renvoyer l'invitation à ${invitationToResend?.email} ?`}
        variant="info"
        confirmLabel="Relancer"
        isLoading={resendMutation.isPending}
      >
        <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
          Un nouveau lien d'activation sera généré et envoyé par email.
        </p>
      </ConfirmModal>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={!!invitationToDelete}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Confirmer la suppression"
        variant="danger"
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer l'invitation pour{' '}
          <span className="font-medium">{invitationToDelete?.email}</span> ?
        </p>
        {invitationToDelete?.status === 'activated' ? (
          <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
            Cette invitation a déjà été activée. L'utilisateur sera retiré de la liste
            des invitations, mais son compte sera conservé.
          </p>
        ) : (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
            Cette action est irréversible. L'invitation sera définitivement supprimée.
          </p>
        )}
      </ConfirmModal>

      {/* Bulk delete confirmation modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={handleBulkDeleteCancel}
        onConfirm={handleBulkDeleteConfirm}
        title="Confirmer la suppression en masse"
        variant="danger"
        confirmLabel={`Supprimer (${selectedIds.size})`}
        isLoading={bulkDeleteMutation.isPending}
      >
        <p className="text-gray-600">
          Êtes-vous sûr de vouloir supprimer{' '}
          <span className="font-medium">{selectedIds.size} invitation{selectedIds.size > 1 ? 's' : ''}</span> ?
        </p>
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
          Les invitations en attente seront définitivement supprimées.
          Les comptes déjà activés seront retirés de la liste mais conservés.
        </p>
      </ConfirmModal>

      {/* Bulk resend confirmation modal */}
      <ConfirmModal
        isOpen={showBulkResendModal}
        onClose={() => setShowBulkResendModal(false)}
        onConfirm={handleBulkResendConfirm}
        title="Relancer les invitations"
        message={`Relancer ${resendableSelectedCount} invitation${resendableSelectedCount > 1 ? 's' : ''} ?`}
        variant="info"
        confirmLabel={`Relancer (${resendableSelectedCount})`}
        isLoading={bulkResendMutation.isPending}
      >
        <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded">
          Un nouveau lien d'activation sera généré et envoyé par email pour chaque invitation en attente ou expirée.
        </p>
      </ConfirmModal>
    </div>
  );
}
