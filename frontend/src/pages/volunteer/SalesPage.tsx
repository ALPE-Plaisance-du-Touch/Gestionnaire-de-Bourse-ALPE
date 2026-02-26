import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api';
import { QrScanner } from '@/components/sales/QrScanner';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import { useOfflineSales } from '@/hooks/useOfflineSales';
import { useAuth } from '@/contexts';
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
  const { user } = useAuth();
  const canViewEdition = user?.role === 'manager' || user?.role === 'administrator';
  const backLink = canViewEdition ? `/editions/${editionId}` : '/';

  const {
    isOnline,
    pendingCount,
    lastSyncCount,
    conflicts,
    scanArticle: offlineScan,
    registerBatchSales: offlineBatchRegister,
    getOfflineSales,
    refreshPendingCount,
  } = useOfflineSales({ editionId });

  const [scanError, setScanError] = useState<string | null>(null);
  const [cart, setCart] = useState<ScanArticleResponse[]>([]);
  const [isPaymentMode, setIsPaymentMode] = useState(false);
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

  // Scan mutation - adds directly to cart
  const scanMutation = useMutation({
    mutationFn: (barcode: string) => offlineScan(barcode),
    onSuccess: (data) => {
      setScanError(null);
      setSuccessMessage(null);

      if (!data.isAvailable) {
        playErrorBeep();
        setScanError(
          data.status === 'sold'
            ? 'Cet article a deja ete vendu !'
            : `Article non disponible (statut: ${data.status})`
        );
        return;
      }

      // Check if already in cart
      if (cart.some(a => a.articleId === data.articleId)) {
        playErrorBeep();
        setScanError('Cet article est deja dans le panier');
        return;
      }

      // Add directly to cart
      setCart(prev => [...prev, data]);
      playSuccessBeep();
    },
    onError: (error: Error) => {
      setScanError(error.message || 'Article non trouve');
      playErrorBeep();
    },
  });

  // Checkout mutation (batch)
  const checkoutMutation = useMutation({
    mutationFn: (params: { articles: ScanArticleResponse[]; paymentMethod: PaymentMethod }) =>
      offlineBatchRegister(params.articles, params.paymentMethod),
    onSuccess: (data) => {
      playSuccessBeep();
      const suffix = data.isOffline ? ' (hors-ligne)' : '';
      setSuccessMessage(
        `Paye${suffix} ! ${data.articleCount} article${data.articleCount > 1 ? 's' : ''} - ${data.total.toFixed(2)} EUR`
      );
      setCart([]);
      setSelectedPayment(null);
      setIsPaymentMode(false);
      if (!data.isOffline) {
        queryClient.invalidateQueries({ queryKey: ['sales', editionId] });
      }
      refreshPendingCount();
    },
    onError: (error: Error) => {
      playErrorBeep();
      setScanError(error.message || "Erreur lors de l'enregistrement");
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

  const handleRemoveFromCart = (articleId: string) => {
    setCart(prev => {
      const next = prev.filter(a => a.articleId !== articleId);
      if (next.length === 0) {
        setIsPaymentMode(false);
        setSelectedPayment(null);
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setSelectedPayment(null);
    setIsPaymentMode(false);
  };

  const handleGoToPayment = () => {
    setIsPaymentMode(true);
    setScanError(null);
    setSuccessMessage(null);
  };

  const handleBackToScan = () => {
    setIsPaymentMode(false);
    setSelectedPayment(null);
  };

  const handlePay = () => {
    if (cart.length === 0 || !selectedPayment) return;
    checkoutMutation.mutate({ articles: cart, paymentMethod: selectedPayment });
  };

  const cartTotal = cart.reduce((sum, a) => sum + Number(a.price), 0);

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
            to={backLink}
            className="text-sm text-blue-600 hover:text-blue-700 mb-1 inline-block"
          >
            &larr; {canViewEdition ? "Retour a l'edition" : "Retour a l'accueil"}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Caisse</h1>
        </div>
      </div>

      {/* Private sale banner */}
      <PrivateSaleBanner />

      {/* Offline banner */}
      <div className="mb-4">
        <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} lastSyncCount={lastSyncCount} conflicts={conflicts} />
        <TrainingBanner editionId={editionId!} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Scanner + Cart */}
        <div className="space-y-4">
          {/* Scanner (hidden during payment) */}
          {!isPaymentMode && (
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Scanner un article</h2>
              <QrScanner
                onScan={handleScan}
                disabled={scanMutation.isPending || checkoutMutation.isPending}
              />
            </div>
          )}

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

          {/* Cart / Panier */}
          {cart.length > 0 && (
            <div className="bg-white rounded-lg shadow border-2 border-blue-200">
              <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-blue-50 rounded-t-lg">
                <h3 className="font-semibold text-blue-900">Panier</h3>
                <span className="text-sm text-blue-700 font-medium">
                  {cart.length} article{cart.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {cart.map((article) => (
                  <div key={article.articleId} className="flex items-center justify-between p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{article.description}</p>
                      <p className="text-xs text-gray-500">
                        L{article.listNumber} &middot; {article.depositorName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <span className="font-semibold text-gray-900">{Number(article.price).toFixed(2)} EUR</span>
                      {!isPaymentMode && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(article.articleId)}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label={`Retirer ${article.description}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                <span className="font-semibold text-gray-900">TOTAL</span>
                <span className="text-xl font-bold text-gray-900">{cartTotal.toFixed(2)} EUR</span>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-200">
                {!isPaymentMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleGoToPayment}
                      className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors text-lg mb-2"
                    >
                      Passer au paiement
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="w-full py-2 px-4 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      Vider le panier
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-3">Mode de paiement</p>
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
                      onClick={handlePay}
                      disabled={!selectedPayment || checkoutMutation.isPending}
                      className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg mb-2"
                    >
                      {checkoutMutation.isPending ? 'Enregistrement...' : 'Paye'}
                    </button>

                    <button
                      type="button"
                      onClick={handleBackToScan}
                      disabled={checkoutMutation.isPending}
                      className="w-full py-2 px-4 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
                    >
                      Retour au scan
                    </button>
                  </>
                )}
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

