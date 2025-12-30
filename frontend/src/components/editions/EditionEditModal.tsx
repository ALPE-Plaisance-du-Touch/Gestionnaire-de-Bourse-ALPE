import { useState, useEffect, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, ApiException } from '@/api';
import { Button, Input, Modal } from '@/components/ui';
import { DepositSlotsEditor } from './DepositSlotsEditor';
import type { Edition } from '@/types';

interface EditionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  edition: Edition | null;
}

/**
 * Format an ISO datetime string for datetime-local input.
 */
function formatDatetimeLocal(isoString: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  // Format: YYYY-MM-DDTHH:mm
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Validate chronological order of dates.
 * Returns error message if invalid, null if valid.
 */
function validateDateOrder(dates: {
  declarationDeadline: string;
  depositStart: string;
  depositEnd: string;
  saleStart: string;
  saleEnd: string;
  retrievalStart: string;
  retrievalEnd: string;
}): string | null {
  const {
    declarationDeadline,
    depositStart,
    depositEnd,
    saleStart,
    saleEnd,
    retrievalStart,
    retrievalEnd,
  } = dates;

  // If any required date is missing, skip validation (will be caught by required check)
  if (!declarationDeadline || !depositStart || !depositEnd || !saleStart || !saleEnd || !retrievalStart || !retrievalEnd) {
    return null;
  }

  const declDate = new Date(declarationDeadline);
  const depStart = new Date(depositStart);
  const depEnd = new Date(depositEnd);
  const salStart = new Date(saleStart);
  const salEnd = new Date(saleEnd);
  const retStart = new Date(retrievalStart);
  const retEnd = new Date(retrievalEnd);

  // Declaration deadline must be before deposit
  if (declDate >= depStart) {
    return 'La date limite de déclaration doit être avant le début du dépôt.';
  }

  // Deposit end must be after deposit start
  if (depEnd <= depStart) {
    return 'La fin du dépôt doit être après le début du dépôt.';
  }

  // Sale start must be after deposit end
  if (salStart < depEnd) {
    return 'Le début de la vente doit être après la fin du dépôt.';
  }

  // Sale end must be after sale start
  if (salEnd <= salStart) {
    return 'La fin de la vente doit être après le début de la vente.';
  }

  // Retrieval start must be after sale end
  if (retStart < salEnd) {
    return 'Le début de la récupération doit être après la fin de la vente.';
  }

  // Retrieval end must be after retrieval start
  if (retEnd <= retStart) {
    return 'La fin de la récupération doit être après le début de la récupération.';
  }

  return null;
}

export function EditionEditModal({ isOpen, onClose, edition }: EditionEditModalProps) {
  const queryClient = useQueryClient();

  // Basic info
  const [name, setName] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  // Configuration dates
  const [declarationDeadline, setDeclarationDeadline] = useState('');
  const [depositStartDatetime, setDepositStartDatetime] = useState('');
  const [depositEndDatetime, setDepositEndDatetime] = useState('');
  const [saleStartDatetime, setSaleStartDatetime] = useState('');
  const [saleEndDatetime, setSaleEndDatetime] = useState('');
  const [retrievalStartDatetime, setRetrievalStartDatetime] = useState('');
  const [retrievalEndDatetime, setRetrievalEndDatetime] = useState('');

  // Commission rate
  const [commissionRate, setCommissionRate] = useState('20');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form with edition data
  useEffect(() => {
    if (edition) {
      setName(edition.name);
      setStartDatetime(formatDatetimeLocal(edition.startDatetime));
      setEndDatetime(formatDatetimeLocal(edition.endDatetime));
      setLocation(edition.location || '');
      setDescription(edition.description || '');
      setDeclarationDeadline(formatDatetimeLocal(edition.declarationDeadline));
      setDepositStartDatetime(formatDatetimeLocal(edition.depositStartDatetime));
      setDepositEndDatetime(formatDatetimeLocal(edition.depositEndDatetime));
      setSaleStartDatetime(formatDatetimeLocal(edition.saleStartDatetime));
      setSaleEndDatetime(formatDatetimeLocal(edition.saleEndDatetime));
      setRetrievalStartDatetime(formatDatetimeLocal(edition.retrievalStartDatetime));
      setRetrievalEndDatetime(formatDatetimeLocal(edition.retrievalEndDatetime));
      setCommissionRate(edition.commissionRate !== null ? String(edition.commissionRate * 100) : '20');
      setError(null);
      setSuccess(false);
    }
  }, [edition]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof editionsApi.updateEdition>[1]) =>
      editionsApi.updateEdition(edition!.id, data),
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
          setError('Données invalides. Vérifiez les informations saisies.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Une erreur inattendue est survenue. Veuillez réessayer.');
      }
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: 'configured') =>
      editionsApi.updateEditionStatus(edition!.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
    },
  });

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!edition) return;

    // Validate name
    if (!name.trim()) {
      setError("Le nom de l'édition est requis.");
      return;
    }

    // Validate basic dates
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

    // Validate commission rate
    const commissionNum = parseFloat(commissionRate);
    if (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      setError('Le taux de commission doit être entre 0 et 100%.');
      return;
    }

    // Check if all configuration dates are provided for validation
    const hasAllConfigDates =
      declarationDeadline &&
      depositStartDatetime &&
      depositEndDatetime &&
      saleStartDatetime &&
      saleEndDatetime &&
      retrievalStartDatetime &&
      retrievalEndDatetime;

    // Validate chronological order if all dates are provided
    if (hasAllConfigDates) {
      const dateError = validateDateOrder({
        declarationDeadline,
        depositStart: depositStartDatetime,
        depositEnd: depositEndDatetime,
        saleStart: saleStartDatetime,
        saleEnd: saleEndDatetime,
        retrievalStart: retrievalStartDatetime,
        retrievalEnd: retrievalEndDatetime,
      });

      if (dateError) {
        setError(dateError);
        return;
      }
    }

    // Build update payload
    const updateData: Parameters<typeof editionsApi.updateEdition>[1] = {
      name: name.trim(),
      startDatetime: new Date(startDatetime).toISOString(),
      endDatetime: new Date(endDatetime).toISOString(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      commissionRate: commissionNum / 100,
    };

    // Add configuration dates if provided
    if (declarationDeadline) {
      updateData.declarationDeadline = new Date(declarationDeadline).toISOString();
    }
    if (depositStartDatetime) {
      updateData.depositStartDatetime = new Date(depositStartDatetime).toISOString();
    }
    if (depositEndDatetime) {
      updateData.depositEndDatetime = new Date(depositEndDatetime).toISOString();
    }
    if (saleStartDatetime) {
      updateData.saleStartDatetime = new Date(saleStartDatetime).toISOString();
    }
    if (saleEndDatetime) {
      updateData.saleEndDatetime = new Date(saleEndDatetime).toISOString();
    }
    if (retrievalStartDatetime) {
      updateData.retrievalStartDatetime = new Date(retrievalStartDatetime).toISOString();
    }
    if (retrievalEndDatetime) {
      updateData.retrievalEndDatetime = new Date(retrievalEndDatetime).toISOString();
    }

    try {
      await updateMutation.mutateAsync(updateData);

      // If all configuration dates are set and edition is draft, change status to configured
      if (hasAllConfigDates && edition.status === 'draft') {
        await statusMutation.mutateAsync('configured');
      }
    } catch {
      // Error handled by mutation
    }
  };

  const isConfigured = edition?.status !== 'draft';
  const isPending = updateMutation.isPending || statusMutation.isPending;

  // Check if edition can be edited (not closed or archived)
  const isEditable = edition && !['closed', 'archived'].includes(edition.status);

  if (!edition) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Modifier : ${edition.name}`}
      size="xl"
    >
      {success ? (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Modifications enregistrées !</p>
            <p className="text-sm mt-1">
              {statusMutation.isSuccess
                ? "L'édition est maintenant configurée et prête pour l'import des inscriptions."
                : "Les modifications ont été enregistrées avec succès."}
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Fermer</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!isEditable && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              Cette édition est clôturée et ne peut plus être modifiée.
            </div>
          )}

          {/* Basic Information */}
          <fieldset disabled={!isEditable} className="space-y-4">
            <legend className="text-lg font-medium text-gray-900 mb-2">
              Informations générales
            </legend>

            <Input
              label="Nom de l'édition"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bourse Printemps 2025"
              required
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
                rows={2}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
              />
            </div>
          </fieldset>

          {/* Configuration Section */}
          <fieldset disabled={!isEditable} className="space-y-4 border-t pt-6">
            <legend className="text-lg font-medium text-gray-900 mb-2">
              Configuration de l'édition
            </legend>

            <p className="text-sm text-gray-500 mb-4">
              Définissez les dates clés et le taux de commission.
              {!isConfigured && " Une fois toutes les dates renseignées, l'édition passera en statut \"Configurée\"."}
            </p>

            {/* Commission Rate */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="max-w-xs">
                <Input
                  label="Taux de commission ALPE (%)"
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  placeholder="20"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Commission prélevée sur les ventes (par défaut 20%).
                Les frais d'inscription (5€ pour 2 listes) sont gérés via Billetweb.
              </p>
            </div>

            {/* Declaration Deadline */}
            <div>
              <Input
                label="Date limite de déclaration des articles"
                type="datetime-local"
                value={declarationDeadline}
                onChange={(e) => setDeclarationDeadline(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Après cette date, les déposants ne pourront plus modifier leurs listes.
              </p>
            </div>

            {/* Deposit Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Début du dépôt"
                type="datetime-local"
                value={depositStartDatetime}
                onChange={(e) => setDepositStartDatetime(e.target.value)}
              />
              <Input
                label="Fin du dépôt"
                type="datetime-local"
                value={depositEndDatetime}
                onChange={(e) => setDepositEndDatetime(e.target.value)}
              />
            </div>

            {/* Deposit Slots */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <DepositSlotsEditor editionId={edition.id} disabled={!isEditable} />
            </div>

            {/* Sale Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Début de la vente"
                type="datetime-local"
                value={saleStartDatetime}
                onChange={(e) => setSaleStartDatetime(e.target.value)}
              />
              <Input
                label="Fin de la vente"
                type="datetime-local"
                value={saleEndDatetime}
                onChange={(e) => setSaleEndDatetime(e.target.value)}
              />
            </div>

            {/* Retrieval Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Début de la récupération"
                type="datetime-local"
                value={retrievalStartDatetime}
                onChange={(e) => setRetrievalStartDatetime(e.target.value)}
              />
              <Input
                label="Fin de la récupération"
                type="datetime-local"
                value={retrievalEndDatetime}
                onChange={(e) => setRetrievalEndDatetime(e.target.value)}
              />
            </div>
          </fieldset>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
            <strong>Statut actuel :</strong>{' '}
            {edition.status === 'draft'
              ? 'Brouillon - Configurez les dates pour passer en statut "Configurée"'
              : edition.status === 'configured'
              ? 'Configurée - Prête pour l\'import des inscriptions'
              : edition.status === 'registrations_open'
              ? 'Inscriptions ouvertes'
              : edition.status === 'in_progress'
              ? 'En cours'
              : edition.status === 'closed'
              ? 'Clôturée'
              : 'Archivée'}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isEditable}
              isLoading={isPending}
            >
              Enregistrer
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
