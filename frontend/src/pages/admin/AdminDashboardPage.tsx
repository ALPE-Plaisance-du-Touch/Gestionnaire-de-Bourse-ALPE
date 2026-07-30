import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { editionsApi } from '@/api/editions';
import { billetwebApi } from '@/api/billetweb';
import { labelsApi } from '@/api/labels';
import { invitationsApi } from '@/api/invitations';
import { Card, StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import type { EditionStatus } from '@/types';

const STATUS_CONFIG: Record<EditionStatus, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'muted' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  registrations_open: { label: 'Inscriptions ouvertes', variant: 'info' },
  deposit: { label: 'Dépôt', variant: 'warning' },
  sale: { label: 'Vente', variant: 'success' },
  settlement: { label: 'Bilan', variant: 'warning' },
  closed: { label: 'Clôturée', variant: 'muted' },
  archived: { label: 'Archivée', variant: 'muted' },
};

type ContextualAction = {
  label: string;
  to: string;
  description: string;
  icon: React.ReactNode;
};

function getContextualActions(editionId: string, status: EditionStatus): ContextualAction[] {
  const actions: Record<string, ContextualAction[]> = {
    draft: [
      { label: 'Configurer l\'édition', to: `/editions/${editionId}`, description: 'Dates, lieu, paramètres', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ],
    registrations_open: [
      { label: 'Importer les inscrits', to: `/editions/${editionId}/depositors`, description: 'Billetweb ou CSV', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg> },
      { label: 'Envoyer les invitations', to: '/admin/invitations', description: 'Activer les comptes déposants', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
      { label: 'Suivre les déclarations', to: `/editions/${editionId}/declarations`, description: 'Progression des listes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
    ],
    deposit: [
      { label: 'Réviser les listes', to: `/editions/${editionId}/review`, description: 'Accepter ou refuser les articles', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
      { label: 'Générer les étiquettes', to: `/editions/${editionId}/labels`, description: 'PDF avec QR codes', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
    ],
    sale: [
      { label: 'Ouvrir la caisse', to: `/editions/${editionId}/sales`, description: 'Scanner et vendre', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg> },
      { label: 'Statistiques en direct', to: `/editions/${editionId}/stats`, description: 'Ventes et chiffres', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    ],
    settlement: [
      { label: 'Calculer les reversements', to: `/editions/${editionId}/payouts`, description: 'Commissions et paiements', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
      { label: 'Rapport de clôture', to: `/editions/${editionId}/stats`, description: 'Bilan complet', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    ],
    closed: [
      { label: 'Consulter le bilan', to: `/editions/${editionId}/stats`, description: 'Résumé final', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    ],
    archived: [],
  };

  return actions[status] ?? [];
}

export function AdminDashboardPage() {
  const { data: activeData, isLoading: editionLoading } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
  });

  const edition = activeData?.edition ?? activeData?.trainingEdition ?? null;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-bark-muted">Chargement...</p>
      </div>
    );
  }

  if (!edition) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-bark mb-6">Tableau de bord</h1>
        <Card variant="default" padding="lg" className="text-center">
          <p className="text-bark-muted text-lg mb-4">
            Aucune édition active actuellement.
          </p>
          <Link to="/editions">
            <Button>Gérer les éditions</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[edition.status] || STATUS_CONFIG.draft;
  const contextualActions = getContextualActions(editionId!, edition.status);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bark">Tableau de bord</h1>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-bark-light">{edition.name}</span>
          <StatusBadge variant={statusInfo.variant} dot>
            {statusInfo.label}
          </StatusBadge>
        </div>
      </div>

      {/* Contextual actions - "À faire maintenant" */}
      {contextualActions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-bark-muted uppercase tracking-wider mb-3">
            À faire maintenant
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contextualActions.map((action) => (
              <Link key={action.to} to={action.to}>
                <Card hover padding="md" className="h-full">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-info-soft text-primary rounded-xl shrink-0">
                      {action.icon}
                    </div>
                    <div>
                      <p className="font-medium text-bark">{action.label}</p>
                      <p className="text-sm text-bark-muted mt-0.5">{action.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-bark-muted uppercase tracking-wider mb-3">
          Vue d'ensemble
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Déposants"
            value={billetwebLoading ? '...' : billetwebStats?.totalDepositors ?? 0}
            detail="inscrits via Billetweb"
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <StatCard
            label="Invitations"
            value={invitationsLoading ? '...' : invitationStats ? `${invitationStats.activated} / ${invitationStats.total}` : '0'}
            detail={invitationStats ? `${Math.round(invitationStats.activationRate)}% activées` : 'activées'}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
          <StatCard
            label="Listes validées"
            value={labelsLoading ? '...' : labelStats?.totalLists ?? 0}
            detail={`${labelStats?.labelsGenerated ?? 0} étiquettes générées`}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
          />
          <StatCard
            label="Étiquettes"
            value={labelsLoading ? '...' : labelStats?.totalLabels ?? 0}
            detail={`${labelStats?.labelsPending ?? 0} en attente`}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
}
