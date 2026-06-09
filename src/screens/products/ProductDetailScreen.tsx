import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { productsAPI } from '@/api/products';
import { AppErrorState, ConfirmDialog } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { ProductDetailHero } from '@/components/products/ProductDetailHero';
import { DetailInfoCard } from '@/components/products/DetailInfoCard';
import { ProductDetailSkeleton } from '@/components/products/ProductDetailSkeleton';
import { ProductInsightsSectionGroup } from '@/components/products/ProductInsightsSectionGroup';
import { ProductDetailRecipeSection } from '@/components/products/ProductDetailRecipeSection';
import { ProductDetailVariantsSection } from '@/components/products/ProductDetailVariantsSection';
import { ProductDetailOptionGroupsSection } from '@/components/products/ProductDetailOptionGroupsSection';
import { ProductDetailSpecsSection } from '@/components/products/ProductDetailSpecsSection';
import {
  buildDescriptionField,
  buildIdentityFields,
  buildPricingFields,
  buildStockFields,
  buildUnitsFields,
} from '@/components/products/productDetailSections';
import {
  getProductDetailSections,
  type DetailSectionKey,
  type DetailSectionMeta,
} from '@/components/products/productDetailLayout';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import type { Product } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductDetail'>;
type Route = RouteProp<ProductsStackParamList, 'ProductDetail'>;

type SectionRenderCtx = {
  product: Product;
  isRawMaterial: boolean;
};

function renderSectionContent(key: DetailSectionKey, ctx: SectionRenderCtx): React.ReactNode {
  const { product, isRawMaterial } = ctx;
  const flat = { variant: 'flat' as const };

  switch (key) {
    case 'stock':
      return (
        <DetailInfoCard
          title="المخزون"
          icon="inventory"
          fields={buildStockFields(product)}
          columns={2}
          {...flat}
        />
      );
    case 'pricing':
      return (
        <DetailInfoCard
          title={isRawMaterial ? 'التكلفة' : 'التسعير'}
          icon="sell"
          fields={buildPricingFields(product, isRawMaterial)}
          columns={2}
          {...flat}
        />
      );
    case 'identity':
      return (
        <DetailInfoCard title="التعريف" icon="qr-code-2" fields={buildIdentityFields(product)} columns={2} {...flat} />
      );
    case 'pos': {
      const unitsFields = buildUnitsFields(product);
      return (
        <>
          <ProductDetailVariantsSection product={product} flat />
          <ProductDetailOptionGroupsSection product={product} flat />
          {unitsFields.length > 0 ? (
            <DetailInfoCard title="وحدات المنتج" icon="straighten" fields={unitsFields} columns={2} {...flat} />
          ) : null}
        </>
      );
    }
    case 'recipe':
      return <ProductDetailRecipeSection product={product} flat />;
    case 'extra': {
      const descriptionField = buildDescriptionField(product);
      return (
        <>
          {descriptionField ? (
            <DetailInfoCard title="نص المنتج" icon="description" fields={[descriptionField]} {...flat} />
          ) : null}
          <ProductDetailSpecsSection product={product} flat />
        </>
      );
    }
    default:
      return null;
  }
}

function ProductDetailSections({ product, isRawMaterial }: SectionRenderCtx) {
  const sections = useMemo(() => getProductDetailSections(product, isRawMaterial), [product, isRawMaterial]);

  return (
    <>
      {sections.map((section: DetailSectionMeta, index) => (
        <ProductInsightsSectionGroup
          key={section.key}
          step={section.step}
          isFirst={index === 0}
          title={section.title}
          subtitle={section.subtitle}
          columns={section.columns}
        >
          {renderSectionContent(section.key, { product, isRawMaterial })}
        </ProductInsightsSectionGroup>
      ))}
    </>
  );
}

export function ProductDetailScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const rawId = route.params?.id;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!rawId) return;
      if (opts.silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.getById(Number(rawId));
        const p = extractData<Product>(res);
        setProduct(p ?? null);
        setLastUpdatedAt(new Date());
      } catch (err) {
        setError(normalizeApiError(err).message);
        if (!opts.silent) setProduct(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rawId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف المنتج مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  const id = Number(rawId);

  const remove = async () => {
    setDeleting(true);
    try {
      await productsAPI.delete(id);
      navigation.goBack();
    } catch {
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const isRawMaterial =
    route.params?.mode === 'raw_material' ||
    ['raw_material', 'packaging_material', 'semi_finished'].includes(String(product?.product_role ?? ''));

  const isInitialLoad = loading && !product;
  const isStaleRefresh = (loading || refreshing) && Boolean(product);
  const screenTitle = product?.name ?? (isRawMaterial ? 'تفاصيل الخامة' : 'تفاصيل المنتج');

  const contentStyle = useMemo(
    () => [styles.content, isTablet && styles.contentTablet],
    [isTablet],
  );

  return (
    <>
      <AppScreen
        title={screenTitle}
        onBack={navigation.goBack}
        scroll
        onRefresh={() => void load({ silent: true })}
        refreshing={refreshing}
        contentStyle={{ padding: 0, gap: 0 }}
      >
        <View style={contentStyle}>
          {product ? (
            <ProductDetailHero
              product={product}
              canManage={canManage}
              isRawMaterial={isRawMaterial}
              onInsights={() => navigation.navigate('ProductInsights', { id, name: product.name })}
              onEdit={
                canManage
                  ? () =>
                      navigation.navigate('ProductForm', {
                        id,
                        mode: isRawMaterial ? 'raw_material' : 'product',
                      })
                  : undefined
              }
              onDelete={canManage ? () => setDeleteOpen(true) : undefined}
              onRefresh={() => void load({ silent: true })}
              isLoading={refreshing}
              loading={isInitialLoad}
              lastUpdatedAt={lastUpdatedAt}
            />
          ) : null}

          {isInitialLoad ? <ProductDetailSkeleton /> : null}
          {error && !product ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

          {product ? (
            <View
              style={[styles.dataWrap, isStaleRefresh && styles.dataStale]}
              pointerEvents={isStaleRefresh ? 'none' : 'auto'}
            >
              <ProductDetailSections product={product} isRawMaterial={isRawMaterial} />
            </View>
          ) : null}
        </View>
      </AppScreen>

      {product ? (
        <ConfirmDialog
          visible={deleteOpen}
          title={isRawMaterial ? 'حذف الخامة' : 'حذف المنتج'}
          message={`هل أنت متأكد من حذف «${product.name}»؟`}
          loading={deleting}
          onConfirm={() => void remove()}
          onCancel={() => setDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  contentTablet: {
    gap: spacing.xl,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  dataWrap: {
    gap: spacing.sm,
  },
  dataStale: {
    opacity: 0.6,
  },
});
