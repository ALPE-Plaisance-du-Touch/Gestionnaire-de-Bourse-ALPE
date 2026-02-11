import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, billetwebApi, payoutsApi, ApiException } from '@/api';
import { Button, ConfirmModal, Input, Modal } from '@/components/ui';
import { DepositSlotsEditor } from '@/components/editions';
import { BilletwebImportButton } from '@/components/billetweb';
import type { EditionStatus } from '@/types';

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

  if (declDate >= depStart) {
    return 'La date limite de déclaration doit être avant le début du dépôt.';
  }
  if (depEnd <= depStart) {
    return 'La fin du dépôt doit être après le début du dépôt.';
  }
  if (salStart < depEnd) {
    return 'Le début de la vente doit être après la fin du dépôt.';
  }
  if (salEnd <= salStart) {
    return 'La fin de la vente doit être après le début de la vente.';
  }
  if (retStart < salEnd) {
    return 'Le début de la récupération doit être après la fin de la vente.';
  }
  if (retEnd <= retStart) {
    return 'La fin de la récupération doit être après le début de la récupération.';
  }

  return null;
}

export function EditionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form state
  const [name, setName] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [declarationDeadline, setDeclarationDeadline] = useState('');
  const [depositStartDatetime, setDepositStartDatetime] = useState('');
  const [depositEndDatetime, setDepositEndDatetime] = useState('');
  const [saleStartDatetime, setSaleStartDatetime] = useState('');
  const [saleEndDatetime, setSaleEndDatetime] = useState('');
  const [retrievalStartDatetime, setRetrievalStartDatetime] = useState('');
  const [retrievalEndDatetime, setRetrievalEndDatetime] = useState('');
  const [commissionRate, setCommissionRate] = useState('20');

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
    enabled: !!id && edition?.status === 'configured',
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
      setSaleStartDatetime(formatDatetimeLocal(edition.saleStartDatetime));
      setSaleEndDatetime(formatDatetimeLocal(edition.saleEndDatetime));
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
      editionsApi.updateEditionStatus(id!, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editions'] });
      queryClient.invalidateQueries({ queryKey: ['edition', id] });
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
    },
    onError: (err) => {
      setClosureModalOpen(false);
      if (err instanceof ApiException) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue lors de la cloture.');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!edition) return;

    if (!name.trim()) {
      setError("Le nom de l'édition est requis.");
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

    const commissionNum = parseFloat(commissionRate);
    if (isNaN(commissionNum) || commissionNum < 0 || commissionNum > 100) {
      setError('Le taux de commission doit être entre 0 et 100%.');
      return;
    }

    const hasAllConfigDates =
      declarationDeadline &&
      depositStartDatetime &&
      depositEndDatetime &&
      saleStartDatetime &&
      saleEndDatetime &&
      retrievalStartDatetime &&
      retrievalEndDatetime;

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
    if (saleStartDatetime) {
      updateData.saleStartDatetime = formatLocalDatetime(saleStartDatetime);
    }
    if (saleEndDatetime) {
      updateData.saleEndDatetime = formatLocalDatetime(saleEndDatetime);
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
        await statusMutation.mutateAsync('configured');
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{edition.name}</h1>
            <p className="mt-1 text-gray-600">
              Configurez les dates clés et les créneaux de dépôt.
            </p>
          </div>
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusInfo.className}`}>
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
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" role="alert">
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
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Informations générales
          </h2>

          <fieldset disabled={!isEditable} className="space-y-4">
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
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Période de dépôt</h3>
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
            </div>

            {/* Sale Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Période de vente</h3>
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
            </div>

            {/* Retrieval Dates */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Période de récupération</h3>
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
            </div>
          </fieldset>
        </section>

        {/* Deposit Slots Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <DepositSlotsEditor editionId={edition.id} disabled={!isEditable} />
        </section>

        {/* Billetweb Import Section - Only for configured editions */}
        {edition.status === 'configured' && (
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Inscriptions Billetweb
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Importez les inscriptions depuis Billetweb pour associer les deposants a cette edition.
            </p>

            <BilletwebImportButton
              edition={edition}
              importCount={importStats?.totalDepositors ?? 0}
              onImportSuccess={() => refetchImportStats()}
            />

            {importStats && importStats.totalImports > 0 && (
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
                    Voir les deposants
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Deposants inscrits</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.totalDepositors}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Imports effectues</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.totalImports}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lignes importees</p>
                    <p className="text-xl font-semibold text-gray-900">{importStats.totalImported}</p>
                  </div>
                </div>
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
                <h3 className="text-sm font-semibold text-gray-900">Etiquettes</h3>
                <p className="text-sm text-gray-500">Generez les etiquettes PDF pour les listes validees.</p>
              </div>
              <Link
                to={`/editions/${edition.id}/labels`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Gestion des etiquettes
              </Link>
            </div>
          </div>
        )}

        {/* Sales & Stats links */}
        {edition.status === 'in_progress' && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Ventes</h3>
                <p className="text-sm text-gray-500">Accedez a la caisse et aux statistiques en direct.</p>
              </div>
              <div className="flex gap-2">
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
                <p className="text-sm text-gray-500">Calculez et gerez les reversements aux deposants.</p>
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
                <h3 className="text-sm font-semibold text-red-900">Cloture de l'edition</h3>
                <p className="text-sm text-red-700">
                  La cloture est definitive et irreversible. Verifiez les prerequis avant de confirmer.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => setClosureModalOpen(true)}
              >
                Cloturer l'edition
              </Button>
            </div>
          </div>
        )}

        {/* Closure modal */}
        <Modal
          isOpen={closureModalOpen}
          onClose={() => setClosureModalOpen(false)}
          title="Cloture de l'edition"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              La cloture est definitive et irreversible. L'edition passera en lecture seule.
            </div>

            <h3 className="text-sm font-semibold text-gray-900">Prerequis</h3>

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
                Confirmer la cloture
              </Button>
            </div>
          </div>
        </Modal>

        {/* Closure report */}
        {edition.status === 'closed' && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Rapport de cloture</h3>
                <p className="text-sm text-gray-500">Telecharger le rapport PDF recapitulatif de l'edition.</p>
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
                    setError('Erreur lors du telechargement du rapport de cloture.');
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Rapport de cloture (PDF)
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
                  Archiver cette edition pour la retirer de la liste active.
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
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/editions')}
          >
            Annuler
          </Button>
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
    </div>
  );
}
