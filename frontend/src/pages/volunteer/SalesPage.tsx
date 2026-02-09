import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api';
import { QrScanner } from '@/components/sales/QrScanner';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useOfflineSales } from '@/hooks/useOfflineSales';
import { playSuccessBeep, playErrorBeep } from '@/utils/sound';
import type { ScanArticleResponse, SaleResponse, OfflineSaleDisplay } from '@/types';
import type { PendingSale } from '@/services/db';

type PaymentMethod = 'cash' | 'card' | 'check';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Especes',
  card: 'CB',
  check: 'Cheque',
};

export function SalesPage() {
  const { id: editionId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const {
    isOnline,
    pendingCount,
    lastSyncCount,
    conflicts,
    scanArticle: offlineScan,
    registerSale: offlineRegister,
    getOfflineSales,
    refreshPendingCount,
  } = useOfflineSales({ editionId });

  const [scannedArticle, setScannedArticle] = useState<ScanArticleResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [offlineSalesList, setOfflineSalesList] = useState<PendingSale[]>([]);

  // Load offline sales for display
  useEffect(() => {
    getOfflineSales().then(setOfflineSalesList);
  }, [getOfflineSales, pendingCount]);

  // Invalidate server sales after sync
  useEffect(() => {
    if (lastSyncCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['sales', editionId] });
    }
  }, [lastSyncCount, queryClient, editionId]);

  // Recent sales list (only fetched when online)
  const { data: recentSales } = useQuery({
    queryKey: ['sales', editionId, 'recent'],
    queryFn: () => salesApi.listSales(editionId!, { perPage: 20 }),
    enabled: !!editionId && isOnline,
    refetchInterval: isOnline ? 5000 : false,
  });

  // Scan mutation (works online and offline via hook)
  const scanMutation = useMutation({
    mutationFn: (barcode: string) => offlineScan(barcode),
    onSuccess: (data) => {
      setScannedArticle(data);
      setScanError(null);
      setSelectedPayment(null);
      setSuccessMessage(null);
      if (!data.isAvailable) {
        playErrorBeep();
        setScanError(
          data.status === 'sold'
            ? 'Cet article a deja ete vendu !'
            : `Article non disponible (statut: ${data.status})`
        );
      }
    },
    onError: (error: Error) => {
      setScannedArticle(null);
      setScanError(error.message || 'Article non trouve');
      playErrorBeep();
    },
  });

  // Register sale mutation (works online and offline via hook)
  const registerMutation = useMutation({
    mutationFn: (params: { article: ScanArticleResponse; paymentMethod: PaymentMethod }) =>
      offlineRegister(params.article, params.paymentMethod),
    onSuccess: (data) => {
      playSuccessBeep();
      const suffix = data.isOffline ? ' (hors-ligne)' : '';
      setSuccessMessage(`Vente enregistree${suffix} ! ${data.description} - ${data.price.toFixed(2)} EUR`);
      setScannedArticle(null);
      setSelectedPayment(null);
      if (!data.isOffline) {
        queryClient.invalidateQueries({ queryKey: ['sales', editionId] });
      }
      refreshPendingCount();
    },
    onError: (error: Error) => {
      playErrorBeep();
      setScanError(error.message || 'Erreur lors de l\'enregistrement de la vente');
    },
  });

  // Cancel mutation (only available when online)
  const cancelMutation = useMutation({
    mutationFn: (saleId: string) => salesApi.cancelSale(editionId!, saleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', editionId] });
    },
  });

  const handleScan = useCallback((barcode: string) => {
    setSuccessMessage(null);
    setScanError(null);
    scanMutation.mutate(barcode);
  }, [scanMutation]);

  const handleRegister = () => {
    if (scannedArticle && selectedPayment) {
      registerMutation.mutate({
        article: scannedArticle,
        paymentMethod: selectedPayment,
      });
    }
  };

  // Merge server sales with offline pending sales for display
  const serverSales = recentSales?.items || [];
  const offlineDisplaySales: OfflineSaleDisplay[] = offlineSalesList
    .filter(s => s.status === 'pending')
    .map(s => ({
      id: s.id,
      articleId: s.articleId,
      articleDescription: s.articleDescription,
      articleBarcode: s.barcode,
      price: s.price,
      paymentMethod: s.paymentMethod,
      soldAt: s.soldAt,
      depositorName: '',
      listNumber: 0,
      isOffline: true as const,
    }));

  const allSales = [...offlineDisplaySales, ...serverSales];
  const sessionTotal = allSales.reduce((sum, s) => sum + Number(s.price), 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to={`/editions/${editionId}`}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
          >
            &larr; Retour a l'edition
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Caisse</h1>
        </div>
      </div>

      {/* Private sale banner */}
      <PrivateSaleBanner />

      {/* Offline banner */}
      <div className="mb-4">
        <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} lastSyncCount={lastSyncCount} conflicts={conflicts} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Scanner */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanner un article</h2>
            <QrScanner
              onScan={handleScan}
              disabled={scanMutation.isPending || registerMutation.isPending}
            />
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Scan error */}
          {scanError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">{scanError}</p>
            </div>
          )}

          {/* Article info */}
          {scannedArticle && scannedArticle.isAvailable && (
            <div
              className="rounded-lg shadow p-4 border-2"
              style={{
                borderColor: scannedArticle.labelColor ? getLabelColorHex(scannedArticle.labelColor) : '#e5e7eb',
                backgroundColor: scannedArticle.labelColor ? getLabelColorHex(scannedArticle.labelColor) + '15' : '#ffffff',
              }}
            >
              <h3 className="font-semibold text-gray-900 mb-3">Article scanne</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <span className="text-gray-500">Description</span>
                  <p className="font-medium">{scannedArticle.description}</p>
                </div>
                <div>
                  <span className="text-gray-500">Prix</span>
                  <p className="text-xl font-bold text-gray-900">{Number(scannedArticle.price).toFixed(2)} EUR</p>
                </div>
                <div>
                  <span className="text-gray-500">Categorie</span>
                  <p>{scannedArticle.category}</p>
                </div>
                <div>
                  <span className="text-gray-500">Taille</span>
                  <p>{scannedArticle.size || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Deposant</span>
                  <p>{scannedArticle.depositorName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Liste</span>
                  <p>N{'\u00B0'}{scannedArticle.listNumber}</p>
                </div>
              </div>

              {/* Payment selection */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Moyen de paiement</p>
                <div className="flex gap-2 mb-4">
                  {(['cash', 'card', 'check'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSelectedPayment(method)}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                        selectedPayment === method
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {PAYMENT_LABELS[method]}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={!selectedPayment || registerMutation.isPending}
                  className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg"
                >
                  {registerMutation.isPending ? 'Enregistrement...' : 'Enregistrer la vente'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Recent sales */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Ventes recentes</h2>
            <div className="text-sm text-gray-500">
              {allSales.length} vente{allSales.length !== 1 ? 's' : ''} &middot; {sessionTotal.toFixed(2)} EUR
            </div>
          </div>

          {allSales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Aucune vente enregistree</p>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {allSales.map((sale) => (
                'isOffline' in sale ? (
                  <OfflineSaleItem key={sale.id} sale={sale} />
                ) : (
                  <SaleItem
                    key={sale.id}
                    sale={sale}
                    onCancel={() => cancelMutation.mutate(sale.id)}
                    cancelling={cancelMutation.isPending}
                    cancelDisabled={!isOnline}
                  />
                )
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OfflineSaleItem({ sale }: { sale: OfflineSaleDisplay }) {
  const soldAt = new Date(sale.soldAt);
  const time = soldAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{time}</span>
          <span className="text-sm font-medium text-gray-900 truncate">{sale.articleDescription}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-200 text-orange-800">
            Hors-ligne
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
            {PAYMENT_LABELS[sale.paymentMethod as PaymentMethod] || sale.paymentMethod}
          </span>
        </div>
      </div>
      <span className="font-semibold text-gray-900 ml-3">{Number(sale.price).toFixed(2)} EUR</span>
    </div>
  );
}

function SaleItem({
  sale,
  onCancel,
  cancelling,
  cancelDisabled,
}: {
  sale: SaleResponse;
  onCancel: () => void;
  cancelling: boolean;
  cancelDisabled: boolean;
}) {
  const soldAt = new Date(sale.soldAt);
  const time = soldAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{time}</span>
          <span className="text-sm font-medium text-gray-900 truncate">{sale.articleDescription}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">
            L{sale.listNumber} &middot; {sale.depositorName}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
            {PAYMENT_LABELS[sale.paymentMethod as PaymentMethod] || sale.paymentMethod}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className="font-semibold text-gray-900">{Number(sale.price).toFixed(2)} EUR</span>
        {sale.canCancel && !cancelDisabled && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

function PrivateSaleBanner() {
  const now = new Date();
  const isFriday = now.getDay() === 5;
  const hour = now.getHours();
  const isPrivateSaleTime = isFriday && hour >= 17 && hour < 18;

  if (!isPrivateSaleTime) return null;

  return (
    <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800 px-4 py-3 rounded-r-lg">
      <p className="font-medium">Vente privee ecoles/ALAE en cours (17h-18h)</p>
      <p className="text-sm mt-1">Les ventes effectuees pendant ce creneau sont automatiquement marquees comme ventes privees.</p>
    </div>
  );
}

// Map label colors to hex values (same as backend)
function getLabelColorHex(color: string): string {
  const colors: Record<string, string> = {
    sky_blue: '#87CEEB',
    yellow: '#FFD700',
    fuchsia: '#FF69B4',
    lilac: '#C8A2C8',
    mint_green: '#98FF98',
    orange: '#FF8C00',
    white: '#FFFFFF',
    pink: '#FFB6C1',
  };
  return colors[color] || '#E5E7EB';
}
