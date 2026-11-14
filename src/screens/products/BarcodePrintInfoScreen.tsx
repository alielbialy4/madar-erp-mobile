import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import * as Print from 'expo-print';
import Barcode from 'react-native-barcode-svg';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, useToast } from '@/components/feedback';
import { AppButton, AppInput, AppListItem, AppText as Text } from '@/components/ui';
import { MadarSurface } from '@/components/madar';
import { productsAPI } from '@/api/products';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { buildBarcodeLabelHtml } from '@/utils/code128Svg';
import { money } from '@/utils/format';
import type { Product } from '@/types/api';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';

type Selected = { product: Product; barcode: string; quantity: number };

function productBarcode(product: Product): string | null {
  const list = (product.barcodes ?? []).map((b) => String(b).trim()).filter(Boolean);
  if (list[0]) return list[0];
  const single = product.barcode != null ? String(product.barcode).trim() : '';
  return single || null;
}

/** Mobile parity for web `/barcode-print` — search, select, preview, AirPrint/HTML labels. */
export function BarcodePrintInfoScreen({ navigation }: { navigation: any }) {
  const toast = useToast();
  const c = useColors();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Selected[]>([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await productsAPI.search(trimmed);
      setResults(extractArray<Product>(res));
    } catch (err) {
      setResults([]);
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void search(query);
    }, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const addProduct = (product: Product) => {
    const barcode = productBarcode(product);
    if (!barcode) {
      toast.error('لا يوجد باركود لهذا المنتج');
      return;
    }
    setSelected((prev) => {
      const existing = prev.find((row) => row.product.id === product.id);
      if (existing) {
        return prev.map((row) =>
          row.product.id === product.id ? { ...row, quantity: row.quantity + 1 } : row,
        );
      }
      return [...prev, { product, barcode, quantity: 1 }];
    });
  };

  const labelsHtml = useMemo(
    () =>
      buildBarcodeLabelHtml(
        selected.map((row) => ({
          name: row.product.name,
          barcode: row.barcode,
          price: money(Number(row.product.selling_price ?? 0)),
          copies: row.quantity,
        })),
      ),
    [selected],
  );

  const handlePrint = async () => {
    if (selected.length === 0) {
      setError('أضف منتجاً واحداً على الأقل');
      return;
    }
    setPrinting(true);
    setError(null);
    try {
      await Print.printAsync({ html: labelsHtml });
      toast.success('تم فتح ورقة الطباعة');
    } catch (err) {
      setError(normalizeApiError(err).message);
      toast.error(normalizeApiError(err).message);
    } finally {
      setPrinting(false);
    }
  };

  return (
    <ListScreenLayout title="طباعة الباركود" subtitle="بحث · معاينة · طباعة" onBack={navigation.goBack}>
      <View style={{ gap: spacing.md, paddingBottom: spacing.xxl }}>
        <AppBanner
          tone="info"
          message="مكافئ جوال لمسار الويب /barcode-print عبر expo-print (AirPrint/نظام). المعاينة على الشاشة تستخدم CODE128."
        />
        {error ? <AppBanner tone="danger" message={error} /> : null}

        <AppInput label="بحث منتج" value={query} onChangeText={setQuery} placeholder="اسم أو باركود" />
        {loading ? <Text style={textStart}>جاري البحث...</Text> : null}
        {results.slice(0, 12).map((product) => (
          <MadarSurface key={String(product.id)} padded={false}>
            <AppListItem
              title={product.name}
              subtitle={productBarcode(product) ?? 'بدون باركود'}
              meta={money(Number(product.selling_price ?? 0))}
              onPress={() => addProduct(product)}
            />
          </MadarSurface>
        ))}

        <Text style={{ ...textStart, fontWeight: '700' }}>المحدد للطباعة ({selected.length})</Text>
        {selected.length === 0 ? (
          <Text style={{ ...textStart, color: c.textMuted }}>لا توجد ملصقات بعد.</Text>
        ) : (
          selected.map((row) => (
            <MadarSurface key={`sel-${row.product.id}`}>
              <Text style={textStart}>{row.product.name}</Text>
              <Text style={textStart}>{row.barcode}</Text>
              <View style={{ alignItems: 'center', marginVertical: spacing.sm }}>
                <Barcode value={row.barcode} format="CODE128" singleBarWidth={1.2} height={48} />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <AppButton
                  title="−"
                  size="sm"
                  variant="secondary"
                  onPress={() =>
                    setSelected((prev) =>
                      prev
                        .map((r) =>
                          r.product.id === row.product.id ? { ...r, quantity: r.quantity - 1 } : r,
                        )
                        .filter((r) => r.quantity > 0),
                    )
                  }
                />
                <Text style={textStart}>{`× ${row.quantity}`}</Text>
                <AppButton
                  title="+"
                  size="sm"
                  onPress={() =>
                    setSelected((prev) =>
                      prev.map((r) =>
                        r.product.id === row.product.id ? { ...r, quantity: r.quantity + 1 } : r,
                      ),
                    )
                  }
                />
                <AppButton
                  title="إزالة"
                  size="sm"
                  variant="danger"
                  onPress={() => setSelected((prev) => prev.filter((r) => r.product.id !== row.product.id))}
                />
              </View>
            </MadarSurface>
          ))
        )}

        <AppButton title="طباعة الملصقات" onPress={() => void handlePrint()} loading={printing} disabled={selected.length === 0} />
        <AppButton
          title="فتح المنتجات"
          variant="outline"
          onPress={() => navigation.getParent?.()?.navigate('ProductsTab', { screen: 'ProductsHome' })}
        />
      </View>
    </ListScreenLayout>
  );
}
