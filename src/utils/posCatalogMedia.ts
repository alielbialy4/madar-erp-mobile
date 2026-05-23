import type { Product } from '@/types/api';
import { resolveMediaUrl } from '@/utils/media';

type CategoryLike = {
  id: string | number;
  image?: string | null;
  image_url?: string | null;
};

function categoryImagePath(category: CategoryLike): string | null {
  return category.image ?? category.image_url ?? null;
}

export function resolveCategoryThumbnail(
  categoryId: number | string,
  categoryImage: string | null | undefined,
  products: Product[] = [],
): string | null {
  const direct = resolveMediaUrl(categoryImage);
  if (direct) return direct;

  const id = Number(categoryId);
  if (!Number.isFinite(id)) return null;

  const firstWithImage = products.find(
    (product) => Number(product.category_id) === id && product.image,
  );
  return firstWithImage ? resolveMediaUrl(firstWithImage.image) : null;
}

export function buildCategoryThumbnailMap(
  categories: CategoryLike[],
  products: Product[],
): Record<string, string | null> {
  const map: Record<string, string | null> = {};
  for (const category of categories) {
    map[String(category.id)] = resolveCategoryThumbnail(category.id, categoryImagePath(category), products);
  }
  return map;
}
