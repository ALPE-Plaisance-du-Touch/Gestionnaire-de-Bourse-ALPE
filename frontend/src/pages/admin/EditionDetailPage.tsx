import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, billetwebApi, depositSlotsApi, payoutsApi, usersApi, ApiException } from '@/api';
import { Button, ConfirmModal, Input, Modal, Select } from '@/components/ui';
import { DepositSlotsEditor } from '@/components/editions';
import { BilletwebSessionsSyncModal } from '@/components/billetweb/BilletwebSessionsSyncModal';
import { BilletwebAttendeesSyncModal } from '@/components/billetweb/BilletwebAttendeesSyncModal';
import { useAuth } from '@/contexts/AuthContext';
import type { EditionStatus, User } from '@/types';

const STATUS_LABELS: Record<EditionStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-800' },
  configured: { label: 'Configuré', className: 'bg-blue-100 text-blue-800' },
  registrations_open: { label: 'Inscriptions ouvertes', className: 'bg-purple-100 text-purple-800' },
  in_progress: { label: 'En cours', className: 'bg-green-100 text-green-800' },
  closed: { label: 'Clôturé', className: 'bg-orange-100 text-orange-800' },
  archived: { label: 'Archivé', className: 'bg-gray-100 text-gray-500' },
};

/**
 * Format a datetime string for datetime-local input.
 * Backend stores dates without timezone info, so we parse directly without conversion.
 * Input format: "2025-03-15T09:00:00" or "2025-03-15T09:00:00Z"
 * Output format: "2025-03-15T09:00"
 */
function formatDatetimeLocal(datetimeString: string | null): string {
  if (!datetimeString) return '';
  // Remove timezone suffix if present and take first 16 chars (YYYY-MM-DDTHH:mm)
  return datetimeString.replace('Z', '').substring(0, 16);
}

type FieldError = { field: string; message: string };

/**
 * Validate chronological order of dates.
 * Returns {field, message} if invalid, null if valid.
 */
function validateDateOrder(dates: {
  declarationDeadline: string;
  depositStart: string;
  depositEnd: string;
  editionEnd: string;
  retrievalStart: string;
  retrievalEnd: string;
}): FieldError | null {
  const {
    declarationDeadline,
    depositStart,
    depositEnd,
    editionEnd,
    retrievalStart,
    retrievalEnd,
  } = dates;

  if (!declarationDeadline || !depositStart || !depositEnd || !retrievalStart || !retrievalEnd) {
    return null;
  }

  const declDate = new Date(declarationDeadline);
  const depStart = new Date(depositStart);
  const depEnd = new Date(depositEnd);
  const retStart = new Date(retrievalStart);
  const retEnd = new Date(retrievalEnd);

  if (declDate >= depStart) {
    return { field: 'declarationDeadline', message: 'La date limite de déclaration doit être avant le début du dépôt.' };
  }
  if (depEnd <= depStart) {
    return { field: 'depositEnd', message: 'La fin du dépôt doit être après le début du dépôt.' };
  }
  if (editionEnd) {
    const edEnd = new Date(editionEnd);
    if (retStart < edEnd) {
      return { field: 'retrievalStart', message: 'Le début de la récupération doit être après la fin de la vente.' };
    }
  }
  if (retEnd <= retStart) {
    return { field: 'retrievalEnd', message: 'La fin de la récupération doit être après le début de la récupération.' };
  }

  return null;
}

