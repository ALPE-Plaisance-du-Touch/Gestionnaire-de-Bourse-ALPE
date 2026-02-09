import { useCallback, useEffect, useRef, useState } from 'react';
import { salesApi } from '@/api';
import { useNetworkStatus } from './useNetworkStatus';
import { prefetchCatalog, lookupByBarcode } from '@/services/catalogCache';
import { storeOfflineSale, getPendingSales, getPendingCount } from '@/services/offlineSales';
import { syncPendingSales } from '@/services/syncService';
import type { ScanArticleResponse } from '@/types';
import type { CachedArticle } from '@/services/db';

type PaymentMethod = 'cash' | 'card' | 'check';

interface UseOfflineSalesOptions {
  editionId: string | undefined;
}

export function useOfflineSales({ editionId }: UseOfflineSalesOptions) {
  const { isOnline } = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [catalogReady, setCatalogReady] = useState(false);
  const [lastSyncCount, setLastSyncCount] = useState(0);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const prefetchedRef = useRef(false);
  const prevOnlineRef = useRef(isOnline);

  // Prefetch catalog when online
  useEffect(() => {
    if (!editionId || !isOnline || prefetchedRef.current) return;

    prefetchCatalog(editionId)
      .then(() => {
        setCatalogReady(true);
        prefetchedRef.current = true;
      })
      .catch(() => {
        // Catalog prefetch failed, offline lookup won't be available
      });
  }, [editionId, isOnline]);

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  // Auto-sync when going from offline to online
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline && editionId && pendingCount > 0 && !syncing) {
      setSyncing(true);
      syncPendingSales(editionId)
        .then((result) => {
          setLastSyncCount(result.synced);
          setConflicts(result.conflicts);
          refreshPendingCount();
          // Clear sync message after 10s
          setTimeout(() => setLastSyncCount(0), 10_000);
        })
        .catch(() => {
          // Sync failed, will retry on next online transition
        })
        .finally(() => setSyncing(false));
    }
  }, [isOnline, editionId, pendingCount, syncing, refreshPendingCount]);

  // Scan article: online -> API, offline -> IndexedDB
  const scanArticle = useCallback(async (barcode: string): Promise<ScanArticleResponse> => {
    if (isOnline && editionId) {
      return salesApi.scanArticle(editionId, barcode);
    }

    // Offline: lookup from IndexedDB
    const cached = await lookupByBarcode(barcode);
    if (!cached) {
      throw new Error('Article non trouve (mode offline)');
    }

    return cachedToScanResponse(cached);
  }, [isOnline, editionId]);

  // Register sale: online -> API, offline -> IndexedDB
  const registerSale = useCallback(async (
    article: ScanArticleResponse,
    paymentMethod: PaymentMethod,
  ): Promise<{ description: string; price: number; isOffline: boolean }> => {
    if (isOnline && editionId) {
      const result = await salesApi.registerSale(editionId, {
        articleId: article.articleId,
        paymentMethod,
        registerNumber: 1,
      });
      return {
        description: result.articleDescription,
        price: Number(result.price),
        isOffline: false,
      };
    }

    // Offline: store in IndexedDB
    if (!editionId) throw new Error('Edition non disponible');

    const sale = await storeOfflineSale({
      articleId: article.articleId,
      barcode: article.barcode,
      articleDescription: article.description,
      price: Number(article.price),
      paymentMethod,
      registerNumber: 1,
      soldAt: new Date().toISOString(),
      editionId,
    });

    await refreshPendingCount();

    return {
      description: sale.articleDescription,
      price: sale.price,
      isOffline: true,
    };
  }, [isOnline, editionId, refreshPendingCount]);

  // Get offline pending sales for display
  const getOfflineSales = useCallback(async () => {
    if (!editionId) return [];
    return getPendingSales(editionId);
  }, [editionId]);

  return {
    isOnline,
    pendingCount,
    catalogReady,
    lastSyncCount,
    conflicts,
    syncing,
    scanArticle,
    registerSale,
    getOfflineSales,
    refreshPendingCount,
  };
}

function cachedToScanResponse(cached: CachedArticle): ScanArticleResponse {
  return {
    articleId: cached.articleId,
    barcode: cached.barcode,
    description: cached.description,
    category: cached.category,
    size: cached.size,
    price: cached.price,
    brand: cached.brand,
    isLot: cached.isLot,
    lotQuantity: cached.lotQuantity,
    listNumber: cached.listNumber,
    depositorName: cached.depositorName,
    labelColor: cached.labelColor,
    status: 'on_sale',
    isAvailable: true,
  };
}
