import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi } from '@/api/editions';
import { labelsApi } from '@/api/labels';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import type { LabelGenerationMode, LabelStats, LabelDepositor } from '@/types';

function formatSlotLabel(startDatetime: string, endDatetime: string): string {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const day = days[start.getDay()];
  const startTime = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const endTime = end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${day} ${startTime}-${endTime}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export function LabelsManagementPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<LabelGenerationMode>('complete');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedDepositorIds, setSelectedDepositorIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch edition
  const { data: edition } = useQuery({
    queryKey: ['edition', editionId],
    queryFn: () => editionsApi.getEdition(editionId!),
    enabled: !!editionId,
  });

  // Fetch label stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['label-stats', editionId],
    queryFn: () => labelsApi.getStats(editionId!),
    enabled: !!editionId,
  });

  // Fetch deposit slots with validated lists (for slot mode)
  const { data: slotsData } = useQuery({
    queryKey: ['label-slots', editionId],
    queryFn: () => labelsApi.getSlots(editionId!),
    enabled: !!editionId && mode === 'slot',
  });

  // Fetch depositors with validated lists (for selection mode)
  const { data: depositorsData } = useQuery({
    queryKey: ['label-depositors', editionId],
    queryFn: () => labelsApi.getDepositors(editionId!),
    enabled: !!editionId && mode === 'selection',
  });

  // Generate labels mutation
  const generateMutation = useMutation({
    mutationFn: () => {
      const request: { mode: LabelGenerationMode; slotId?: string; depositorIds?: string[] } = { mode };
      if (mode === 'slot') request.slotId = selectedSlotId;
      if (mode === 'selection') request.depositorIds = Array.from(selectedDepositorIds);
      return labelsApi.generateLabels(editionId!, request);
    },
    onSuccess: (blob) => {
      const date = new Date().toISOString().split('T')[0];
      const editionName = edition?.name?.replace(/\s+/g, '_') || 'edition';
      downloadBlob(blob, `Étiquettes_${editionName}_${date}.pdf`);
      setSuccessMessage('PDF généré avec succès ! Le téléchargement a démarré.');
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['label-stats', editionId] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors de la génération du PDF');
      setSuccessMessage('');
    },
  });

  const canGenerate = (): boolean => {
    if (generateMutation.isPending) return false;
    if (mode === 'slot' && !selectedSlotId) return false;
    if (mode === 'selection' && selectedDepositorIds.size === 0) return false;
    return true;
  };

  const handleGenerate = () => {
    setSuccessMessage('');
    setErrorMessage('');
    generateMutation.mutate();
  };

  const toggleDepositor = (userId: string) => {
    setSelectedDepositorIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleAllDepositors = () => {
    if (!depositorsData) return;
    if (selectedDepositorIds.size === depositorsData.length) {
      setSelectedDepositorIds(new Set());
    } else {
      setSelectedDepositorIds(new Set(depositorsData.map((d: LabelDepositor) => d.id)));
    }
  };

  const slots = slotsData || [];
  const depositors = depositorsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex flex-wrap items-center space-x-2 text-sm text-bark-muted">
          <li><Link to="/editions" className="hover:text-bark">Éditions</Link></li>
          <li>/</li>
          <li><Link to={`/editions/${editionId}`} className="hover:text-bark">{edition?.name || '...'}</Link></li>
          <li>/</li>
          <li className="text-bark font-medium">Étiquettes</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-bark">Gestion des étiquettes</h1>
        <p className="mt-1 text-sm text-bark-muted">
          Générez les étiquettes PDF pour les listes validées de cette édition.
        </p>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Déposants" value={stats.totalDepositors} sublabel="avec listes validées" />
          <StatCard label="Listes validées" value={stats.totalLists} sublabel={`${stats.labelsGenerated} déjà générées`} />
          <StatCard label="Étiquettes" value={stats.totalLabels} sublabel="au total" />
        </div>
      )}
      {statsLoading && (
        <div className="text-center py-4 text-bark-muted mb-8">Chargement des statistiques...</div>
      )}

      {/* Generation form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-bark mb-4">Mode de génération</h2>

        {/* Mode selector */}
        <div className="flex flex-wrap gap-3 mb-6">
          {([
            { value: 'complete', label: 'Édition complète' },
            { value: 'slot', label: 'Par créneau' },
            { value: 'selection', label: 'Par sélection' },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setMode(option.value);
                setSelectedSlotId('');
                setSelectedDepositorIds(new Set());
              }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                mode === option.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-bark-light border-sand hover:bg-cream'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Slot selector */}
        {mode === 'slot' && (
          <div className="mb-6">
            <Select
              label="Créneau de dépôt"
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              options={[
                { value: '', label: 'Sélectionnez un créneau...' },
                ...slots.map((slot) => ({
                  value: slot.id,
                  label: formatSlotLabel(slot.startDatetime, slot.endDatetime),
                })),
              ]}
            />
          </div>
        )}

        {/* Depositor selection */}
        {mode === 'selection' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-bark-light">
                Déposants ({selectedDepositorIds.size} sélectionné{selectedDepositorIds.size > 1 ? 's' : ''})
              </label>
              <button
                type="button"
                onClick={toggleAllDepositors}
                className="text-sm text-primary hover:text-primary-strong"
              >
                {selectedDepositorIds.size === depositors.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
            {depositors.length === 0 ? (
              <p className="text-sm text-bark-muted">Aucun déposant avec des listes validées pour cette édition.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-sand rounded-lg divide-y divide-gray-100">
                {depositors.map((dep: LabelDepositor) => (
                  <label
                    key={dep.id}
                    className="flex items-center px-4 py-2 hover:bg-cream cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepositorIds.has(dep.id)}
                      onChange={() => toggleDepositor(dep.id)}
                      className="h-4 w-4 text-primary rounded border-sand"
                    />
                    <span className="ml-3 text-sm text-bark">
                      {dep.firstName} {dep.lastName}
                    </span>
                    <span className="ml-2 text-xs text-bark-muted">({dep.email})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-info-soft border border-primary/40 rounded-lg text-sm text-primary-strong">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-error-soft border border-error/40 rounded-lg text-sm text-error-dark">
            {errorMessage}
          </div>
        )}

        {/* Generate button */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleGenerate}
          isLoading={generateMutation.isPending}
          disabled={!canGenerate()}
        >
          {generateMutation.isPending ? 'Génération en cours...' : 'Générer et télécharger le PDF'}
        </Button>

        {generateMutation.isPending && (
          <p className="mt-2 text-sm text-bark-muted">
            La génération peut prendre quelques secondes selon le nombre d'étiquettes...
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="text-sm font-medium text-bark-muted">{label}</div>
      <div className="mt-1 text-3xl font-bold text-primary">{value}</div>
      <div className="mt-1 text-xs text-bark-muted">{sublabel}</div>
    </div>
  );
}
