import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi } from '@/api/editions';
import type { Edition, RegistrationMode } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';

interface EditionModulesConfigProps {
  edition: Edition;
}

interface ModuleState {
  labelsEnabled: boolean;
  depositReviewEnabled: boolean;
  salesEnabled: boolean;
  payoutsEnabled: boolean;
  depositSlotsEnabled: boolean;
  ticketsEnabled: boolean;
  specialListsEnabled: boolean;
  offlineSalesEnabled: boolean;
  privateSchoolSaleEnabled: boolean;
  registrationMode: RegistrationMode;
}

function toState(edition: Edition): ModuleState {
  return {
    labelsEnabled: edition.labelsEnabled,
    depositReviewEnabled: edition.depositReviewEnabled,
    salesEnabled: edition.salesEnabled,
    payoutsEnabled: edition.payoutsEnabled,
    depositSlotsEnabled: edition.depositSlotsEnabled,
    ticketsEnabled: edition.ticketsEnabled,
    specialListsEnabled: edition.specialListsEnabled,
    offlineSalesEnabled: edition.offlineSalesEnabled,
    privateSchoolSaleEnabled: edition.privateSchoolSaleEnabled,
    registrationMode: edition.registrationMode,
  };
}

const REGISTRATION_OPTIONS: { value: RegistrationMode; label: string }[] = [
  { value: 'manual', label: 'Saisie manuelle des invitations' },
  { value: 'billetweb_csv', label: 'Import Billetweb (fichier CSV)' },
  { value: 'billetweb_api', label: 'Import Billetweb (API)' },
];

export function EditionModulesConfig({ edition }: EditionModulesConfigProps) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<ModuleState>(() => toState(edition));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: () => editionsApi.updateEdition(edition.id, state),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['edition', edition.id] });
      // The sidebar reads the active edition; refresh it so module links
      // appear/disappear immediately without a page reload.
      queryClient.invalidateQueries({ queryKey: ['active-edition'] });
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? 'La mise à jour a échoué.';
      setError(detail);
      setSuccess(false);
    },
  });

  // Enabling payouts / sales sub-settings requires sales; force them off when
  // sales is turned off so the UI can never submit an inconsistent state.
  function update(patch: Partial<ModuleState>) {
    setState((prev) => {
      const next = { ...prev, ...patch };
      if (!next.salesEnabled) {
        next.payoutsEnabled = false;
        next.offlineSalesEnabled = false;
        next.privateSchoolSaleEnabled = false;
      }
      return next;
    });
    setSuccess(false);
  }

  const salesOff = !state.salesEnabled;
  const isDirty = JSON.stringify(state) !== JSON.stringify(toState(edition));

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-bark mb-1">
          Fonctionnalités de la bourse
        </h3>
        <p className="text-sm text-bark-muted mb-4">
          La déclaration des listes par les participants est toujours active.
          Activez ci-dessous les autres modules selon le format de cette bourse.
        </p>

        <div className="space-y-1 divide-y divide-sand/60">
          <Toggle
            label="Génération d'étiquettes"
            description="Impression des étiquettes à code-barres par les bénévoles."
            checked={state.labelsEnabled}
            onChange={(v) => update({ labelsEnabled: v })}
          />
          <Toggle
            label="Revue / validation des listes"
            description="Étape d'acceptation ou de refus des articles au dépôt."
            checked={state.depositReviewEnabled}
            onChange={(v) => update({ depositReviewEnabled: v })}
          />
          <Toggle
            label="Créneaux de dépôt"
            description="Réservation d'un créneau horaire pour déposer les articles."
            checked={state.depositSlotsEnabled}
            onChange={(v) => update({ depositSlotsEnabled: v })}
          />
          <Toggle
            label="Listes spéciales 1000 / 2000"
            description="Listes réservées aux adhérents ALPE et à leurs proches."
            checked={state.specialListsEnabled}
            onChange={(v) => update({ specialListsEnabled: v })}
          />
          <Toggle
            label="Messagerie"
            description="Canal de discussion entre déposants et équipe."
            checked={state.ticketsEnabled}
            onChange={(v) => update({ ticketsEnabled: v })}
          />
          <Toggle
            label="Vente / encaissement"
            description="Scan des articles et enregistrement des ventes en caisse."
            checked={state.salesEnabled}
            onChange={(v) => update({ salesEnabled: v })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-bark mb-1">
          Options de la vente
        </h3>
        <p className="text-sm text-bark-muted mb-4">
          {salesOff
            ? 'Activez la vente pour accéder à ces options.'
            : 'Réglages complémentaires de la caisse.'}
        </p>
        <div className="space-y-1 divide-y divide-sand/60">
          <Toggle
            label="Reversements"
            description="Calcul des reversements et génération des reçus."
            checked={state.payoutsEnabled}
            disabled={salesOff}
            onChange={(v) => update({ payoutsEnabled: v })}
          />
          <Toggle
            label="Mode hors-ligne (caisse)"
            description="Encaissement sans réseau avec synchronisation au retour."
            checked={state.offlineSalesEnabled}
            disabled={salesOff}
            onChange={(v) => update({ offlineSalesEnabled: v })}
          />
          <Toggle
            label="Vente privée écoles"
            description="Créneau prioritaire réservé aux écoles / ALAE."
            checked={state.privateSchoolSaleEnabled}
            disabled={salesOff}
            onChange={(v) => update({ privateSchoolSaleEnabled: v })}
          />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-bark mb-1">
          Inscription des déposants
        </h3>
        <p className="text-sm text-bark-muted mb-4">
          Source des inscriptions pour cette bourse. La saisie manuelle des
          invitations reste toujours possible en complément.
        </p>
        <div className="space-y-2">
          {REGISTRATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="registrationMode"
                className="text-primary focus:ring-primary"
                checked={state.registrationMode === opt.value}
                onChange={() => update({ registrationMode: opt.value })}
              />
              <span className="text-sm text-bark">{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Configuration enregistrée.
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => mutation.mutate()}
          disabled={!isDirty || mutation.isPending}
        >
          {mutation.isPending ? 'Enregistrement…' : 'Enregistrer les fonctionnalités'}
        </Button>
      </div>
    </div>
  );
}
