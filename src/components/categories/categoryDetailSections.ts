import type { Category } from '@/types/api';
import type { DetailField } from '@/components/products/productDetailSections';
import { numberText } from '@/utils/format';

export function buildCategoryDetailFields(category: Category): DetailField[] {
  const isActive = category.active !== false;
  const fields: DetailField[] = [
    {
      label: 'الحالة',
      value: isActive ? 'نشط' : 'غير نشط',
      kind: 'text',
      tone: isActive ? 'success' : 'warning',
    },
    {
      label: 'عدد المنتجات',
      value: numberText(category.products_count ?? 0),
      kind: 'count',
    },
  ];

  if (category.sort_order != null) {
    fields.push({
      label: 'ترتيب POS',
      value: numberText(category.sort_order),
      kind: 'count',
    });
  }

  if (category.description?.trim()) {
    fields.push({
      label: 'الوصف',
      value: category.description.trim(),
      kind: 'text',
    });
  }

  return fields;
}
