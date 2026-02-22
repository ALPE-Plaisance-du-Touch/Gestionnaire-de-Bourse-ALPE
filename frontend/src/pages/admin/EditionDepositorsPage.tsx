import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { editionsApi, billetwebApi, depositSlotsApi } from '@/api';
import { Button, Modal, ConfirmModal, Select, Input } from '@/components/ui';
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
          Edition introuvable ou erreur lors du chargement.
        </div>
        <Link to="/editions" className="text-blue-600 hover:text-blue-700">
          ← Retour a la liste des editions
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Déposant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Téléphone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type de liste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créneau de dépôt
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ville
                </th>
                {!isEditionLocked && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {depositors.length === 0 ? (
                <tr>
                  <td colSpan={isEditionLocked ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {depositor.userFirstName} {depositor.userLastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{depositor.userEmail}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {depositor.userPhone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${listTypeInfo.className}`}
                        >
                          {listTypeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {depositor.slotStartDatetime
                            ? formatDatetime(depositor.slotStartDatetime)
                            : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {depositor.city
                            ? `${depositor.postalCode ? depositor.postalCode + ' ' : ''}${depositor.city}`
                            : '-'}
                        </div>
                      </td>
                      {!isEditionLocked && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(depositor)}
                            >
                              Modifier
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openDeleteModal(depositor)}
                            >
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

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
                Precedent
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
