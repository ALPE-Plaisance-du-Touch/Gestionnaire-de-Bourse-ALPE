import { useQuery } from '@tanstack/react-query';
import { billetwebApiSettings } from '@/api/billetweb-api';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { BilletwebEventInfo } from '@/types';

interface BilletwebEventSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: BilletwebEventInfo) => void;
}

export function BilletwebEventSelectModal({
  isOpen,
  onClose,
  onSelect,
}: BilletwebEventSelectModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['billetweb-events'],
    queryFn: () => billetwebApiSettings.listEvents(),
    enabled: isOpen,
  });

  const events = data?.events ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importer depuis Billetweb" size="lg">
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">Chargement des événements...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          Erreur lors du chargement des événements Billetweb.
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun événement trouvé sur votre compte Billetweb.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event)}
              className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-medium text-gray-900">{event.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {event.start && event.end && (
                  <span>
                    {event.start} &mdash; {event.end}
                  </span>
                )}
                {event.location && (
                  <span className="ml-3">{event.location}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-1">ID: {event.id}</div>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t mt-4">
        <Button variant="outline" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </Modal>
  );
}
