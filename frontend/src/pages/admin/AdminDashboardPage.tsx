import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { editionsApi } from '@/api/editions';
import { billetwebApi } from '@/api/billetweb';
import { labelsApi } from '@/api/labels';
import { invitationsApi } from '@/api/invitations';
import type { EditionStatus } from '@/types';

const STATUS_LABELS: Record<EditionStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
  configured: { label: 'Configurée', className: 'bg-blue-100 text-blue-800' },
  registrations_open: { label: 'Inscriptions ouvertes', className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'En cours', className: 'bg-green-100 text-green-800' },
  closed: { label: 'Clôturée', className: 'bg-orange-100 text-orange-800' },
  archived: { label: 'Archivée', className: 'bg-gray-100 text-gray-500' },
};

function StatCard({
  label,
  value,
  sublabel,
  loading,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-blue-600">
        {loading ? (
          <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      <div className="mt-1 text-xs text-gray-400">{sublabel}</div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data: edition, isLoading: editionLoading } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
  });

  const editionId = edition?.id;

  const { data: billetwebStats, isLoading: billetwebLoading } = useQuery({
    queryKey: ['billetweb-stats', editionId],
    queryFn: () => billetwebApi.getImportStats(editionId!),
    enabled: !!editionId,
  });

  const { data: labelStats, isLoading: labelsLoading } = useQuery({
    queryKey: ['label-stats', editionId],
    queryFn: () => labelsApi.getStats(editionId!),
    enabled: !!editionId,
  });

  const { data: invitationStats, isLoading: invitationsLoading } = useQuery({
    queryKey: ['invitation-stats'],
    queryFn: () => invitationsApi.getStats(),
  });

  if (editionLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg mb-4">
            Aucune édition active actuellement.
          </p>
          <Link
            to="/editions"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition-colors"
          >
            Gérer les éditions
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[edition.status] || STATUS_LABELS.draft;

  const quickLinks = [
    { label: "Détail de l'édition", to: `/editions/${editionId}` },
    { label: 'Déposants', to: `/editions/${editionId}/depositors` },
    { label: 'Invitations', to: '/admin/invitations' },
    { label: 'Étiquettes', to: `/editions/${editionId}/labels` },
    { label: 'Caisse', to: `/editions/${editionId}/sales` },
    { label: 'Gestion des ventes', to: `/editions/${editionId}/sales/manage` },
    { label: 'Statistiques', to: `/editions/${editionId}/stats` },
    { label: 'Reversements', to: `/editions/${editionId}/payouts` },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-gray-600">{edition.name}</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Déposants"
          value={billetwebStats?.totalDepositors ?? 0}
          sublabel="inscrits"
          loading={billetwebLoading}
        />
        <StatCard
          label="Invitations"
          value={invitationStats ? `${invitationStats.activated} / ${invitationStats.total}` : '0'}
          sublabel={invitationStats ? `${Math.round(invitationStats.activationRate)}% activées` : 'activées'}
          loading={invitationsLoading}
        />
        <StatCard
          label="Listes validées"
          value={labelStats?.totalLists ?? 0}
          sublabel={`${labelStats?.labelsGenerated ?? 0} étiquettes générées`}
          loading={labelsLoading}
        />
        <StatCard
          label="Étiquettes"
          value={labelStats?.totalLabels ?? 0}
          sublabel={`${labelStats?.labelsPending ?? 0} en attente`}
          loading={labelsLoading}
        />
      </div>

      {/* Quick links */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center justify-center px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors text-gray-700 font-medium text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
