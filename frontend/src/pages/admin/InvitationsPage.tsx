import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invitationsApi } from '@/api';
import { Button, Select } from '@/components/ui';
import type { Invitation, InvitationStatusFilter } from '@/types';

type FilterOption = 'all' | InvitationStatusFilter;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'expired', label: 'Expirés' },
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

  // Compute statistics
  const stats = useMemo(() => {
    const total = invitations.length;
    const pending = invitations.filter((i) => i.status === 'pending' || i.status === 'sent').length;
    const activated = invitations.filter((i) => i.status === 'activated').length;
    const expired = invitations.filter((i) => i.status === 'expired').length;
    return { total, pending, activated, expired };
  }, [invitations]);

  const handleResend = async (invitation: Invitation) => {
    if (
      window.confirm(
        `Renvoyer l'invitation à ${invitation.email} ?\nUn nouveau lien sera généré et envoyé par email.`
      )
    ) {
      try {
        await resendMutation.mutateAsync(invitation.id);
      } catch {
        // Error handled by mutation
      }
    }
  };

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
                    Expire le
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
                        {formatShortDate(invitation.expiresAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {canResend && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(invitation)}
                            disabled={resendMutation.isPending}
                          >
                            Relancer
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
      {invitations.length > 0 && (
        <p className="mt-4 text-sm text-gray-500 text-right">
          {invitations.length} invitation{invitations.length > 1 ? 's' : ''} affichée
          {invitations.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
