import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { editionsApi } from '@/api';
import { useAuth } from '@/contexts';
import { MainLayout } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Edition } from '@/types';
import type { UserRole } from '@/types/user';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function EditionCard({ edition }: { edition: Edition }) {
  return (
    <Card variant="accent" padding="lg">
      <h3 className="text-xl font-bold text-bark mb-4">{edition.name}</h3>
      {edition.location && (
        <div className="flex items-center gap-2 text-bark-muted mb-3">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{edition.location}</span>
        </div>
      )}
      <div className="space-y-2 text-sm text-bark-light">
        {edition.startDatetime && edition.endDatetime && (
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>
              <span className="font-medium text-bark">Vente :</span>{' '}
              {formatDate(edition.startDatetime)} — {formatDateShort(edition.endDatetime)}
            </p>
          </div>
        )}
        {edition.depositStartDatetime && edition.depositEndDatetime && (
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-secondary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p>
              <span className="font-medium text-bark">Dépôt :</span>{' '}
              {formatDate(edition.depositStartDatetime)} — {formatDateShort(edition.depositEndDatetime)}
            </p>
          </div>
        )}
        {edition.declarationDeadline && (
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-accent-dark shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>
              <span className="font-medium text-bark">Déclaration avant le :</span>{' '}
              {formatDateShort(edition.declarationDeadline)}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

type QuickLink = { label: string; to: string; roles: UserRole[]; needsEdition?: boolean; statuses?: string[]; icon: React.ReactNode };

function QuickActionCard({ link }: { link: QuickLink }) {
  return (
    <Link to={link.to}>
      <Card hover padding="md" className="h-full">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
            {link.icon}
          </div>
          <span className="font-medium text-bark">{link.label}</span>
        </div>
      </Card>
    </Link>
  );
}

function RoleLinks({ role, editionId, editionStatus }: { role: UserRole; editionId?: string; editionStatus?: string }) {
  const categories: { title: string; links: QuickLink[] }[] = [
    {
      title: 'Participer',
      links: [
        {
          label: 'Mes listes',
          to: `/depositor/editions/${editionId}/lists`,
          roles: ['depositor', 'volunteer', 'manager', 'administrator'],
          needsEdition: true,
          statuses: ['registrations_open', 'deposit', 'sale'],
          icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
        },
      ],
    },
    {
      title: "Gérer l'édition en cours",
      links: [
        { label: 'Détails', to: `/editions/${editionId}`, roles: ['manager', 'administrator'], needsEdition: true, icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { label: 'Revue des listes', to: `/editions/${editionId}/review`, roles: ['volunteer', 'manager', 'administrator'], needsEdition: true, statuses: ['deposit'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
        { label: 'Caisse', to: `/editions/${editionId}/sales`, roles: ['volunteer', 'manager', 'administrator'], needsEdition: true, statuses: ['sale'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg> },
        { label: 'Étiquettes', to: `/editions/${editionId}/labels`, roles: ['manager', 'administrator'], needsEdition: true, statuses: ['registrations_open', 'deposit'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
        { label: 'Gestion des ventes', to: `/editions/${editionId}/sales/manage`, roles: ['manager', 'administrator'], needsEdition: true, statuses: ['sale'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
        { label: 'Reversements', to: `/editions/${editionId}/payouts`, roles: ['manager', 'administrator'], needsEdition: true, statuses: ['settlement', 'closed'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        { label: 'Statistiques', to: `/editions/${editionId}/stats`, roles: ['manager', 'administrator'], needsEdition: true, statuses: ['sale', 'settlement'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
      ],
    },
    {
      title: 'Administrer la plateforme',
      links: [
        { label: 'Gestion des éditions', to: '/editions', roles: ['manager', 'administrator'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
        { label: 'Invitations', to: '/admin/invitations', roles: ['manager', 'administrator'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
        { label: 'Utilisateurs', to: '/admin/users', roles: ['administrator'], icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
      ],
    },
  ];

  const visibleCategories = categories
    .map((cat) => ({
      ...cat,
      links: cat.links.filter((l) =>
        l.roles.includes(role) &&
        (!l.needsEdition || editionId) &&
        (!l.statuses || (editionStatus && l.statuses.includes(editionStatus)))
      ),
    }))
    .filter((cat) => cat.links.length > 0);

  return (
    <div className="space-y-8">
      {visibleCategories.map((cat) => (
        <div key={cat.title}>
          <h3 className="text-xs font-semibold text-bark-muted uppercase tracking-wider mb-3">{cat.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cat.links.map((link) => (
              <QuickActionCard key={link.to} link={link} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitorHomePage({ edition }: { edition: Edition | null }) {
  return (
    <>
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-bark mb-4">
          Bourse aux vêtements ALPE
        </h1>
        <p className="text-lg text-bark-light max-w-2xl mx-auto">
          L'association ALPE Plaisance du Touch organise des bourses aux vêtements et articles de puériculture d'occasion.
        </p>
      </div>

      <Card variant="default" padding="lg" className="mb-8 max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-bark mb-4">Comment ça marche ?</h2>
        <div className="space-y-4">
          {[
            { step: '1', text: 'Déposez vos articles lors des créneaux prévus', color: 'bg-primary/10 text-primary' },
            { step: '2', text: 'Nos bénévoles assurent la vente au public', color: 'bg-secondary/10 text-secondary' },
            { step: '3', text: 'Récupérez vos invendus et votre reversement', color: 'bg-accent/15 text-accent-dark' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${item.color}`}>
                {item.step}
              </span>
              <span className="text-bark-light">{item.text}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 pt-4 border-t border-sand text-sm text-bark-muted">
          Une commission de 20% est prélevée au profit de l'association.
        </p>
      </Card>

      {edition ? (
        <div className="max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-semibold text-bark mb-4">Prochaine bourse</h2>
          <EditionCard edition={edition} />
        </div>
      ) : (
        <div className="text-center py-8 mb-8">
          <p className="text-bark-muted text-lg">
            Aucune bourse n'est programmée pour le moment.
          </p>
        </div>
      )}

      <div className="text-center">
        <Link to="/login">
          <Button variant="primary" size="lg">
            Se connecter
          </Button>
        </Link>
      </div>
    </>
  );
}

function AuthenticatedHomePage({
  edition,
  firstName,
  role,
}: {
  edition: Edition | null;
  firstName: string;
  role: UserRole;
}) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-bark">
          Bonjour {firstName} !
        </h1>
      </div>

      {edition ? (
        <div className="mb-8">
          {edition.isTraining && (
            <div className="mb-3 bg-accent/10 border border-accent/30 text-accent-dark px-4 py-2.5 rounded-xl text-sm font-medium">
              Bourse de formation — Les accès rapides ci-dessous pointent vers l'édition d'entraînement.
            </div>
          )}
          <EditionCard edition={edition} />
        </div>
      ) : (
        <Card variant="default" padding="lg" className="text-center mb-8">
          <p className="text-bark-muted text-lg">
            Aucune bourse n'est en cours actuellement.
          </p>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-bark mb-5">Accès rapide</h2>
        <RoleLinks role={role} editionId={edition?.id} editionStatus={edition?.status} />
      </div>
    </>
  );
}

function canAccessTrainingEdition(role: UserRole, isTester: boolean): boolean {
  if (role === 'administrator' || role === 'manager' || role === 'volunteer') return true;
  return role === 'depositor' && isTester;
}

export function HomePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    data: activeData,
    isLoading: editionLoading,
  } = useQuery({
    queryKey: ['active-edition'],
    queryFn: () => editionsApi.getActiveEdition(),
  });

  const isLoading = authLoading || editionLoading;

  const realEdition = activeData?.edition ?? null;
  const trainingEdition = activeData?.trainingEdition ?? null;
  const showTraining = !realEdition && !!trainingEdition && !!user && canAccessTrainingEdition(user.role, user.isTester);
  const edition = realEdition ?? (showTraining ? trainingEdition : null);

  return (
    <MainLayout>
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-bark-muted">Chargement...</p>
        </div>
      ) : isAuthenticated && user ? (
        <AuthenticatedHomePage
          edition={edition}
          firstName={user.firstName}
          role={user.role}
        />
      ) : (
        <VisitorHomePage edition={realEdition} />
      )}
    </MainLayout>
  );
}
