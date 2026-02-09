import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface CachedArticle {
  articleId: string;
  barcode: string;
  description: string;
  category: string;
  size: string | null;
  price: number;
  brand: string | null;
  isLot: boolean;
  lotQuantity: number | null;
  listNumber: number;
  depositorName: string;
  labelColor: string | null;
}

export interface PendingSale {
  id: string;
  articleId: string;
  barcode: string;
  articleDescription: string;
  price: number;
  paymentMethod: 'cash' | 'card' | 'check';
  registerNumber: number;
  soldAt: string;
  editionId: string;
  status: 'pending' | 'synced' | 'conflict';
  syncError?: string;
}

interface BourseDB extends DBSchema {
  articles: {
    key: string;
    value: CachedArticle;
    indexes: { 'by-barcode': string };
  };
  pendingSales: {
    key: string;
    value: PendingSale;
    indexes: { 'by-status': string; 'by-edition': string };
  };
  syncMeta: {
    key: string;
    value: { key: string; value: string | number | boolean };
  };
}

let dbInstance: IDBPDatabase<BourseDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BourseDB>> {
  if (!dbInstance) {
    dbInstance = await openDB<BourseDB>('bourse-alpe', 1, {
      upgrade(db) {
        const articleStore = db.createObjectStore('articles', { keyPath: 'articleId' });
        articleStore.createIndex('by-barcode', 'barcode', { unique: true });

        const salesStore = db.createObjectStore('pendingSales', { keyPath: 'id' });
        salesStore.createIndex('by-status', 'status');
        salesStore.createIndex('by-edition', 'editionId');

        db.createObjectStore('syncMeta', { keyPath: 'key' });
      },
    });
  }
  return dbInstance;
}