export function EditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'administrator';

  // Form state
  const [name, setName] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [declarationDeadline, setDeclarationDeadline] = useState('');
  const [depositStartDatetime, setDepositStartDatetime] = useState('');
  const [depositEndDatetime, setDepositEndDatetime] = useState('');
  const [retrievalStartDatetime, setRetrievalStartDatetime] = useState('');
  const [retrievalEndDatetime, setRetrievalEndDatetime] = useState('');
  const [commissionRate, setCommissionRate] = useState('20');

  // UI state
  const errorRef = useRef<HTMLDivElement>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [showSessionsSyncModal, setShowSessionsSyncModal] = useState(false);
  const [showAttendeesSyncModal, setShowAttendeesSyncModal] = useState(false);
  const [showInvitationsConfirm, setShowInvitationsConfirm] = useState(false);
  const [showOpenRegistrationsConfirm, setShowOpenRegistrationsConfirm] = useState(false);
  const [showRevertToConfiguredConfirm, setShowRevertToConfiguredConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManualDepositorModal, setShowManualDepositorModal] = useState(false);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Scroll to first field error or global error
  useEffect(() => {
    const firstErrorField = Object.keys(fieldErrors)[0];
    if (firstErrorField) {
      const el = document.querySelector(`[data-field="${firstErrorField}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (error) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fieldErrors, error]);

  // Fetch edition
  const { data: edition, isLoading, error: fetchError } = useQuery({
    queryKey: ['edition', id],
    queryFn: () => editionsApi.getEdition(id!),
    enabled: !!id,
  });

  // Fetch import stats for configured editions
  const { data: importStats, refetch: refetchImportStats } = useQuery({
    queryKey: ['billetweb-stats', id],
    queryFn: () => billetwebApi.getImportStats(id!),
    enabled: !!id && (edition?.status === 'configured' || edition?.status === 'registrations_open'),
  });

  // Sync form state when edition data changes (initial load or after save)
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
      setRetrievalStartDatetime(formatDatetimeLocal(edition.retrievalStartDatetime));
      setRetrievalEndDatetime(formatDatetimeLocal(edition.retrievalEndDatetime));
      setCommissionRate(edition.commissionRate !== null ? String(edition.commissionRate * 100) : '20');
    }
  }, [edition]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof editionsApi.updateEdition>[1]) =>
      editionsApi.updateEdition(id!, data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      await queryClient.refetchQueries({ queryKey: ['edition', id] });
      setSuccess(true);
      setError(null);
      setFieldErrors({});
    },
    onError: (err) => {
      if (err instanceof ApiException) {
        if (err.status === 409) {
          setFieldErrors({ name: 'Une édition avec ce nom existe déjà.' });
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
      editionsApi.updateEditionStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
      queryClient.invalidateQueries({ queryKey: ['active-edition'] });
    },
  });

  const { data: closureCheck, isLoading: isClosureCheckLoading } = useQuery({
    queryKey: ['closure-check', id],
    queryFn: () => editionsApi.getClosureCheck(id!),
    enabled: closureModalOpen && !!id,
  });

  const closureMutation = useMutation({
    mutationFn: () => editionsApi.closeEdition(id!),
    onSuccess: () => {
      setClosureModalOpen(false);
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
      queryClient.invalidateQueries({ queryKey: ['active-edition'] });
    },
    onError: (err) => {
      setClosureModalOpen(false);
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de la clôture.');
      }
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => editionsApi.archiveEdition(id!),
    onSuccess: () => {
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
    },
    onError: (err) => {
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de l'archivage.");
      }
    },
  });

  const sendInvitationsMutation = useMutation({
    mutationFn: () => editionsApi.sendInvitations(id!),
    onSuccess: () => {
      setShowInvitationsConfirm(false);
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['billetweb-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
      queryClient.invalidateQueries({ queryKey: ['active-edition'] });
    },
    onError: (err) => {
      setShowInvitationsConfirm(false);
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de l'envoi des invitations.");
      }
    },
  });

  const openRegistrationsMutation = useMutation({
    mutationFn: () => editionsApi.openRegistrations(id!),
    onSuccess: () => {
      setShowOpenRegistrationsConfirm(false);
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
      queryClient.invalidateQueries({ queryKey: ['active-edition'] });
    },
    onError: (err) => {
      setShowOpenRegistrationsConfirm(false);
      if (err instanceof ApiException) {
        if (err.status === 409) {
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError("Une erreur est survenue lors de l'ouverture des inscriptions.");
      }
    },
  });

  const revertToConfiguredMutation = useMutation({
    mutationFn: () => editionsApi.updateEditionStatus(id!, 'configured'),
    onSuccess: () => {
      setShowRevertToConfiguredConfirm(false);
      setSuccess(true);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
      queryClient.invalidateQueries({ queryKey: ['active-edition'] });
    },
    onError: (err) => {
      setShowRevertToConfiguredConfirm(false);
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors du retour en configuration.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => editionsApi.deleteEdition(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      navigate('/editions');
    },
    onError: (err) => {
      setShowDeleteConfirm(false);
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue lors de la suppression.");
      }
    },
  });

  // Manual depositor form state
  const [manualDepositorForm, setManualDepositorForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    depositSlotId: '',
    listType: 'standard',
    postalCode: '',
    city: '',
  });
  const [manualDepositorError, setManualDepositorError] = useState<string | null>(null);
  const [depositorMode, setDepositorMode] = useState<'new' | 'existing'>('new');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedUserSearch(userSearch), 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const { data: userSearchResults, isLoading: isSearchingUsers } = useQuery({
    queryKey: ['user-search', debouncedUserSearch],
    queryFn: () => usersApi.listUsers({ search: debouncedUserSearch, limit: 5 }),
    enabled: !!debouncedUserSearch && debouncedUserSearch.length >= 2 && depositorMode === 'existing' && !selectedUser,
  });

  const { data: depositSlots } = useQuery({
    queryKey: ['deposit-slots', id],
    queryFn: () => depositSlotsApi.getDepositSlots(id!),
    enabled: !!id && showManualDepositorModal,
  });

  const manualDepositorMutation = useMutation({
    mutationFn: () => billetwebApi.createManualDepositor(id!, {
      email: manualDepositorForm.email,
      firstName: manualDepositorForm.firstName,
      lastName: manualDepositorForm.lastName,
      phone: manualDepositorForm.phone || undefined,
      depositSlotId: manualDepositorForm.depositSlotId,
      listType: manualDepositorForm.listType as 'standard' | 'list_1000' | 'list_2000',
      postalCode: manualDepositorForm.postalCode || undefined,
      city: manualDepositorForm.city || undefined,
    }),
    onSuccess: () => {
      setShowManualDepositorModal(false);
      setManualDepositorForm({ email: '', firstName: '', lastName: '', phone: '', depositSlotId: '', listType: 'standard', postalCode: '', city: '' });
      setManualDepositorError(null);
      setDepositorMode('new');
      setUserSearch('');
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ['billetweb-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', id] });
    },
    onError: (err) => {
      if (err instanceof ApiException) {
        setManualDepositorError(err.message);
      } else {
        setManualDepositorError("Une erreur est survenue lors de l'ajout du déposant.");
      }
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError(null);
    setSuccess(false);

    if (!edition) return;

    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Le nom de l'édition est requis.";
    }

    if (!startDatetime || !endDatetime) {
      errors.endDatetime = 'Les dates de début et de fin sont requises.';
    } else {
      const start = new Date(startDatetime);
      const end = new Date(endDatetime);
      if (end <= start) {
        errors.endDatetime = 'La date de fin doit être après la date de début.';
      }
    }

    const commissionNum = parseFloat(commissionRate);
    if (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      errors.commissionRate = 'Le taux de commission doit être entre 0 et 100%.';
    }

    const hasAllConfigDates =
      declarationDeadline &&
      depositStartDatetime &&
      depositEndDatetime &&
      retrievalStartDatetime &&
      retrievalEndDatetime;

    if (hasAllConfigDates) {
      const dateError = validateDateOrder({
        declarationDeadline,
        depositStart: depositStartDatetime,
        depositEnd: depositEndDatetime,
        editionEnd: endDatetime,
        retrievalStart: retrievalStartDatetime,
        retrievalEnd: retrievalEndDatetime,
      });

      if (dateError) {
        errors[dateError.field] = dateError.message;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Send dates as-is (local time) - backend stores without timezone
    // Format: "2025-03-15T09:00" -> "2025-03-15T09:00:00"
    const formatLocalDatetime = (dt: string) => dt ? `${dt}:00` : undefined;

    const updateData: Parameters<typeof editionsApi.updateEdition>[1] = {
      name: name.trim(),
      startDatetime: formatLocalDatetime(startDatetime)!,
      endDatetime: formatLocalDatetime(endDatetime)!,
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      commissionRate: commissionNum / 100,
    };

    if (declarationDeadline) {
      updateData.declarationDeadline = formatLocalDatetime(declarationDeadline);
    }
    if (depositStartDatetime) {
      updateData.depositStartDatetime = formatLocalDatetime(depositStartDatetime);
    }
    if (depositEndDatetime) {
      updateData.depositEndDatetime = formatLocalDatetime(depositEndDatetime);
    }
    if (retrievalStartDatetime) {
      updateData.retrievalStartDatetime = formatLocalDatetime(retrievalStartDatetime);
    }
    if (retrievalEndDatetime) {
      updateData.retrievalEndDatetime = formatLocalDatetime(retrievalEndDatetime);
    }

    try {
      await updateMutation.mutateAsync(updateData);

      if (hasAllConfigDates && edition.status === 'draft') {
        try {
          await statusMutation.mutateAsync('configured');
        } catch (err) {
          if (err instanceof ApiException) {
            setError(err.message);
          } else {
            setError('Les modifications ont été enregistrées, mais le passage en statut "Configurée" a échoué.');
          }
        }
      }
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (fetchError || !edition) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          Édition introuvable ou erreur lors du chargement.
        </div>
        <Link to="/editions" className="text-blue-600 hover:text-blue-700">
          ← Retour à la liste des éditions
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[edition.status];
  const isEditable = !['closed', 'archived'].includes(edition.status);
  const isPending = updateMutation.isPending || statusMutation.isPending;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/editions"
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux éditions
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{edition.name}</h1>
            <p className="mt-1 text-gray-600">
              Configurez les dates clés et les créneaux de dépôt.
            </p>
          </div>
          <span className={`inline-flex self-start sm:self-auto px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Modifications enregistrées !</p>
          <p className="text-sm mt-1">
            {statusMutation.isSuccess
              ? "L'édition est maintenant configurée et prête pour l'import des inscriptions."
              : "Les modifications ont été enregistrées avec succès."}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div ref={errorRef} className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Not editable warning */}
      {!isEditable && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          Cette édition est clôturée et ne peut plus être modifiée.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Informations générales
            </h2>
            {edition.billetwebEventId && (
              <a
                href={`https://www.billetweb.fr/bo/dashboard.php?event=${edition.billetwebEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                Voir sur Billetweb
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          <fieldset disabled={!isEditable} className="space-y-4">
            <div data-field="name">
              <Input
                label="Nom de l'édition"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bourse Printemps 2025"
                required
                error={fieldErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Date et heure de début"
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                required
              />
              <div data-field="endDatetime">
                <Input
                  label="Date et heure de fin"
                  type="datetime-local"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  required
                  error={fieldErrors.endDatetime}
                />
              </div>
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
        </section>

        {/* Configuration Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Configuration de l'édition
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Définissez les dates clés et le taux de commission.
            {edition.status === 'draft' && " Une fois toutes les dates renseignées, l'édition passera en statut \"Configurée\"."}
          </p>

          <fieldset disabled={!isEditable} className="space-y-6">
            {/* Commission Rate */}
            <div className="bg-gray-50 p-4 rounded-lg" data-field="commissionRate">
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
                  error={fieldErrors.commissionRate}
                />
              </div>
              {!fieldErrors.commissionRate && (
                <p className="text-xs text-gray-500 mt-2">
                  Commission prélevée sur les ventes (par défaut 20%).
                  Les frais d'inscription (5€ pour 2 listes) sont gérés via Billetweb.
                </p>
              )}
            </div>

            {/* Declaration Deadline */}
            <div data-field="declarationDeadline">
              <Input
                label="Date limite de déclaration des articles"
                type="datetime-local"
                value={declarationDeadline}
                onChange={(e) => setDeclarationDeadline(e.target.value)}
                error={fieldErrors.declarationDeadline}
              />
              {!fieldErrors.declarationDeadline && (
                <p className="text-xs text-gray-500 mt-1">
                  Après cette date, les déposants ne pourront plus modifier leurs listes.
                </p>
              )}
            </div>

            {/* Deposit Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Période de dépôt</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Début du dépôt"
                  type="datetime-local"
                  value={depositStartDatetime}
                  onChange={(e) => setDepositStartDatetime(e.target.value)}
                />
                <div data-field="depositEnd">
                  <Input
                    label="Fin du dépôt"
                    type="datetime-local"
                    value={depositEndDatetime}
                    onChange={(e) => setDepositEndDatetime(e.target.value)}
                    error={fieldErrors.depositEnd}
                  />
                </div>
              </div>
            </div>

            {/* Retrieval Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Période de récupération</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div data-field="retrievalStart">
                  <Input
                    label="Début de la récupération"
                    type="datetime-local"
                    value={retrievalStartDatetime}
                    onChange={(e) => setRetrievalStartDatetime(e.target.value)}
                    error={fieldErrors.retrievalStart}
                  />
                </div>
                <div data-field="retrievalEnd">
                  <Input
                    label="Fin de la récupération"
                    type="datetime-local"
                    value={retrievalEndDatetime}
                    onChange={(e) => setRetrievalEndDatetime(e.target.value)}
                    error={fieldErrors.retrievalEnd}
                  />
                </div>
              </div>
            </div>
          </fieldset>
        </section>

        {/* Deposit Slots Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <DepositSlotsEditor
            editionId={edition.id}
            disabled={!isEditable}
            onSyncBilletweb={edition.billetwebEventId && isEditable ? () => setShowSessionsSyncModal(true) : undefined}
          />
        </section>

        {/* Billetweb Import Section - For configured and registrations_open editions */}
        {(edition.status === 'configured' || edition.status === 'registrations_open') && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Inscriptions Billetweb
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Importez les inscriptions depuis Billetweb pour associer les déposants à cette édition.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {edition.billetwebEventId && (
                <Button
                  size="sm"
                  onClick={() => setShowAttendeesSyncModal(true)}
                >
                  Synchroniser via API
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowManualDepositorModal(true)}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Ajouter un déposant
              </Button>
            </div>
            {edition.billetwebEventId && edition.lastBilletwebSync && (
              <p className="text-xs text-gray-500 mt-2">
                Derniere sync API : {new Date(edition.lastBilletwebSync).toLocaleString('fr-FR')}
              </p>
            )}

            {importStats && importStats.totalDepositors > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Historique des imports</h4>
                  <Link
                    to={`/editions/${edition.id}/depositors`}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Voir les déposants
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Déposants inscrits</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.totalDepositors}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Imports effectués</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.totalImports}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lignes importées</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.totalImported}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Invitations en attente</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.pendingInvitations ?? 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Workflow actions: send invitations + open registrations */}
            {importStats && importStats.totalDepositors > 0 && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                {/* Send invitations button: admin only when configured, manager+ when registrations_open */}
                {(edition.status === 'registrations_open' || isAdmin) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => setShowInvitationsConfirm(true)}
                    disabled={sendInvitationsMutation.isPending || (importStats.pendingInvitations ?? 0) === 0}
                    isLoading={sendInvitationsMutation.isPending}
                  >
                    {edition.status === 'configured'
                      ? `Envoyer les invitations et ouvrir (${importStats.pendingInvitations ?? 0})`
                      : `Envoyer les invitations (${importStats.pendingInvitations ?? 0})`
                    }
                  </Button>
                )}
                {/* Silent open registrations: admin only, configured status only */}
                {isAdmin && edition.status === 'configured' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setShowOpenRegistrationsConfirm(true)}
                    disabled={openRegistrationsMutation.isPending}
                    isLoading={openRegistrationsMutation.isPending}
                  >
                    Ouvrir les inscriptions (sans notification)
                  </Button>
                )}
              </div>
            )}
          </section>
        )}

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

        {/* Label generation link */}
        {(edition.status === 'registrations_open' || edition.status === 'in_progress') && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Étiquettes</h3>
                <p className="text-sm text-gray-500">Générez les étiquettes PDF pour les listes validées.</p>
              </div>
              <Link
                to={`/editions/${edition.id}/labels`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Gestion des étiquettes
              </Link>
            </div>
          </div>
        )}

        {/* Revert to configured */}
        {edition.status === 'registrations_open' && isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yellow-900">Revenir en configuration</h3>
                <p className="text-sm text-yellow-700">
                  Annuler l'ouverture des inscriptions et repasser l'édition en statut "Configurée".
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={revertToConfiguredMutation.isPending}
                isLoading={revertToConfiguredMutation.isPending}
                onClick={() => setShowRevertToConfiguredConfirm(true)}
              >
                Revenir en configuration
              </Button>
            </div>
          </div>
        )}

        {/* Sales & Stats links */}
        {edition.status === 'in_progress' && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Ventes</h3>
                <p className="text-sm text-gray-500">Accédez à la caisse, la gestion des ventes et aux statistiques en direct.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link
                  to={`/editions/${edition.id}/sales`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  Caisse
                </Link>
                <Link
                  to={`/editions/${edition.id}/sales/manage`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Gestion des ventes
                </Link>
                <Link
                  to={`/editions/${edition.id}/stats`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Stats en direct
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Payouts link */}
        {(edition.status === 'in_progress' || edition.status === 'closed') && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Reversements</h3>
                <p className="text-sm text-gray-500">Calculez et gérez les reversements aux déposants.</p>
              </div>
              <Link
                to={`/editions/${edition.id}/payouts`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Gestion des reversements
              </Link>
            </div>
          </div>
        )}

        {/* Closure section */}
        {edition.status === 'in_progress' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-900">Clôture de l'édition</h3>
                <p className="text-sm text-red-700">
                  La clôture est définitive et irréversible. Vérifiez les prérequis avant de confirmer.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => setClosureModalOpen(true)}
              >
                Clôturer l'édition
              </Button>
            </div>
          </div>
        )}

        {/* Closure modal */}
        <Modal
          isOpen={closureModalOpen}
          onClose={() => setClosureModalOpen(false)}
          title="Clôture de l'édition"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              La clôture est définitive et irréversible. L'édition passera en lecture seule.
            </div>

            <h3 className="text-sm font-semibold text-gray-900">Prérequis</h3>

            {isClosureCheckLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded" />
                ))}
              </div>
            ) : closureCheck ? (
              <ul className="space-y-2">
                {closureCheck.checks.map((check, i) => (
                  <li key={i} className="flex items-start gap-2">
                    {check.passed ? (
                      <svg className="w-5 h-5 text-green-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <div>
                      <span className={`text-sm font-medium ${check.passed ? 'text-green-800' : 'text-red-800'}`}>
                        {check.label}
                      </span>
                      {check.detail && (
                        <p className="text-xs text-gray-500">{check.detail}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setClosureModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={!closureCheck?.canClose || closureMutation.isPending}
                isLoading={closureMutation.isPending}
                onClick={() => closureMutation.mutate()}
              >
                Confirmer la clôture
              </Button>
            </div>
          </div>
        </Modal>

        {/* Closure report */}
        {edition.status === 'closed' && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Rapport de clôture</h3>
                <p className="text-sm text-gray-500">Télécharger le rapport PDF récapitulatif de l'édition.</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const blob = await payoutsApi.downloadClosureReport(edition.id);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Rapport_cloture_${edition.name.replace(/\s+/g, '_')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  } catch {
                    setError('Erreur lors du téléchargement du rapport de clôture.');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Rapport de clôture (PDF)
              </button>
            </div>
          </div>
        )}

        {/* Archive section */}
        {edition.status === 'closed' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Archivage</h3>
                <p className="text-sm text-gray-500">
                  Archiver cette édition pour la retirer de la liste active.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={archiveMutation.isPending}
                isLoading={archiveMutation.isPending}
                onClick={() => setShowArchiveConfirm(true)}
              >
                Archiver l'édition
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/editions')}
            >
              Annuler
            </Button>
            {isAdmin && (edition.status === 'draft' || edition.status === 'configured') && (
              <Button
                type="button"
                variant="danger"
                disabled={deleteMutation.isPending}
                isLoading={deleteMutation.isPending}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Supprimer l'édition
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={isPending || !isEditable}
            isLoading={isPending}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>

      {/* Archive confirmation modal */}
      <ConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={() => {
          setShowArchiveConfirm(false);
          archiveMutation.mutate();
        }}
        title="Archiver l'édition"
        message="Êtes-vous sûr de vouloir archiver cette édition ? Cette action est irréversible."
        variant="warning"
        confirmLabel="Archiver"
      />

      {/* Billetweb sessions sync modal */}
      {edition?.billetwebEventId && (
        <BilletwebSessionsSyncModal
          isOpen={showSessionsSyncModal}
          onClose={() => setShowSessionsSyncModal(false)}
          editionId={edition.id}
        />
      )}

      {/* Billetweb attendees sync modal */}
      {edition?.billetwebEventId && (
        <BilletwebAttendeesSyncModal
          isOpen={showAttendeesSyncModal}
          onClose={() => setShowAttendeesSyncModal(false)}
          editionId={edition.id}
          lastSync={edition.lastBilletwebSync}
        />
      )}

      {/* Manual depositor modal */}
      <Modal
        isOpen={showManualDepositorModal}
        onClose={() => {
          setShowManualDepositorModal(false);
          setManualDepositorError(null);
          setDepositorMode('new');
          setUserSearch('');
          setSelectedUser(null);
          setManualDepositorForm({ email: '', firstName: '', lastName: '', phone: '', depositSlotId: '', listType: 'standard', postalCode: '', city: '' });
        }}
        title="Inscrire un déposant"
      >
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${depositorMode === 'new' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setDepositorMode('new');
              setUserSearch('');
              setSelectedUser(null);
              setManualDepositorForm({ email: '', firstName: '', lastName: '', phone: '', depositSlotId: '', listType: 'standard', postalCode: '', city: '' });
              setManualDepositorError(null);
            }}
          >
            Nouveau
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${depositorMode === 'existing' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => {
              setDepositorMode('existing');
              setSelectedUser(null);
              setManualDepositorForm({ email: '', firstName: '', lastName: '', phone: '', depositSlotId: '', listType: 'standard', postalCode: '', city: '' });
              setManualDepositorError(null);
            }}
          >
            Existant
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); manualDepositorMutation.mutate(); }} className="space-y-4">
          {manualDepositorError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {manualDepositorError}
            </div>
          )}

          {depositorMode === 'existing' && (
            <>
              {!selectedUser ? (
                <div>
                  <Input
                    label="Rechercher un utilisateur"
                    placeholder="Nom ou email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                  {isSearchingUsers && (
                    <p className="text-sm text-gray-500 mt-2">Recherche...</p>
                  )}
                  {userSearchResults && userSearchResults.items.length > 0 && (
                    <ul className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {userSearchResults.items.map(user => (
                        <li key={user.id}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                            onClick={() => {
                              setSelectedUser(user);
                              setManualDepositorForm(f => ({
                                ...f,
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                phone: user.phone || '',
                              }));
                              setUserSearch('');
                            }}
                          >
                            <div>
                              <span className="font-medium text-sm">{user.firstName} {user.lastName}</span>
                              <span className="text-gray-500 text-sm ml-2">{user.email}</span>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{user.role}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {userSearchResults && userSearchResults.items.length === 0 && debouncedUserSearch.length >= 2 && (
                    <p className="text-sm text-gray-500 mt-2">Aucun utilisateur trouvé</p>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{selectedUser.firstName} {selectedUser.lastName}</span>
                    <span className="text-gray-600 text-sm ml-2">{selectedUser.email}</span>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setSelectedUser(null);
                      setManualDepositorForm(f => ({ ...f, email: '', firstName: '', lastName: '', phone: '' }));
                    }}
                  >
                    Changer
                  </button>
                </div>
              )}
            </>
          )}

          {depositorMode === 'new' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  required
                  value={manualDepositorForm.firstName}
                  onChange={(e) => setManualDepositorForm(f => ({ ...f, firstName: e.target.value }))}
                />
                <Input
                  label="Nom"
                  required
                  value={manualDepositorForm.lastName}
                  onChange={(e) => setManualDepositorForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <Input
                label="Email"
                type="email"
                required
                value={manualDepositorForm.email}
                onChange={(e) => setManualDepositorForm(f => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Téléphone"
                value={manualDepositorForm.phone}
                onChange={(e) => setManualDepositorForm(f => ({ ...f, phone: e.target.value }))}
              />
            </>
          )}

          <Select
            label="Créneau de dépôt"
            required
            value={manualDepositorForm.depositSlotId}
            onChange={(e) => setManualDepositorForm(f => ({ ...f, depositSlotId: e.target.value }))}
            placeholder="Sélectionner un créneau"
            options={
              depositSlots?.items.map(slot => ({
                value: slot.id,
                label: `${new Date(slot.startDatetime).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ${new Date(slot.startDatetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.endDatetime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} (${slot.registeredCount}/${slot.maxCapacity} places)`,
              })) ?? []
            }
          />
          <Select
            label="Type de liste"
            value={manualDepositorForm.listType}
            onChange={(e) => setManualDepositorForm(f => ({ ...f, listType: e.target.value }))}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'list_1000', label: 'Liste 1000' },
              { value: 'list_2000', label: 'Liste 2000' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code postal"
              value={manualDepositorForm.postalCode}
              onChange={(e) => setManualDepositorForm(f => ({ ...f, postalCode: e.target.value }))}
            />
            <Input
              label="Ville"
              value={manualDepositorForm.city}
              onChange={(e) => setManualDepositorForm(f => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowManualDepositorModal(false);
                setManualDepositorError(null);
                setDepositorMode('new');
                setUserSearch('');
                setSelectedUser(null);
                setManualDepositorForm({ email: '', firstName: '', lastName: '', phone: '', depositSlotId: '', listType: 'standard', postalCode: '', city: '' });
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={manualDepositorMutation.isPending || (depositorMode === 'existing' && !selectedUser)}
              isLoading={manualDepositorMutation.isPending}
            >
              Inscrire
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send invitations confirmation modal */}
      <Modal
        isOpen={showInvitationsConfirm}
        onClose={() => setShowInvitationsConfirm(false)}
        title={edition.status === 'configured' ? "Envoyer les invitations et ouvrir les inscriptions" : "Envoyer les invitations"}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            {edition.status === 'configured' ? (
              <>L'édition passera en statut <strong>Inscriptions ouvertes</strong> et les emails d'invitation seront envoyés aux déposants qui ne les ont pas encore reçus.</>
            ) : (
              <>Les emails d'invitation seront envoyés aux déposants qui ne les ont pas encore reçus.</>
            )}
          </p>
          {importStats && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p><strong>{importStats.pendingInvitations ?? 0}</strong> invitation(s) en attente d'envoi</p>
              <p className="text-xs text-blue-600 mt-1">
                Les nouveaux utilisateurs recevront un lien d'activation. Les utilisateurs existants recevront une notification.
              </p>
            </div>
          )}
          {edition.status === 'configured' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              Cette action n'est possible que si aucune autre édition n'est déjà active.
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowInvitationsConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={sendInvitationsMutation.isPending}
              isLoading={sendInvitationsMutation.isPending}
              onClick={() => sendInvitationsMutation.mutate()}
            >
              {edition.status === 'configured' ? "Confirmer et ouvrir" : "Envoyer les invitations"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Open registrations confirmation modal (silent, no notifications) */}
      <Modal
        isOpen={showOpenRegistrationsConfirm}
        onClose={() => setShowOpenRegistrationsConfirm(false)}
        title="Ouvrir les inscriptions (sans notification)"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            L'édition passera en statut <strong>Inscriptions ouvertes</strong> sans envoyer de notification aux déposants.
            Vous pourrez envoyer les invitations séparément.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Cette action n'est possible que si aucune autre édition n'est déjà active.
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOpenRegistrationsConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              disabled={openRegistrationsMutation.isPending}
              isLoading={openRegistrationsMutation.isPending}
              onClick={() => openRegistrationsMutation.mutate()}
            >
              Confirmer l'ouverture
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revert to configured confirmation modal */}
      <ConfirmModal
        isOpen={showRevertToConfiguredConfirm}
        onClose={() => setShowRevertToConfiguredConfirm(false)}
        onConfirm={() => {
          setShowRevertToConfiguredConfirm(false);
          revertToConfiguredMutation.mutate();
        }}
        title="Revenir en configuration"
        message="L'édition repassera en statut « Configurée ». Les déposants ne pourront plus déclarer leurs articles tant que les inscriptions ne seront pas ré-ouvertes."
        variant="warning"
        confirmLabel="Confirmer"
      />

      {/* Delete edition confirmation modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteMutation.mutate();
        }}
        title="Supprimer l'édition"
        message={`Êtes-vous sûr de vouloir supprimer l'édition « ${edition?.name} » ? Cette action est irréversible.`}
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
