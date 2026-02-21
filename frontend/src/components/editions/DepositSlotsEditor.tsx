import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { depositSlotsApi, billetwebApi, ApiException } from '@/api';
import { Button, ConfirmModal, Input, Modal } from '@/components/ui';
import type { DepositSlot, CreateDepositSlotRequest } from '@/types';

interface DepositSlotsEditorProps {
  editionId: string;
  disabled?: boolean;
  onSyncBilletweb?: () => void;
}

function parseLocalDatetime(datetimeString: string): Date {
  const [datePart, timePart] = datetimeString.replace('Z', '').split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

function formatTime(datetimeString: string): string {
  const d = parseLocalDatetime(datetimeString);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatDayLabel(datetimeString: string): string {
  const d = parseLocalDatetime(datetimeString);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getDayKey(datetimeString: string): string {
  return datetimeString.replace('Z', '').substring(0, 10);
}

function groupSlotsByDay(slots: DepositSlot[]): { dayKey: string; label: string; slots: DepositSlot[] }[] {
  const groups = new Map<string, { label: string; slots: DepositSlot[] }>();
  for (const slot of slots) {
    const key = getDayKey(slot.startDatetime);
    if (!groups.has(key)) {
      groups.set(key, { label: formatDayLabel(slot.startDatetime), slots: [] });
    }
    groups.get(key)!.slots.push(slot);
  }
  return Array.from(groups.entries()).map(([dayKey, group]) => ({
    dayKey,
    ...group,
  }));
}

export function DepositSlotsEditor({ editionId, disabled = false, onSyncBilletweb }: DepositSlotsEditorProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [participantsSlot, setParticipantsSlot] = useState<DepositSlot | null>(null);

  const [newSlot, setNewSlot] = useState<CreateDepositSlotRequest>({
    startDatetime: '',
    endDatetime: '',
    maxCapacity: 20,
    reservedForLocals: false,
    description: '',
  });

  const { data: slotsResponse, isLoading } = useQuery({
    queryKey: ['deposit-slots', editionId],
    queryFn: () => depositSlotsApi.getDepositSlots(editionId),
  });

  const slots = slotsResponse?.items ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateDepositSlotRequest) =>
      depositSlotsApi.createDepositSlot(editionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', editionId] });
      setIsAdding(false);
      setError(null);
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
      startDatetime: `${newSlot.startDatetime}:00`,
      endDatetime: `${newSlot.endDatetime}:00`,
    });
  };

  const dayGroups = groupSlotsByDay(slots);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-md font-medium text-gray-900 whitespace-nowrap">
          Créneaux de dépôt
          {slots.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">({slots.length})</span>
          )}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {onSyncBilletweb && (
            <Button size="sm" variant="outline" onClick={onSyncBilletweb}>
              Synchroniser créneaux Billetweb
            </Button>
          )}
          {!disabled && !isAdding && (
            <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
              + Ajouter un créneau
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-sm text-gray-500">Chargement des créneaux...</div>
      ) : slots.length === 0 && !isAdding ? (
        <div className="text-sm text-gray-500 italic">
          Aucun créneau de dépôt configuré.
        </div>
      ) : (
        <div className="space-y-4">
          {dayGroups.map((group) => (
            <div key={group.dayKey}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-800 capitalize">{group.label}</span>
                <span className="text-xs text-gray-400">{group.slots.length} créneaux</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {group.slots.map((slot) => (
                  <CompactSlotChip
                    key={slot.id}
                    slot={slot}
                    onShowParticipants={() => setParticipantsSlot(slot)}
                    onDelete={() => setSlotToDelete(slot.id)}
                    disabled={disabled || deleteMutation.isPending}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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

      <ConfirmModal
        isOpen={!!slotToDelete}
        onClose={() => setSlotToDelete(null)}
        onConfirm={() => {
          if (slotToDelete) {
            deleteMutation.mutate(slotToDelete);
            setSlotToDelete(null);
          }
        }}
        title="Supprimer le créneau"
        message="Supprimer ce créneau de dépôt ?"
        variant="danger"
        confirmLabel="Supprimer"
        isLoading={deleteMutation.isPending}
      />

      <Modal
        isOpen={!!participantsSlot}
        onClose={() => setParticipantsSlot(null)}
        title={participantsSlot
          ? `Participants — ${formatTime(participantsSlot.startDatetime)} - ${formatTime(participantsSlot.endDatetime)}`
          : 'Participants'}
        size="sm"
      >
        {participantsSlot && (
          <SlotParticipants editionId={editionId} slotId={participantsSlot.id} />
        )}
      </Modal>
    </div>
  );
}

function CompactSlotChip({
  slot,
  onShowParticipants,
  onDelete,
  disabled,
}: {
  slot: DepositSlot;
  onShowParticipants: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const count = slot.registeredCount ?? 0;
  const ratio = slot.maxCapacity > 0 ? count / slot.maxCapacity : 0;
  let occupancyClass = 'text-gray-500';
  if (ratio >= 0.9) occupancyClass = 'text-red-600 font-medium';
  else if (ratio >= 0.75) occupancyClass = 'text-orange-600 font-medium';

  return (
    <div className="group relative bg-white border border-gray-200 rounded-md px-3 py-2 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">
          {formatTime(slot.startDatetime)} - {formatTime(slot.endDatetime)}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity -mr-1"
            title="Supprimer"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className={`text-xs ${occupancyClass}`}>
          {count}/{slot.maxCapacity ?? 0} places
        </span>
        {count > 0 && (
          <button
            type="button"
            onClick={onShowParticipants}
            className="text-blue-500 hover:text-blue-700 transition-colors"
            title="Voir les participants"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </button>
        )}
        {slot.reservedForLocals && (
          <span className="text-xs text-purple-700 bg-purple-50 px-1 rounded">local</span>
        )}
      </div>
    </div>
  );
}

function SlotParticipants({ editionId, slotId }: { editionId: string; slotId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['slot-participants', editionId, slotId],
    queryFn: () => billetwebApi.listDepositors(editionId, { slotId, limit: 100 }),
  });

  if (isLoading) {
    return <div className="text-sm text-gray-400">Chargement...</div>;
  }

  const participants = data?.items ?? [];

  if (participants.length === 0) {
    return <div className="text-sm text-gray-400 italic">Aucun participant</div>;
  }

  return (
    <ul className="space-y-1">
      {participants.map((p) => (
        <li key={p.id} className="flex items-center justify-between text-sm">
          <span className="text-gray-900 font-medium">
            {p.userFirstName} {p.userLastName.toUpperCase()}
          </span>
          {p.userEmail && (
            <span className="text-gray-400 text-xs ml-2 truncate">{p.userEmail}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
