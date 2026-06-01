import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { productsAPI } from '@/api/products';
import { AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { ProductDetailHero } from '@/components/products/ProductDetailHero';
import { DetailInfoCard } from '@/components/products/DetailInfoCard';
import { ProductInsightBlock } from '@/components/products/ProductInsightBlock';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import type { Product } from '@/types/api';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { ProductsStackParamList } from '@/types/navigation';
import { money, numberText } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductDetail'>;
type Route = RouteProp<ProductsStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const rawId = route.params?.id;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!rawId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await productsAPI.getById(Number(rawId));
      const p = extractData<Product>(res);
      setProduct(p ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const contentGap = useMemo(() => ({ gap: spacing.md }), []);

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

  if (loading && !product) {
    return (
      <AppScreen title="تفاصيل المنتج" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }
  if (error && !product) {
    return (
      <AppScreen title="تفاصيل المنتج" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={() => void load()} />
      </AppScreen>
    );
  }
  if (!product) {
    return (
      <AppScreen title="تفاصيل المنتج" onBack={navigation.goBack}>
        <AppErrorState message="المنتج غير موجود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }

  const bc = ((product.barcodes ?? []).filter(Boolean).join('، ') || product.barcode) ?? '—';
  const sku = (product as Product & { sku?: string; code?: string }).sku ?? (product as Product & { code?: string }).code ?? '—';
  const isRawMaterial = route.params?.mode === 'raw_material'
    || ['raw_material', 'packaging_material', 'semi_finished'].includes(String(product.product_role ?? ''));

  const pricingCard = (
    <DetailInfoCard
      title={isRawMaterial ? 'التكلفة' : 'التسعير'}
      icon="sell"
      fields={isRawMaterial
        ? [
            { label: 'تكلفة الشراء', value: money(product.cost_price ?? 0) },
            { label: 'قابل للشراء', value: product.is_purchasable === false ? 'لا' : 'نعم' },
            { label: 'مكون وصفة', value: product.is_recipe_ingredient === false ? 'لا' : 'نعم' },
          ]
        : [
            { label: 'سعر البيع', value: money(product.selling_price ?? 0) },
            { label: 'سعر ترويجي', value: product.is_promotional ? money(product.promotional_price ?? 0) : '—' },
            { label: 'التكلفة', value: money(product.cost_price ?? 0) },
            { label: 'هامش تقريبي', value: money(Math.max(0, Number(product.selling_price ?? 0) - Number(product.cost_price ?? 0))) },
          ]}
    />
  );

  const identityCard = (
    <DetailInfoCard
      title="التعريف"
      icon="qr-code-2"
      fields={[
        { label: 'SKU / الكود', value: String(sku), ltr: true },
        { label: 'الباركود', value: bc, ltr: true },
        { label: 'التصنيف', value: product.category?.name ?? '—' },
        {
          label: 'الوحدة الأساسية',
          value:
            (product as Product & { base_unit?: { name?: string }; unit?: { name?: string } }).base_unit?.name ??
            (product as Product & { unit?: { name?: string } }).unit?.name ??
            '—',
        },
      ]}
    />
  );

  const stockCard = (
    <DetailInfoCard
      title="المخزون والحالة"
      icon="inventory"
      fields={[
        {
          label: 'نوع المخزون',
          value:
            product.inventory_mode === 'recipe_product'
              ? 'منتج بوصفة'
              : product.inventory_mode === 'non_stock' || product.track_inventory === false
                ? 'غير مخزني'
                : 'منتج مخزني',
        },
        { label: 'تتبع الصلاحية', value: product.track_expiry ? 'نعم' : 'لا' },
        { label: 'حد التنبيه', value: numberText(product.min_stock_alert ?? 0) },
        {
          label: 'المتاح',
          value: numberText(
            product.branch_available_quantity ?? product.available_quantity ?? product.stock_quantity ?? 0,
          ),
        },
        { label: 'الحالة', value: product.active === false || product.is_active === false ? 'غير نشط' : 'نشط' },
        { label: 'مميز', value: product.featured ? 'نعم' : 'لا' },
      ]}
    />
  );

  const insights = (
    <>
      <ProductInsightBlock
        title="الوحدات"
        icon="straighten"
        emptyMessage="لا توجد وحدات"
        rows={(product.units ?? []).map((u) => ({
          key: String(u.id),
          label: u.name,
          value: `${u.is_base ? 'أساسية • ' : ''}معامل ${numberText(u.factor_to_base ?? 1)}`,
        }))}
      />
      <ProductInsightBlock
        title="خيارات / موديفايرز"
        icon="tune"
        emptyMessage="لا توجد مجموعات خيارات"
        rows={(product.option_groups ?? []).map((g) => ({
          key: String(g.id),
          label: g.title ?? g.name ?? '—',
          value: `${g.is_required ? 'إلزامي' : 'اختياري'}: ${(g.options ?? []).map((o) => o.name).join('، ')}`,
        }))}
      />
    </>
  );

  return (
    <>
      <AppScreen title={isRawMaterial ? 'تفاصيل الخامة' : 'تفاصيل المنتج'} onBack={navigation.goBack} scroll contentStyle={{ padding: 0, gap: 0 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.xxxl, backgroundColor: c.background }}
        >
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <ProductDetailHero
              product={product}
              canManage={canManage}
              onInsights={() => navigation.navigate('ProductInsights', { id, name: product.name })}
              onEdit={canManage ? () => navigation.navigate('ProductForm', { id, mode: isRawMaterial ? 'raw_material' : 'product' }) : undefined}
              onDelete={canManage ? () => setDeleteOpen(true) : undefined}
              large={isTablet}
            />
          </View>

          {isTablet ? (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg }}>
              <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' }}>
                <View style={{ flex: 1, ...contentGap }}>{pricingCard}{identityCard}</View>
                <View style={{ flex: 1, ...contentGap }}>{stockCard}</View>
              </View>
              {product.description ? (
                <DetailInfoCard title="الوصف" icon="description" fields={[{ label: 'نص المنتج', value: product.description }]} />
              ) : null}
              <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                <View style={{ flex: 1 }}>{insights}</View>
              </View>
            </View>
          ) : (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, ...contentGap }}>
              {pricingCard}
              {identityCard}
              {stockCard}
              {product.description ? (
                <DetailInfoCard title="الوصف" icon="description" fields={[{ label: 'نص', value: product.description }]} />
              ) : null}
              {insights}
            </View>
          )}
        </ScrollView>
      </AppScreen>
      <ConfirmDialog
        visible={deleteOpen}
        title={isRawMaterial ? 'حذف الخامة' : 'حذف المنتج'}
        message={`هل أنت متأكد من حذف «${product.name}»؟`}
        loading={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
