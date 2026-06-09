import type { Product } from '@/types/api';
import { buildSpecsFields } from './productDetailSections';

export type DetailSectionKey = 'stock' | 'pricing' | 'identity' | 'pos' | 'recipe' | 'extra';

export type DetailSectionMeta = {
  key: DetailSectionKey;
  step: number;
  title: string;
  subtitle?: string;
  columns?: 1 | 2;
};

function hasPosContent(product: Product): boolean {
  return (
    (product.variants?.length ?? 0) > 0 ||
    (product.option_groups?.length ?? 0) > 0 ||
    (product.units?.length ?? 0) > 0
  );
}

function hasRecipeContent(product: Product): boolean {
  return (product.recipes?.length ?? 0) > 0 || Boolean(product.recipe_costing);
}

function hasExtraContent(product: Product): boolean {
  return Boolean(product.description?.trim()) || buildSpecsFields(product).length > 0;
}

export function getProductDetailSections(product: Product, isRawMaterial: boolean): DetailSectionMeta[] {
  const candidates: Array<Omit<DetailSectionMeta, 'step'> & { visible: boolean }> = [
    {
      key: 'stock',
      visible: true,
      title: 'المخزون والحالة',
      subtitle: 'الكميات المتاحة وإعدادات التتبع',
      columns: 1,
    },
    {
      key: 'pricing',
      visible: true,
      title: isRawMaterial ? 'التكلفة' : 'التسعير',
      subtitle: isRawMaterial ? 'تكلفة الشراء وإعدادات الشراء' : 'الأسعار والهامش وفترة العرض',
      columns: 1,
    },
    {
      key: 'identity',
      visible: true,
      title: 'التعريف',
      subtitle: 'SKU والباركود ودور المنتج',
      columns: 1,
    },
    {
      key: 'pos',
      visible: !isRawMaterial && hasPosContent(product),
      title: 'نقطة البيع',
      subtitle: 'المتغيرات والخيارات ووحدات القياس',
      columns: 2,
    },
    {
      key: 'recipe',
      visible: !isRawMaterial && hasRecipeContent(product),
      title: 'الوصفة والتكلفة',
      subtitle: 'مكونات الإنتاج وتكلفة الوصفة',
      columns: 1,
    },
    {
      key: 'extra',
      visible: hasExtraContent(product),
      title: 'معلومات إضافية',
      subtitle: 'الوصف والمواصفات التفصيلية',
      columns: 2,
    },
  ];

  return candidates
    .filter((s) => s.visible)
    .map((s, index) => {
      const { visible: _v, ...meta } = s;
      return { ...meta, step: index + 1 };
    });
}
