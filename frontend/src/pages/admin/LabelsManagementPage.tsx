import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi } from '@/api/editions';
import { depositSlotsApi } from '@/api/deposit-slots';
import { billetwebApi } from '@/api/billetweb';
import { labelsApi } from '@/api/labels';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { LabelGenerationMode, LabelStats, EditionDepositorWithUser } from '@/types';

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

  // Fetch deposit slots
  const { data: slotsData } = useQuery({
    queryKey: ['deposit-slots', editionId],
    queryFn: () => depositSlotsApi.getSlots(editionId!),
    enabled: !!editionId,
  });

  // Fetch depositors (for selection mode)
  const { data: depositorsData } = useQuery({
    queryKey: ['depositors', editionId],
    queryFn: () => billetwebApi.listDepositors(editionId!, { limit: 500 }),
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
    if (!depositorsData?.items) return;
    if (selectedDepositorIds.size === depositorsData.items.length) {
      setSelectedDepositorIds(new Set());
    } else {
      setSelectedDepositorIds(new Set(depositorsData.items.map((d: EditionDepositorWithUser) => d.userId)));
    }
  };

  const slots = slotsData?.items || [];
  const depositors = depositorsData?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li><Link to="/editions" className="hover:text-gray-700">Éditions</Link></li>
          <li>/</li>
          <li><Link to={`/editions/${editionId}`} className="hover:text-gray-700">{edition?.name || '...'}</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Étiquettes</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des étiquettes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Générez les étiquettes PDF pour les listes validées de cette édition.
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Déposants" value={stats.totalDepositors} sublabel="avec listes validées" />
          <StatCard label="Listes validees" value={stats.totalLists} sublabel={`${stats.labelsGenerated} déjà générées`} />
          <StatCard label="Etiquettes" value={stats.totalLabels} sublabel="au total" />
        </div>
      )}
      {statsLoading && (
        <div className="text-center py-4 text-gray-500 mb-8">Chargement des statistiques...</div>
      )}

      {/* Generation form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Mode de génération</h2>

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
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
              <label className="block text-sm font-medium text-gray-700">
                Déposants ({selectedDepositorIds.size} sélectionné{selectedDepositorIds.size > 1 ? 's' : ''})
              </label>
              <button
                type="button"
                onClick={toggleAllDepositors}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedDepositorIds.size === depositors.length ? 'Tout desélectionnér' : 'Tout sélectionnér'}
              </button>
            </div>
            {depositors.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun déposant inscrit pour cette édition.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {depositors.map((dep: EditionDepositorWithUser) => (
                  <label
                    key={dep.id}
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDepositorIds.has(dep.userId)}
                      onChange={() => toggleDepositor(dep.userId)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-900">
                      {dep.userFirstName} {dep.userLastName}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">({dep.userEmail})</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
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
          <p className="mt-2 text-sm text-gray-500">
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
      <div className="text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-blue-600">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{sublabel}</div>
    </div>
  );
}
