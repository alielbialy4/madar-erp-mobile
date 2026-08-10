import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { categoriesAPI } from '@/api/categories';
import { AppErrorState, AppLoadingState, ConfirmDialog, useToast } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { CategoryDetailHero } from '@/components/categories/CategoryDetailHero';
import { DetailInfoCard } from '@/components/products/DetailInfoCard';
import { buildCategoryDetailFields } from '@/components/categories/categoryDetailSections';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import type { Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'CategoryDetail'>;
type Route = RouteProp<ProductsStackParamList, 'CategoryDetail'>;

export function CategoryDetailScreen({ route, navigation }: { route: Route; navigation: Nav }) {
  const toast = useToast();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_categories');
  const rawId = route.params?.id;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!rawId) return;
      if (opts.silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await categoriesAPI.getById(Number(rawId));
        const cat = extractData<Category>(res);
        setCategory(cat ?? null);
      } catch (err) {
        setError(normalizeApiError(err).message);
        if (!opts.silent) setCategory(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rawId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const contentStyle = useMemo(
    () => [styles.content, isTablet && styles.contentTablet],
    [isTablet],
  );

  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف التصنيف مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }

  const id = Number(rawId);

  const remove = async () => {
    setDeleting(true);
    try {
      await categoriesAPI.delete(id);
      toast.success('تم حذف التصنيف');
      navigation.goBack();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const isInitialLoad = loading && !category;
  const screenTitle = category?.name ?? route.params?.name ?? 'تفاصيل التصنيف';
  const detailFields = category ? buildCategoryDetailFields(category) : [];

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
          {category ? (
            <CategoryDetailHero
              category={category}
              canManage={canManage}
              onProducts={() => navigation.navigate('ProductsHome', { category_id: id })}
              onEdit={canManage ? () => navigation.navigate('CategoryForm', { id }) : undefined}
              onDelete={canManage ? () => setDeleteOpen(true) : undefined}
              onRefresh={() => void load({ silent: true })}
              isLoading={refreshing}
              loading={isInitialLoad}
            />
          ) : null}

          {isInitialLoad ? <AppLoadingState variant="skeleton" skeletonRows={4} /> : null}
          {error && !category ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

          {category && detailFields.length > 0 ? (
            <DetailInfoCard title="معلومات التصنيف" icon="category" fields={detailFields} columns={2} variant="flat" />
          ) : null}
        </View>
      </AppScreen>

      {category ? (
        <ConfirmDialog
          visible={deleteOpen}
          title="حذف التصنيف"
          message={`هل تريد حذف «${category.name}»؟ لا يمكن التراجع.`}
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
});
