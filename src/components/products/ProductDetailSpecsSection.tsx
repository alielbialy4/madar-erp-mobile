import React from 'react';
import { DetailInfoCard } from './DetailInfoCard';
import { buildSpecsFields } from './productDetailSections';
import type { Product } from '@/types/api';

type Props = {
  product: Product;
  flat?: boolean;
};

export function ProductDetailSpecsSection({ product, flat }: Props) {
  const fields = buildSpecsFields(product);
  if (!fields.length) return null;

  return (
    <DetailInfoCard
      title="المواصفات والتخزين"
      icon="science"
      hint="بيانات إضافية عن المنتج"
      fields={fields}
      columns={2}
      variant={flat ? 'flat' : 'card'}
    />
  );
}
