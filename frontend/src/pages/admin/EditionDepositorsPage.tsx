import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, billetwebApi, depositSlotsApi } from '@/api';
import { Button, Modal, ConfirmModal, Select, Input, TrainingBanner } from '@/components/ui';
import type { ListType, EditionDepositorWithUser, DepositorUpdateRequest } from '@/types';

const LIST_TYPE_LABELS: Record<ListType, { label: string; className: string }> = {
  standard: { label: 'Standard', className: 'bg-gray-100 text-gray-800' },
  list_1000: { label: 'Liste 1000', className: 'bg-blue-100 text-blue-800' },
  list_2000: { label: 'Liste 2000', className: 'bg-purple-100 text-purple-800' },
};

const LIST_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'list_1000', label: 'Liste 1000' },
  { value: 'list_2000', label: 'Liste 2000' },
];

/**
 * Format a datetime string for display.
 * Input: "2025-03-15T09:00:00"
 * Output: "15/03/2025 09:00"
 */
function formatDatetime(datetimeString: string | null): string {
  if (!datetimeString) return '-';
  const date = new Date(datetimeString);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EditionDepositorsPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [listTypeFilter, setListTypeFilter] = useState<ListType | ''>('');
  const limit = 20;

  // Edit modal state
  const [editingDepositor, setEditingDepositor] = useState<EditionDepositorWithUser | null>(null);
  const [editForm, setEditForm] = useState<DepositorUpdateRequest>({});

  // Delete modal state
  const [deletingDepositor, setDeletingDepositor] = useState<EditionDepositorWithUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch edition
  const { data: edition, isLoading: editionLoading } = useQuery({
    queryKey: ['edition', id],
    queryFn: () => editionsApi.getEdition(id!),
    enabled: !!id,
  });

  // Fetch depositors
  const { data: depositorsData, isLoading: depositorsLoading } = useQuery({
    queryKey: ['edition-depositors', id, page, listTypeFilter, limit],
    queryFn: () =>
      billetwebApi.listDepositors(id!, {
        page,
        limit,
        listType: listTypeFilter || undefined,
      }),
    enabled: !!id,
  });

  // Fetch deposit slots for edit modal
  const { data: slotsData } = useQuery({
    queryKey: ['deposit-slots', id],
    queryFn: () => depositSlotsApi.getDepositSlots(id!),
    enabled: !!id && !!editingDepositor,
  });

  const isEditionLocked = edition?.status === 'closed' || edition?.status === 'archived';

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (params: { depositorId: string; request: DepositorUpdateRequest }) =>
      billetwebApi.updateDepositor(id!, params.depositorId, params.request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edition-depositors', id] });
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', id] });
      setEditingDepositor(null);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (depositorId: string) => billetwebApi.deleteDepositor(id!, depositorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['edition-depositors', id] });
      queryClient.invalidateQueries({ queryKey: ['deposit-slots', id] });
      setDeletingDepositor(null);
      setDeleteError(null);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Erreur lors de la suppression';
      setDeleteError(message);
    },
  });

  function openEditModal(depositor: EditionDepositorWithUser) {
    setEditingDepositor(depositor);
    setEditForm({
      firstName: depositor.userFirstName,
      lastName: depositor.userLastName,
      phone: depositor.userPhone ?? undefined,
      depositSlotId: depositor.depositSlotId ?? undefined,
      listType: depositor.listType,
      postalCode: depositor.postalCode ?? undefined,
      city: depositor.city ?? undefined,
    });
  }

  function handleEditSubmit() {
    if (!editingDepositor) return;
    updateMutation.mutate({
      depositorId: editingDepositor.id,
      request: editForm,
    });
  }

  function openDeleteModal(depositor: EditionDepositorWithUser) {
    setDeletingDepositor(depositor);
    setDeleteError(null);
  }

  function handleDeleteConfirm() {
    if (!deletingDepositor) return;
    deleteMutation.mutate(deletingDepositor.id);
  }

  const isLoading = editionLoading || depositorsLoading;

  if (isLoading && !depositorsData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!edition) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          Édition introuvable ou erreur lors du chargement.
        </div>
        <Link to="/editions" className="text-blue-600 hover:text-blue-700">
          ← Retour à la liste des éditions
        </Link>
      </div>
    );
  }

  const depositors = depositorsData?.items ?? [];
  const total = depositorsData?.total ?? 0;
  const totalPages = depositorsData?.pages ?? 1;

  const slotOptions = (slotsData?.items ?? []).map((slot) => ({
    value: slot.id,
    label: `${formatDatetime(slot.startDatetime)} - ${formatDatetime(slot.endDatetime)} (${slot.registeredCount}/${slot.maxCapacity})`,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${id}`}
          className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à l'édition
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Déposants - {edition.name}
        </h1>
        <p className="mt-1 text-gray-600">
          {total} déposant{total !== 1 ? 's' : ''} inscrit{total !== 1 ? 's' : ''} à cette édition.
        </p>
      </div>

      <TrainingBanner editionId={id!} />

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="listType" className="block text-sm font-medium text-gray-700 mb-1">
              Type de liste
            </label>
            <select
              id="listType"
              value={listTypeFilter}
              onChange={(e) => {
                setListTypeFilter(e.target.value as ListType | '');
                setPage(1);
              }}
              className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
            >
              <option value="">Tous les types</option>
              <option value="standard">Standard</option>
              <option value="list_1000">Liste 1000</option>
              <option value="list_2000">Liste 2000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Déposant
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créneau
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ville
              </th>
              {!isEditionLocked && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {depositors.length === 0 ? (
              <tr>
                <td colSpan={isEditionLocked ? 5 : 6} className="px-4 py-12 text-center text-gray-500">
                  {listTypeFilter
                    ? 'Aucun déposant trouvé avec ce type de liste.'
                    : 'Aucun déposant inscrit pour cette édition.'}
                </td>
              </tr>
            ) : (
              depositors.map((depositor) => {
                const listTypeInfo = LIST_TYPE_LABELS[depositor.listType];
                return (
                  <tr key={depositor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {depositor.userFirstName} {depositor.userLastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{depositor.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${listTypeInfo.className}`}
                      >
                        {listTypeInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {depositor.slotStartDatetime
                          ? formatDatetime(depositor.slotStartDatetime)
                          : '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {depositor.city
                          ? `${depositor.postalCode ? depositor.postalCode + ' ' : ''}${depositor.city}`
                          : '-'}
                      </div>
                    </td>
                    {!isEditionLocked && (
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(depositor)}
                            className="p-1.5 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modifier"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(depositor)}
                            className="p-1.5 rounded text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-500">
              Page {page} sur {totalPages} ({total} déposants)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingDepositor}
        onClose={() => setEditingDepositor(null)}
        title={`Modifier - ${editingDepositor?.userFirstName} ${editingDepositor?.userLastName}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            {editingDepositor?.userEmail}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              value={editForm.firstName ?? ''}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
              maxLength={100}
            />
            <Input
              label="Nom"
              value={editForm.lastName ?? ''}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
              maxLength={100}
            />
          </div>
          <Input
            label="Téléphone"
            value={editForm.phone ?? ''}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value || undefined })}
            maxLength={20}
          />
          <Select
            label="Créneau de dépôt"
            options={slotOptions}
            value={editForm.depositSlotId ?? ''}
            onChange={(e) => setEditForm({ ...editForm, depositSlotId: e.target.value || undefined })}
            placeholder="Sélectionner un créneau"
          />
          <Select
            label="Type de liste"
            options={LIST_TYPE_OPTIONS}
            value={editForm.listType ?? 'standard'}
            onChange={(e) => setEditForm({ ...editForm, listType: e.target.value as ListType })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Code postal"
              value={editForm.postalCode ?? ''}
              onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value || undefined })}
              maxLength={10}
            />
            <Input
              label="Ville"
              value={editForm.city ?? ''}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value || undefined })}
              maxLength={100}
            />
          </div>
          {updateMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {updateMutation.error instanceof Error
                ? updateMutation.error.message
                : 'Erreur lors de la modification'}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setEditingDepositor(null)} disabled={updateMutation.isPending}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} isLoading={updateMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingDepositor}
        onClose={() => { setDeletingDepositor(null); setDeleteError(null); }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le déposant"
        confirmLabel="Supprimer"
        variant="danger"
        isLoading={deleteMutation.isPending}
      >
        <p className="text-gray-600">
          Voulez-vous vraiment supprimer <strong>{deletingDepositor?.userFirstName} {deletingDepositor?.userLastName}</strong> ({deletingDepositor?.userEmail}) de cette édition ?
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Cette action est irréversible. Le déposant devra être réinscrit manuellement.
        </p>
        {deleteError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mt-3">
            {deleteError}
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
