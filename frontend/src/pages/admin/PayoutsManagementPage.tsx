import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payoutsApi } from '@/api';
import { Button, ConfirmModal, TrainingBanner } from '@/components/ui';
import { PaymentModal } from '@/components/payouts/PaymentModal';
import type { PayoutResponse } from '@/types';

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

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-cream-dark text-bark' },
  ready: { label: 'Prêt', className: 'bg-accent/15 text-accent-dark' },
  paid: { label: 'Payé', className: 'bg-primary/10 text-primary-dark' },
  cancelled: { label: 'Annulé', className: 'bg-error/10 text-error' },
};

const LIST_TYPE_LABELS: Record<string, string> = {
  standard: 'Standard',
  list_1000: 'Liste 1000',
  list_2000: 'Liste 2000',
};

export function PayoutsManagementPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [paymentPayout, setPaymentPayout] = useState<PayoutResponse | null>(null);
  const [notesPayout, setNotesPayout] = useState<PayoutResponse | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [isAbsent, setIsAbsent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showBulkReminderConfirm, setShowBulkReminderConfirm] = useState(false);

  const perPage = 20;

  // Stats with polling
  const { data: stats } = useQuery({
    queryKey: ['payout-stats', editionId],
    queryFn: () => payoutsApi.getStats(editionId!),
    enabled: !!editionId,
    refetchInterval: 10000,
  });

  // Payouts list
  const { data: payoutsData, isLoading } = useQuery({
    queryKey: ['payouts', editionId, page, statusFilter, search, perPage],
    queryFn: () =>
      payoutsApi.listPayouts(editionId!, {
        page,
        perPage,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
    enabled: !!editionId,
  });

  // Calculate payouts
  const calculateMutation = useMutation({
    mutationFn: () => payoutsApi.calculatePayouts(editionId!),
    onSuccess: (result) => {
      setSuccessMessage(`${result.totalPayouts} reversement(s) calculé(s) pour ${result.totalDepositors} déposant(s).`);
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors du calcul des reversements.');
      setSuccessMessage('');
    },
  });

  // Record payment
  const paymentMutation = useMutation({
    mutationFn: ({ payoutId, paymentMethod, paymentReference, notes }: {
      payoutId: string;
      paymentMethod: string;
      paymentReference: string | null;
      notes: string | null;
    }) =>
      payoutsApi.recordPayment(editionId!, payoutId, {
        payment_method: paymentMethod as 'cash' | 'check' | 'transfer',
        payment_reference: paymentReference,
        notes,
      }),
    onSuccess: () => {
      setPaymentPayout(null);
      setSuccessMessage('Paiement enregistré avec succès.');
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors de l\'enregistrement du paiement.');
    },
  });

  // Update notes
  const notesMutation = useMutation({
    mutationFn: ({ payoutId, notes, isAbsent }: {
      payoutId: string;
      notes: string | null;
      isAbsent: boolean;
    }) =>
      payoutsApi.updateNotes(editionId!, payoutId, {
        notes,
        is_absent: isAbsent,
      }),
    onSuccess: () => {
      setNotesPayout(null);
      setSuccessMessage('Notes mises à jour.');
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors de la mise à jour des notes.');
    },
  });

  // Recalculate
  const recalculateMutation = useMutation({
    mutationFn: (payoutId: string) => payoutsApi.recalculate(editionId!, payoutId),
    onSuccess: () => {
      setSuccessMessage('Reversement recalculé.');
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors du recalcul.');
    },
  });

  // Download receipt
  const handleDownloadReceipt = async (payout: PayoutResponse) => {
    try {
      const blob = await payoutsApi.downloadReceipt(editionId!, payout.id);
      downloadBlob(blob, `Reversement_${payout.listNumber}_${payout.depositorName.replace(/\s+/g, '_')}.pdf`);
    } catch {
      setErrorMessage('Erreur lors du téléchargement du bordereau.');
    }
  };

  // Download all receipts
  const handleDownloadAll = async () => {
    try {
      const blob = await payoutsApi.downloadAllReceipts(editionId!);
      downloadBlob(blob, `Bordereaux_reversements.pdf`);
      setSuccessMessage('PDF global généré avec succès.');
    } catch {
      setErrorMessage('Erreur lors de la génération du PDF global.');
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    try {
      const blob = await payoutsApi.exportExcel(editionId!);
      downloadBlob(blob, 'Reversements_export.xlsx');
    } catch {
      setErrorMessage('Erreur lors du téléchargement de l\'export Excel.');
    }
  };

  // Send reminder
  const reminderMutation = useMutation({
    mutationFn: (payoutId: string) => payoutsApi.sendReminder(editionId!, payoutId),
    onSuccess: (data) => {
      setSuccessMessage(data.message || 'Email de relance envoyé.');
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors de l\'envoi de la relance.');
    },
  });

  // Bulk reminder
  const bulkReminderMutation = useMutation({
    mutationFn: () => payoutsApi.sendBulkReminder(editionId!),
    onSuccess: (data) => {
      setSuccessMessage(data.message || `${data.emailsQueued} email(s) de relance envoyé(s).`);
      setErrorMessage('');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
    onError: (error: Error) => {
      setErrorMessage(error.message || 'Erreur lors de l\'envoi des relances.');
    },
  });

  const handleBulkReminder = () => {
    setShowBulkReminderConfirm(true);
  };

  const handleBulkReminderConfirm = () => {
    setShowBulkReminderConfirm(false);
    bulkReminderMutation.mutate();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const payouts = payoutsData?.items ?? [];
  const total = payoutsData?.total ?? 0;
  const totalPages = payoutsData?.pages ?? 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/editions/${editionId}`}
          className="text-sm text-primary hover:text-primary-dark inline-flex items-center gap-1 mb-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à l'édition
        </Link>
        <h1 className="text-2xl font-bold text-bark">Reversements</h1>
        <p className="text-sm text-bark-muted mt-1">
          Actualisation automatique toutes les 10 secondes
        </p>
      </div>

      <TrainingBanner editionId={editionId!} />

      {/* Messages */}
      {successMessage && (
        <div className="mb-4 bg-primary/10 border border-primary/30 text-primary-dark px-4 py-3 rounded-lg flex justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-primary-dark font-bold">x</button>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg flex justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-error font-bold">x</button>
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4 bg-primary/10 text-primary-dark">
            <p className="text-sm opacity-80">Total ventes</p>
            <p className="text-2xl font-bold mt-1">{Number(stats.totalSales).toFixed(2)} EUR</p>
          </div>
          <div className="rounded-lg p-4 bg-primary/10 text-primary-dark">
            <p className="text-sm opacity-80">Commission ALPE</p>
            <p className="text-2xl font-bold mt-1">{Number(stats.totalCommission).toFixed(2)} EUR</p>
          </div>
          <div className="rounded-lg p-4 bg-accent/10 text-accent-dark">
            <p className="text-sm opacity-80">À reverser</p>
            <p className="text-2xl font-bold mt-1">{Number(stats.totalNet).toFixed(2)} EUR</p>
          </div>
          <div className="rounded-lg p-4 bg-secondary/10 text-secondary-dark">
            <p className="text-sm opacity-80">Progression</p>
            <p className="text-2xl font-bold mt-1">
              {stats.payoutsPaid}/{stats.totalPayouts} ({stats.paymentProgressPercent}%)
            </p>
          </div>
        </div>
      )}

      {/* Action bar */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-4">
          <Button
            onClick={() => calculateMutation.mutate()}
            disabled={calculateMutation.isPending}
          >
            {calculateMutation.isPending ? 'Calcul en cours...' : 'Calculer les reversements'}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            disabled={!stats || stats.totalPayouts === 0}
          >
            Tous les bordereaux (PDF)
          </Button>
          <Button
            variant="outline"
            onClick={handleExportExcel}
            disabled={!stats || stats.totalPayouts === 0}
          >
            Exporter Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/editions/${editionId}/payouts/dashboard`)}
          >
            Statistiques détaillées
          </Button>
          <Button
            variant="outline"
            onClick={handleBulkReminder}
            disabled={bulkReminderMutation.isPending || !stats || stats.totalPayouts === 0}
            className="text-secondary-dark border-secondary/30 hover:bg-secondary/10"
          >
            {bulkReminderMutation.isPending ? 'Envoi en cours...' : 'Relancer tous les absents'}
          </Button>

          <div className="ml-auto flex items-end gap-4">
            <div>
              <label htmlFor="statusFilter" className="block text-sm font-medium text-bark-light mb-1">
                Statut
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="block w-40 rounded-md border-sand shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
              >
                <option value="">Tous</option>
                <option value="pending">En attente</option>
                <option value="ready">Prêt</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-bark-light mb-1">
                  Rechercher
                </label>
                <input
                  id="search"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Nom du déposant..."
                  className="block w-48 rounded-md border-sand shadow-sm focus:border-primary focus:ring-primary sm:text-sm border p-2"
                />
              </div>
              <Button type="submit" variant="outline" className="self-end">
                OK
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-cream">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Déposant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Liste</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Articles</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Ventes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Commission</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Frais</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-bark-muted uppercase">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-bark-muted uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-bark-muted">
                    Chargement...
                  </td>
                </tr>
              ) : payouts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-bark-muted">
                    Aucun reversement. Cliquez sur "Calculer les reversements" pour commencer.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => {
                  const statusInfo = STATUS_LABELS[payout.status] || STATUS_LABELS.pending;
                  const rowBg =
                    payout.status === 'paid'
                      ? 'bg-primary/10'
                      : payout.status === 'ready'
                        ? 'bg-accent/10'
                        : '';

                  return (
                    <tr key={payout.id} className={`hover:bg-cream ${rowBg}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-bark">
                        {payout.depositorName}
                        {payout.notes && (
                          <span className="block text-xs text-bark-muted truncate max-w-[200px]" title={payout.notes}>
                            {payout.notes}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-bark">
                        {payout.listNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-bark-muted">
                        {LIST_TYPE_LABELS[payout.listType] || payout.listType}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-bark">
                        {payout.soldArticles}/{payout.totalArticles}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-bark">
                        {Number(payout.grossAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-bark-muted">
                        {Number(payout.commissionAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-bark-muted">
                        {Number(payout.listFees).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-bark">
                        {Number(payout.netAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDownloadReceipt(payout)}
                            className="text-primary hover:text-primary-dark text-xs font-medium"
                            title="Télécharger le bordereau"
                          >
                            PDF
                          </button>
                          {payout.status !== 'paid' && payout.status !== 'cancelled' && (
                            <>
                              <span className="text-bark-muted">|</span>
                              <button
                                onClick={() => setPaymentPayout(payout)}
                                className="text-primary hover:text-primary-dark text-xs font-medium"
                              >
                                Payer
                              </button>
                              <span className="text-bark-muted">|</span>
                              <button
                                onClick={() => recalculateMutation.mutate(payout.id)}
                                className="text-accent-dark hover:text-accent-dark text-xs font-medium"
                                disabled={recalculateMutation.isPending}
                              >
                                Recalc
                              </button>
                            </>
                          )}
                          {payout.notes?.startsWith('Absent') && payout.status !== 'paid' && (
                            <>
                              <span className="text-bark-muted">|</span>
                              <button
                                onClick={() => reminderMutation.mutate(payout.id)}
                                className="text-secondary-dark hover:text-secondary-dark text-xs font-medium"
                                disabled={reminderMutation.isPending}
                              >
                                Relancer
                              </button>
                            </>
                          )}
                          <span className="text-bark-muted">|</span>
                          <button
                            onClick={() => {
                              setNotesPayout(payout);
                              setNotesValue(payout.notes || '');
                              setIsAbsent(payout.notes?.startsWith('Absent') || false);
                            }}
                            className="text-bark-light hover:text-bark text-xs font-medium"
                          >
                            Notes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-cream px-6 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-bark-muted">
              Page {page} sur {totalPages} ({total} reversement{total !== 1 ? 's' : ''})
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

      {/* Payment modal */}
      <PaymentModal
        isOpen={!!paymentPayout}
        onClose={() => setPaymentPayout(null)}
        payout={paymentPayout}
        isLoading={paymentMutation.isPending}
        onConfirm={(paymentMethod, paymentReference, notes) => {
          if (paymentPayout) {
            paymentMutation.mutate({
              payoutId: paymentPayout.id,
              paymentMethod,
              paymentReference,
              notes,
            });
          }
        }}
      />

      {/* Notes modal */}
      {notesPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-bark">
                Notes - {notesPayout.depositorName}
              </h2>
              <button
                onClick={() => setNotesPayout(null)}
                className="text-bark-muted hover:text-bark-muted"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAbsent}
                    onChange={(e) => setIsAbsent(e.target.checked)}
                    className="rounded border-sand text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-bark-light">
                    Marquer comme absent (à recontacter)
                  </span>
                </label>
              </div>
              <div className="mb-4">
                <label htmlFor="notesText" className="block text-sm font-medium text-bark-light mb-1">
                  Notes
                </label>
                <textarea
                  id="notesText"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-sand px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setNotesPayout(null)}>
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    notesMutation.mutate({
                      payoutId: notesPayout.id,
                      notes: notesValue || null,
                      isAbsent,
                    });
                  }}
                  disabled={notesMutation.isPending}
                >
                  {notesMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk reminder confirmation modal */}
      <ConfirmModal
        isOpen={showBulkReminderConfirm}
        onClose={() => setShowBulkReminderConfirm(false)}
        onConfirm={handleBulkReminderConfirm}
        title="Relancer les déposants"
        message="Envoyer un email de relance à tous les déposants non payés ?"
        variant="warning"
        confirmLabel="Envoyer les relances"
        isLoading={bulkReminderMutation.isPending}
      />
    </div>
  );
}
