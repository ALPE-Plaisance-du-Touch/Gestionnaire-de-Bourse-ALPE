import { getDB, type PendingSale } from './db';
import { removeArticle } from './catalogCache';

const MAX_PENDING_SALES = 50;

export async function storeOfflineSale(
  sale: Omit<PendingSale, 'id' | 'status'>,
): Promise<PendingSale> {
  const db = await getDB();

  const pendingCount = await db.countFromIndex('pendingSales', 'by-status', 'pending');
  if (pendingCount >= MAX_PENDING_SALES) {
    throw new Error('Limite de 50 ventes hors-ligne atteinte. Synchronisez avant de continuer.');
  }

  const pendingSale: PendingSale = {
    ...sale,
    id: crypto.randomUUID(),
    status: 'pending',
  };

  await db.put('pendingSales', pendingSale);

  // Remove article from cache to prevent double sale locally
  await removeArticle(sale.articleId);

  return pendingSale;
}

export async function getPendingSales(editionId: string): Promise<PendingSale[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('pendingSales', 'by-edition', editionId);
  return all.filter(s => s.status === 'pending');
}

export async function getPendingCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex('pendingSales', 'by-status', 'pending');
}

export async function markSynced(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('pendingSales', 'readwrite');
  for (const id of ids) {
    const sale = await tx.store.get(id);
    if (sale) {
      sale.status = 'synced';
      await tx.store.put(sale);
    }
  }
  await tx.done;
}

export async function markConflict(id: string, error: string): Promise<void> {
  const db = await getDB();
  const sale = await db.get('pendingSales', id);
  if (sale) {
    sale.status = 'conflict';
    sale.syncError = error;
    await db.put('pendingSales', sale);
  }
}

export async function clearSyncedSales(): Promise<void> {
  const db = await getDB();
  const synced = await db.getAllFromIndex('pendingSales', 'by-status', 'synced');
  const tx = db.transaction('pendingSales', 'readwrite');
  for (const sale of synced) {
    await tx.store.delete(sale.id);
  }
  await tx.done;
}
