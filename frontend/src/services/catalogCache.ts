import { getDB, type CachedArticle } from './db';
import { salesApi } from '@/api';

export async function prefetchCatalog(editionId: string): Promise<number> {
  const articles = await salesApi.getArticleCatalog(editionId);
  const db = await getDB();
  const tx = db.transaction('articles', 'readwrite');
  await tx.store.clear();
  await Promise.all(articles.map(a => tx.store.put(a)));
  await tx.done;
  return articles.length;
}

export async function lookupByBarcode(barcode: string): Promise<CachedArticle | undefined> {
  const db = await getDB();
  return db.getFromIndex('articles', 'by-barcode', barcode);
}

export async function removeArticle(articleId: string): Promise<void> {
  const db = await getDB();
  await db.delete('articles', articleId);
}
