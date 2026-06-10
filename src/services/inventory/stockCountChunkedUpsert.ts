import { stockCountsAPI, type StockCountItemPayload } from '@/api/stockCounts';

const CHUNK_SIZE = 100;

export async function upsertStockCountItemsChunked(
  id: string,
  items: StockCountItemPayload[],
): Promise<void> {
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const chunk = items.slice(i, i + CHUNK_SIZE);
    await stockCountsAPI.upsertItems(id, chunk);
  }
}
