import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositSlotsApi, ApiException } from '@/api';
import { Button, Input } from '@/components/ui';
import type { DepositSlot, CreateDepositSlotRequest } from '@/types';

interface DepositSlotsEditorProps {
  editionId: string;
  disabled?: boolean;
}

/**
 * Format an ISO datetime string for datetime-local input.
 */
function formatDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Format a datetime for display.
 */
function formatDisplayDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calculate duration in hours and minutes.
 */
function formatDuration(startDatetime: string, endDatetime: string): string {
  const start = new Date(startDatetime);
  const end = new Date(endDatetime);
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) {
    return `${minutes}min`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes}`;
}

export function DepositSlotsEditor({ editionId, disabled = false }: DepositSlotsEditorProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for new slot
  const [newSlot, setNewSlot] = useState<CreateDepositSlotRequest>({
    startDatetime: '',
    endDatetime: '',
    maxCapacity: 20,
    reservedForLocals: false,
    description: '',
  });

  // Fetch existing slots
  const { data: slotsResponse, isLoading } = useQuery({
    queryKey: ['deposit-slots', editionId],
    queryFn: () => depositSlotsApi.getDepositSlots(editionId),
  });

  const slots = slotsResponse?.items ?? [];

  // Create slot mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateDepositSlotRequest) =>
      depositSlotsApi.createDepositSlot(editionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', editionId] });
      setIsAdding(false);
      setError(null);
      // Reset form
      setNewSlot({
        startDatetime: '',
        endDatetime: '',
        maxCapacity: 20,
        reservedForLocals: false,
        description: '',
      });
    },
    onError: (err) => {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Erreur lors de la création du créneau.');
      }
    },
  });

  // Delete slot mutation
  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => depositSlotsApi.deleteDepositSlot(editionId, slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', editionId] });
    },
    onError: () => {
      setError('Erreur lors de la suppression du créneau.');
    },
  });

  const handleAddSlot = () => {
    setError(null);

    // Validation
    if (!newSlot.startDatetime || !newSlot.endDatetime) {
      setError('Les dates de début et fin sont requises.');
      return;
    }

    const start = new Date(newSlot.startDatetime);
    const end = new Date(newSlot.endDatetime);

    if (end <= start) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    createMutation.mutate({
      ...newSlot,
      startDatetime: start.toISOString(),
      endDatetime: end.toISOString(),
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (confirm('Supprimer ce créneau ?')) {
      deleteMutation.mutate(slotId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-medium text-gray-900">Créneaux de dépôt</h3>
        {!disabled && !isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            + Ajouter un créneau
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {/* Existing slots list */}
      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement des créneaux...</div>
      ) : slots.length === 0 && !isAdding ? (
        <div className="text-sm text-gray-500 italic">
          Aucun créneau de dépôt configuré.
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onDelete={() => handleDeleteSlot(slot.id)}
              disabled={disabled || deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Add new slot form */}
      {isAdding && (
        <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Début"
              type="datetime-local"
              value={newSlot.startDatetime}
              onChange={(e) =>
                setNewSlot({ ...newSlot, startDatetime: e.target.value })
              }
              required
            />
            <Input
              label="Fin"
              type="datetime-local"
              value={newSlot.endDatetime}
              onChange={(e) =>
                setNewSlot({ ...newSlot, endDatetime: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Capacité max"
              type="number"
              value={String(newSlot.maxCapacity)}
              onChange={(e) =>
                setNewSlot({ ...newSlot, maxCapacity: parseInt(e.target.value) || 20 })
              }
              min="1"
              max="200"
            />
            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="reserved-locals"
                checked={newSlot.reservedForLocals}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, reservedForLocals: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="reserved-locals" className="ml-2 text-sm text-gray-700">
                Réservé aux Plaisançois
              </label>
            </div>
          </div>

          <Input
            label="Description (optionnel)"
            type="text"
            value={newSlot.description || ''}
            onChange={(e) => setNewSlot({ ...newSlot, description: e.target.value })}
            placeholder="Ex: Créneau réservé aux bénévoles"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleAddSlot}
              disabled={createMutation.isPending}
              isLoading={createMutation.isPending}
            >
              Ajouter
            </Button>
          </div>
        </div>
      )}

      {/* Standard slots suggestion */}
      {!disabled && slots.length === 0 && !isAdding && (
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Exemples de créneaux standards :</strong>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            <li>Mercredi matin 9h30-11h30 : 20 déposants</li>
            <li>Mercredi après-midi 14h-18h : 40 déposants</li>
            <li>Mercredi soir 20h-22h : 20 déposants (réservé Plaisançois)</li>
            <li>Jeudi soir 17h-21h : 32 déposants</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Card displaying a single deposit slot.
 */
function SlotCard({
  slot,
  onDelete,
  disabled,
}: {
  slot: DepositSlot;
  onDelete: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {formatDisplayDateTime(slot.startDatetime)}
          </span>
          <span className="text-gray-400">-</span>
          <span className="text-sm text-gray-600">
            {new Date(slot.endDatetime).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <span className="text-xs text-gray-400">
            ({formatDuration(slot.startDatetime, slot.endDatetime)})
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">
            {slot.maxCapacity} places
          </span>
          {slot.reservedForLocals && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Plaisançois
            </span>
          )}
          {slot.description && (
            <span className="text-xs text-gray-400">{slot.description}</span>
          )}
        </div>
      </div>
      {!disabled && (
        <button
          type="button"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 p-1"
          title="Supprimer"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
