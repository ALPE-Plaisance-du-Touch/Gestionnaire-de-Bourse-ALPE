import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api';
import { Button, Select } from '@/components/ui';
import type { SaleResponse } from '@/types';

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'Tous les moyens' },
  { value: 'cash', label: 'Especes' },
  { value: 'card', label: 'CB' },
  { value: 'check', label: 'Cheque' },
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Especes',
  card: 'CB',
  check: 'Cheque',
};

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SalesManagementPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [saleToCancel, setSaleToCancel] = useState<SaleResponse | null>(null);
  const [cancelError, setCancelError] = useState('');

  const perPage = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-management', editionId, page, paymentFilter],
    queryFn: () =>
      salesApi.listSales(editionId!, {
        page,
        perPage,
        paymentMethod: paymentFilter === 'all' ? undefined : paymentFilter,
      }),
    enabled: !!editionId,
  });

  const cancelMutation = useMutation({
    mutationFn: (saleId: string) => salesApi.cancelSale(editionId!, saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-management'] });
      setSaleToCancel(null);
      setCancelError('');
    },
    onError: () => {
      setCancelError('Erreur lors de l\'annulation de la vente.');
    },
  });

  const handleCancelConfirm = useCallback(() => {
    if (saleToCancel) {
      cancelMutation.mutate(saleToCancel.id);
    }
  }, [saleToCancel, cancelMutation]);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Erreur lors du chargement des ventes.
        </div>
      </div>
    );
  }

  const sales = data?.items ?? [];
  const totalPages = data?.pages ?? 1;
  const totalSales = data?.total ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des ventes</h1>
        <p className="mt-1 text-gray-600">
          Consultez et gerez les ventes de l'edition. Les managers peuvent annuler les ventes sans limite de temps.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4 items-end">
        <div className="w-48">
          <Select
            label="Moyen de paiement"
            options={PAYMENT_OPTIONS}
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="text-sm text-gray-500 pb-2">
          {totalSales} vente{totalSales > 1 ? 's' : ''} au total
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune vente trouvee.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Article</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposant</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paiement</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Caisse</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendeur</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(sale.soldAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-gray-900">{sale.articleDescription}</div>
                      <div className="text-gray-500 text-xs">{sale.articleBarcode}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      <div>{sale.depositorName}</div>
                      <div className="text-gray-500 text-xs">Liste {sale.listNumber}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {sale.price.toFixed(2)} EUR
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {PAYMENT_LABELS[sale.paymentMethod] || sale.paymentMethod}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-700">
                      {sale.registerNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {sale.sellerName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSaleToCancel(sale)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Annuler
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
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

      {/* Cancel confirmation modal */}
      {saleToCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Annuler cette vente ?
            </h3>
            <div className="mb-4 text-sm text-gray-600">
              <p><strong>Article :</strong> {saleToCancel.articleDescription}</p>
              <p><strong>Prix :</strong> {saleToCancel.price.toFixed(2)} EUR</p>
              <p><strong>Deposant :</strong> {saleToCancel.depositorName}</p>
              <p><strong>Vendu le :</strong> {formatDateTime(saleToCancel.soldAt)}</p>
            </div>
            <p className="mb-4 text-sm text-amber-600">
              L'article sera remis en vente apres annulation.
            </p>
            {cancelError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {cancelError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => { setSaleToCancel(null); setCancelError(''); }}
              >
                Non, garder
              </Button>
              <Button
                variant="primary"
                onClick={handleCancelConfirm}
                disabled={cancelMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelMutation.isPending ? 'Annulation...' : 'Oui, annuler'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
