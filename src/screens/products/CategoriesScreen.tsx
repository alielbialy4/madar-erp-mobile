import React from 'react';
import { categoriesAPI } from '@/api/categories';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import type { Category } from '@/types/api';

export function CategoriesScreen() {
  return (
    <CrudListScreen<Category & Record<string, unknown>>
      title="التصنيفات"
      subtitle="تصنيفات المنتجات"
      loader={categoriesAPI.getAll}
      itemTitle={(item) => item.name}
      itemSubtitle={(item) => item.description ?? undefined}
      itemBadge={(item) => ({ label: item.active === false ? 'غير نشط' : 'نشط', tone: item.active === false ? 'warning' : 'success' })}
      emptyTitle="لا توجد تصنيفات"
    />
  );
}
