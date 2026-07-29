import { useState, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '@/api';
import { QrScanner } from '@/components/sales/QrScanner';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { TrainingBanner } from '@/components/ui/TrainingBanner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useOfflineSales } from '@/hooks/useOfflineSales';
import { useAuth } from '@/contexts';
import { playSuccessBeep, playErrorBeep } from '@/utils/sound';
import type { ScanArticleResponse, SaleResponse, OfflineSaleDisplay } from '@/types';
import type { PendingSale } from '@/services/db';

type PaymentMethod = 'cash' | 'card' | 'check';
type CheckoutStep = 'scan' | 'cart' | 'payment';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'Espèces',
  card: 'CB',
  check: 'Chèque',
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ReactNode> = {
  cash: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  card: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  check: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
};

function StepIndicator({ currentStep, cartCount }: { currentStep: CheckoutStep; cartCount: number }) {
  const steps: { key: CheckoutStep; label: string; number: string }[] = [
    { key: 'scan', label: 'Scanner', number: '1' },
    { key: 'cart', label: 'Panier', number: '2' },
    { key: 'payment', label: 'Paiement', number: '3' },
  ];

  const stepIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, i) => {
        const isActive = step.key === currentStep;
        const isDone = i < stepIndex;
        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`w-8 h-0.5 ${isDone || isActive ? 'bg-primary' : 'bg-sand'}`} />
            )}
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${isActive ? 'bg-primary text-white' : isDone ? 'bg-primary/20 text-primary' : 'bg-sand text-bark-muted'}
              `}>
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.key === 'cart' && cartCount > 0 && !isActive ? (
                  cartCount
                ) : (
                  step.number
                )}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${isActive ? 'text-bark' : 'text-bark-muted'}`}>
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('scan');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [offlineSalesList, setOfflineSalesList] = useState<PendingSale[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    getOfflineSales().then(setOfflineSalesList);
  }, [getOfflineSales, pendingCount]);

  useEffect(() => {
    if (lastSyncCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['sales', editionId] });
    }
  }, [lastSyncCount, queryClient, editionId]);

  const { data: recentSales } = useQuery({
    queryKey: ['sales', editionId, 'recent'],
    queryFn: () => salesApi.listSales(editionId!, { perPage: 20 }),
    enabled: !!editionId && isOnline,
    refetchInterval: isOnline ? 5000 : false,
  });

  const scanMutation = useMutation({
    mutationFn: (barcode: string) => offlineScan(barcode),
    onSuccess: (data) => {
      setScanError(null);
      setSuccessMessage(null);

      if (!data.isAvailable) {
        playErrorBeep();
        setScanError(
          data.status === 'sold'
            ? 'Cet article a déjà été vendu !'
            : `Article non disponible (statut: ${data.status})`
        );
        return;
      }

      if (cart.some(a => a.articleId === data.articleId)) {
        playErrorBeep();
        setScanError('Cet article est déjà dans le panier');
        return;
      }

      setCart(prev => [...prev, data]);
      playSuccessBeep();
    },
    onError: (error: Error) => {
      setScanError(error.message || 'Article non trouvé');
      playErrorBeep();
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (params: { articles: ScanArticleResponse[]; paymentMethod: PaymentMethod }) =>
      offlineBatchRegister(params.articles, params.paymentMethod),
    onSuccess: (data) => {
      playSuccessBeep();
      const suffix = data.isOffline ? ' (hors-ligne)' : '';
      setSuccessMessage(
        `Payé${suffix} ! ${data.articleCount} article${data.articleCount > 1 ? 's' : ''} - ${data.total.toFixed(2)} EUR`
      );
      setCart([]);
      setSelectedPayment(null);
      setCurrentStep('scan');
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
        setCurrentStep('scan');
        setSelectedPayment(null);
      }
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setSelectedPayment(null);
    setCurrentStep('scan');
  };

  const handlePay = () => {
    if (cart.length === 0 || !selectedPayment) return;
    checkoutMutation.mutate({ articles: cart, paymentMethod: selectedPayment });
  };

  const cartTotal = cart.reduce((sum, a) => sum + Number(a.price), 0);

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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to={backLink} className="text-sm text-primary hover:text-primary-dark mb-1 inline-flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {canViewEdition ? "Retour à l'édition" : "Retour"}
          </Link>
          <h1 className="text-2xl font-bold text-bark">Caisse</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/aide#guide-benevole" className="text-xs text-bark-muted hover:text-primary transition-colors">
            Aide
          </Link>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="relative p-2 text-bark-muted hover:text-bark hover:bg-cream-dark rounded-xl transition-colors"
            aria-label="Historique des ventes"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {allSales.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary text-white text-xs font-bold rounded-full flex items-center justify-center">
                {allSales.length > 99 ? '99' : allSales.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Banners */}
      <PrivateSaleBanner />
      <div className="mb-4 space-y-2">
        <OfflineBanner isOnline={isOnline} pendingCount={pendingCount} lastSyncCount={lastSyncCount} conflicts={conflicts} />
        <TrainingBanner editionId={editionId!} />
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} cartCount={cart.length} />

      {/* Success message */}
      {successMessage && (
        <div className="mb-4 bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-primary-dark font-medium">{successMessage}</p>
        </div>
      )}

      {/* Scan error */}
      {scanError && (
        <div className="mb-4 bg-error/10 border border-error/30 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-error font-medium">{scanError}</p>
        </div>
      )}

      {/* Step 1: SCAN */}
      {currentStep === 'scan' && (
        <div className="space-y-4">
          <Card variant="default" padding="md">
            <h2 className="text-lg font-semibold text-bark mb-4">Scanner un article</h2>
            <QrScanner
              onScan={handleScan}
              disabled={scanMutation.isPending || checkoutMutation.isPending}
            />
          </Card>

          {/* Mini cart preview */}
          {cart.length > 0 && (
            <Card variant="default" padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-primary/5 border-b border-sand">
                <span className="font-medium text-bark">
                  {cart.length} article{cart.length > 1 ? 's' : ''} dans le panier
                </span>
                <span className="font-bold text-bark">{cartTotal.toFixed(2)} EUR</span>
              </div>
              <div className="p-4 flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  size="lg"
                  onClick={() => setCurrentStep('cart')}
                  rightIcon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Voir le panier
                </Button>
                <Button variant="ghost" size="lg" onClick={handleClearCart}>
                  Vider
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Step 2: CART */}
      {currentStep === 'cart' && (
        <div className="space-y-4">
          <Card variant="default" padding="none" className="overflow-hidden">
            <div className="p-4 border-b border-sand">
              <h2 className="text-lg font-semibold text-bark">Panier</h2>
            </div>

            <div className="divide-y divide-sand">
              {cart.map((article) => (
                <div key={article.articleId} className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-bark truncate">{article.description}</p>
                    <p className="text-xs text-bark-muted">
                      L{article.listNumber} &middot; {article.depositorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="font-semibold text-bark">{Number(article.price).toFixed(2)} EUR</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(article.articleId)}
                      className="text-error/60 hover:text-error p-1 rounded-lg hover:bg-error/10 transition-colors"
                      aria-label={`Retirer ${article.description}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 border-t border-sand bg-cream-dark">
              <span className="font-semibold text-bark">TOTAL</span>
              <span className="text-2xl font-bold text-bark">{cartTotal.toFixed(2)} EUR</span>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-2">
              <Button variant="outline" size="lg" onClick={() => setCurrentStep('scan')}
                leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>}
              >
                Ajouter
              </Button>
              <Button variant="primary" size="lg" className="flex-1"
                onClick={() => { setCurrentStep('payment'); setScanError(null); setSuccessMessage(null); }}
                rightIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
              >
                Payer
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: PAYMENT */}
      {currentStep === 'payment' && (
        <div className="space-y-4">
          {/* Total display */}
          <div className="text-center py-6">
            <p className="text-bark-muted text-sm mb-1">Total à encaisser</p>
            <p className="text-5xl font-bold text-bark">{cartTotal.toFixed(2)} <span className="text-2xl">EUR</span></p>
            <p className="text-bark-muted text-sm mt-1">{cart.length} article{cart.length > 1 ? 's' : ''}</p>
          </div>

          {/* Payment method buttons */}
          <div className="grid grid-cols-3 gap-3">
            {(['cash', 'card', 'check'] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setSelectedPayment(method)}
                className={`
                  flex flex-col items-center gap-2 p-5 rounded-2xl border-2 transition-all duration-200
                  ${selectedPayment === method
                    ? 'border-primary bg-primary/10 text-primary-dark shadow-md scale-[1.02]'
                    : 'border-sand bg-white text-bark-light hover:border-bark-muted hover:bg-cream-dark'
                  }
                `}
              >
                {PAYMENT_ICONS[method]}
                <span className="font-medium text-sm">{PAYMENT_LABELS[method]}</span>
              </button>
            ))}
          </div>

          {/* Pay button */}
          <Button
            variant="warm"
            size="lg"
            className="w-full text-lg py-4"
            onClick={handlePay}
            disabled={!selectedPayment || checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? 'Enregistrement...' : 'Confirmer le paiement'}
          </Button>

          <Button
            variant="ghost"
            size="md"
            className="w-full"
            onClick={() => { setCurrentStep('cart'); setSelectedPayment(null); }}
            disabled={checkoutMutation.isPending}
          >
            Retour au panier
          </Button>
        </div>
      )}

      {/* History slide-in panel */}
      {isHistoryOpen && (
        <>
          <div
            className="fixed inset-0 bg-ink/50 z-40"
            onClick={() => setIsHistoryOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-sand shrink-0">
              <div>
                <h3 className="font-semibold text-bark">Ventes récentes</h3>
                <p className="text-xs text-bark-muted">
                  {allSales.length} vente{allSales.length !== 1 ? 's' : ''} &middot; {sessionTotal.toFixed(2)} EUR
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="p-2 text-bark-muted hover:text-bark rounded-xl hover:bg-cream-dark transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allSales.length === 0 ? (
                <p className="text-bark-muted text-center py-8">Aucune vente enregistrée</p>
              ) : (
                allSales.map((sale) => (
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
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OfflineSaleItem({ sale }: { sale: OfflineSaleDisplay }) {
  const soldAt = new Date(sale.soldAt);
  const time = soldAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between p-3 bg-accent/10 rounded-xl border border-accent/20">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-bark-muted">{time}</span>
          <span className="text-sm font-medium text-bark truncate">{sale.articleDescription}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs font-medium bg-accent/20 text-accent-dark">
            Hors-ligne
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs font-medium bg-sand text-bark-muted">
            {PAYMENT_LABELS[sale.paymentMethod as PaymentMethod] || sale.paymentMethod}
          </span>
        </div>
      </div>
      <span className="font-semibold text-bark ml-3">{Number(sale.price).toFixed(2)} EUR</span>
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
  const [confirming, setConfirming] = useState(false);
  const soldAt = new Date(sale.soldAt);
  const time = soldAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center justify-between p-3 bg-cream-dark rounded-xl">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-bark-muted">{time}</span>
          <span className="text-sm font-medium text-bark truncate">{sale.articleDescription}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-bark-muted">
            L{sale.listNumber} &middot; {sale.depositorName}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-lg text-xs font-medium bg-sand text-bark-muted">
            {PAYMENT_LABELS[sale.paymentMethod as PaymentMethod] || sale.paymentMethod}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 ml-3">
        <span className="font-semibold text-bark">{Number(sale.price).toFixed(2)} EUR</span>
        {sale.canCancel && !cancelDisabled && (
          confirming ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { onCancel(); setConfirming(false); }}
                disabled={cancelling}
                className="text-xs font-medium text-white bg-error hover:bg-error-light px-2 py-1 rounded-lg disabled:opacity-50 transition-colors"
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={cancelling}
                className="text-xs text-bark-muted hover:text-bark px-2 py-1"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={cancelling}
              className="text-xs text-error hover:text-error-light disabled:opacity-50 transition-colors"
            >
              Annuler
            </button>
          )
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
    <div className="mb-4 bg-accent/15 border-l-4 border-accent text-accent-dark px-4 py-3 rounded-r-xl">
      <p className="font-medium">Vente privée écoles/ALAE en cours (17h-18h)</p>
      <p className="text-sm mt-1">Les ventes effectuées pendant ce créneau sont automatiquement marquées comme ventes privées.</p>
    </div>
  );
}
