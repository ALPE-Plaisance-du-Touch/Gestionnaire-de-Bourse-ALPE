import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, ApiException } from '@/api';
import { Button, Input, Modal } from '@/components/ui';

interface EditionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditionCreateModal({ isOpen, onClose }: EditionCreateModalProps) {
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createMutation = useMutation({
    mutationFn: editionsApi.createEdition,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      setSuccess(true);
      setError(null);
    },
    onError: (err) => {
      if (err instanceof ApiException) {
        if (err.status === 409) {
          setError('Une édition avec ce nom existe déjà.');
        } else if (err.status === 422) {
          setError('Données invalides. Vérifiez que la date de fin est après la date de début.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    },
  });

  const resetForm = () => {
    setName('');
    setStartDatetime('');
    setEndDatetime('');
    setLocation('');
    setDescription('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('Le nom de l\'édition est requis.');
      return;
    }

    if (!startDatetime || !endDatetime) {
      setError('Les dates de début et de fin sont requises.');
      return;
    }

    const start = new Date(startDatetime);
    const end = new Date(endDatetime);

    if (end <= start) {
      setError('La date de fin doit être après la date de début.');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      startDatetime: new Date(startDatetime).toISOString(),
      endDatetime: new Date(endDatetime).toISOString(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  const handleCreateAnother = () => {
    resetForm();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Nouvelle édition" size="lg">
      {success ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Édition créée avec succès !</p>
            <p className="text-sm mt-1">
              L'édition <strong>{name}</strong> a été créée en statut brouillon.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Fermer
            </Button>
            <Button onClick={handleCreateAnother}>Créer une autre édition</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <Input
            label="Nom de l'édition"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bourse Printemps 2025"
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Date et heure de début"
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              required
            />
            <Input
              label="Date et heure de fin"
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
              required
            />
          </div>

          <Input
            label="Lieu"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Salle des fêtes de Plaisance du Touch"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle de l'édition..."
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            />
          </div>

          <p className="text-sm text-gray-500">
            L'édition sera créée en statut "Brouillon". Vous pourrez ensuite la configurer
            avant d'ouvrir les inscriptions.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !name || !startDatetime || !endDatetime}
              isLoading={createMutation.isPending}
            >
              Créer l'édition
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
