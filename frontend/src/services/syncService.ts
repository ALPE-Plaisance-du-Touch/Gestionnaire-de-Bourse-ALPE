import { salesApi, type SyncSalePayload } from '@/api/sales';
import { getDB } from './db';
import { markSynced, markConflict, clearSyncedSales } from './offlineSales';

export interface SyncResult {
  synced: number;
  conflicts: string[];
}

export async function syncPendingSales(editionId: string): Promise<SyncResult> {
  const db = await getDB();
  const pending = await db.getAllFromIndex('pendingSales', 'by-edition', editionId);
  const toSync = pending.filter(s => s.status === 'pending');

  if (toSync.length === 0) {
    return { synced: 0, conflicts: [] };
  }

  const payload: SyncSalePayload[] = toSync.map(s => ({
    clientId: s.id,
    articleId: s.articleId,
    paymentMethod: s.paymentMethod,
    registerNumber: s.registerNumber,
    soldAt: s.soldAt,
  }));

  const response = await salesApi.syncSales(editionId, payload);

  const syncedIds: string[] = [];
  const conflicts: string[] = [];

  for (const result of response.results) {
    if (result.status === 'synced') {
      syncedIds.push(result.clientId);
    } else {
      const sale = toSync.find(s => s.id === result.clientId);
      const desc = sale?.articleDescription ?? result.clientId;
      conflicts.push(`${desc}: ${result.errorMessage ?? 'Conflit'}`);
      await markConflict(result.clientId, result.errorMessage ?? 'Conflit');
    }
  }

  if (syncedIds.length > 0) {
    await markSynced(syncedIds);
  }

  // Clean up synced sales from IndexedDB
  await clearSyncedSales();

  return { synced: response.synced, conflicts };
}
