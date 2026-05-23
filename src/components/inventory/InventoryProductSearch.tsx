import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { get } from '@/api/client';
import { AppInput } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { extractArray } from '@/utils/data';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type ProductRow = { id: number; name?: string; barcode?: string | null };

type Props = {
  onSelect: (product: ProductRow) => void;
  placeholder?: string;
};

export function InventoryProductSearch({ onSelect, placeholder = 'اسم أو باركود...' }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductRow[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await get('/products', { search: query, per_page: 20 });
        setResults(extractArray<ProductRow>(res));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={styles.wrap}>
      <AppInput label="بحث عن منتج" placeholder={placeholder} value={query} onChangeText={setQuery} />
      {searching ? (
        <View style={styles.hintRow}>
          <ActivityIndicator size="small" color={c.accent} />
          <Text style={styles.hint}>جاري البحث...</Text>
        </View>
      ) : null}
      {!searching && results.length > 0 ? (
        <View style={styles.results}>
          {results.map((product) => (
            <Pressable key={product.id} style={styles.resultItem} onPress={() => onSelect(product)}>
              <Text style={styles.resultTitle} numberOfLines={1}>
                {product.name ?? 'منتج'}
              </Text>
              {product.barcode ? <Text style={styles.resultSub}>{product.barcode}</Text> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      {!searching && query.length >= 2 && results.length === 0 ? (
        <Text style={styles.hint}>لا توجد نتائج</Text>
      ) : null}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm },
    hintRow: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    hint: { ...textStart, fontSize: typography.small, color: c.textMuted, fontFamily: fonts.medium },
    results: { gap: spacing.xs, maxHeight: 220 },
    resultItem: {
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    resultTitle: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    resultSub: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textCaption,
      marginTop: 2,
    },
  });
}
