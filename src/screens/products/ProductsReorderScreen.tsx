import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categoriesAPI } from '@/api/categories';
import { productsAPI } from '@/api/products';
import { AppScreen } from '@/components/layout';
import { ReorderList } from '@/components/lists/ReorderList';
import { AppButton, AppSelect } from '@/components/ui';
import { AppText as UiText } from '@/components/ui/AppText';
import { AppLoadingState } from '@/components/feedback';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type { Category, Product } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { textStart } from '@/constants/layout';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductsReorder'>;

export function ProductsReorderScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_products');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    categoriesAPI.getAll({ per_page: 200 }).then((res) => {
      const rows = extractArray<Category>(res);
      setCategories(rows);
      if (rows[0]) setCategoryId(String(rows[0].id));
    }).catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await productsAPI.getAll({ category_id: Number(categoryId), per_page: 500 });
      setItems(extractArray<Product>(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const save = async () => {
    if (!categoryId) return;
    setSaving(true);
    setError(null);
    try {
      await categoriesAPI.reorderProducts(
        Number(categoryId),
        items.map((p, i) => ({ id: p.id, sort_order: i })),
      );
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const categoryName = categories.find((cat) => String(cat.id) === categoryId)?.name;

  if (!canManage) {
    return (
      <AppScreen title="ترتيب المنتجات" onBack={navigation.goBack}>
        <UiText style={{ color: c.textMuted, textAlign: 'center' }}>ليس لديك صلاحية</UiText>
      </AppScreen>
    );
  }

  return (
    <AppScreen title="ترتيب المنتجات" onBack={navigation.goBack} scroll={false} contentStyle={{ padding: 0 }}>
      <View style={styles.page}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <View style={ds.heroOuter}>
            <View style={ds.heroAccent} />
            <View style={ds.heroBody}>
              <Text style={ds.heroEyebrow}>نقطة البيع</Text>
              <Text style={ds.heroTitle}>ترتيب المنتجات</Text>
              <Text style={ds.heroSubtitle}>
                {categoryName
                  ? `ترتيب منتجات «${categoryName}» — استخدم ↑ ↓ ثم احفظ.`
                  : 'اختر تصنيفاً ثم رتّب المنتجات كما تظهر في نقطة البيع.'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.toolbar}>
          <AppSelect
            label="التصنيف"
            value={categoryId}
            options={categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))}
            onChange={setCategoryId}
          />
          <AppButton title="حفظ الترتيب" onPress={() => void save()} loading={saving} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!loading && items.length > 0 ? (
            <Text style={styles.hint}>{items.length} منتج — الترتيب يؤثر على شاشة البيع</Text>
          ) : null}
        </View>

        {loading ? <AppLoadingState /> : null}
        <ReorderList
          items={items}
          keyExtractor={(item) => String(item.id)}
          title={(item) => item.name}
          subtitle={() => '↑ ↓ لتغيير الترتيب'}
          onChange={setItems}
          emptyMessage="لا توجد منتجات في هذا التصنيف"
        />
      </View>
    </AppScreen>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    page: { flex: 1 },
    toolbar: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    error: { ...textStart, textAlign: 'center', fontSize: typography.small, color: c.danger },
    hint: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
  });
}
