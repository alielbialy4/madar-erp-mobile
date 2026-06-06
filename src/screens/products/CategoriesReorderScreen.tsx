import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { categoriesAPI } from '@/api/categories';
import { AppScreen } from '@/components/layout';
import { ReorderList } from '@/components/lists/ReorderList';
import { AppButton } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { useAuthStore } from '@/store/authStore';
import type { Category } from '@/types/api';
import type { ProductsStackParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'CategoriesReorder'>;

export function CategoriesReorderScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_categories');
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        toolbar: { padding: spacing.lg, gap: spacing.sm },
        error: { color: c.shiftAlertFg, textAlign: 'center' },
      }),
    [c],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoriesAPI.getAll({ per_page: 200 });
      setItems(extractArray<Category>(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await categoriesAPI.reorder(items.map((c, i) => ({ id: c.id, sort_order: i })));
      navigation.goBack();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <AppScreen title="ترتيب التصنيفات" onBack={navigation.goBack}>
        <Text style={{ textAlign: 'center' }}>ليس لديك صلاحية</Text>
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="ترتيب التصنيفات"
      subtitle="استخدم الأسهم — يؤثر على ترتيب نقطة البيع"
      onBack={navigation.goBack}
      scroll={false}
    >
      <View style={styles.toolbar}>
        <AppButton title="حفظ الترتيب" onPress={() => void save()} loading={saving} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      {loading ? <AppLoadingState /> : null}
      <ReorderList
        items={items}
        keyExtractor={(item) => String(item.id)}
        title={(item) => item.name}
        subtitle={() => 'اضغط ↑ أو ↓ لتغيير الترتيب'}
        onChange={setItems}
        emptyMessage="لا توجد تصنيفات"
      />
    </AppScreen>
  );
}

