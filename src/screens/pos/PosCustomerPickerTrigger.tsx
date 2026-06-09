import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppButton, AppListItem, AppSearchField } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { AppText as Text } from '@/components/ui/AppText';
import type { Customer } from '@/types/api';
import { money } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

type Props = {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onQuickAdd?: () => void;
};

export function PosCustomerPickerTrigger({ customers, selectedCustomer, onSelectCustomer, onQuickAdd }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers.slice(0, 120);
    return customers
      .filter((cust) => {
        const hay = [cust.name, cust.phone].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 80);
  }, [customers, query]);

  const closeSheet = () => {
    setOpen(false);
    setQuery('');
  };

  const handleSelect = (customer: Customer) => {
    onSelectCustomer(customer);
    closeSheet();
  };

  const handleClear = () => {
    onSelectCustomer(null);
    closeSheet();
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          minHeight: 52,
          borderRadius: radius.xl,
          borderWidth: 1.5,
          borderColor: selectedCustomer ? c.primary : c.border,
          backgroundColor: selectedCustomer ? c.primarySoftMuted : c.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          ...flexRow,
          alignItems: 'center',
          gap: spacing.sm,
        }}
        accessibilityRole="button"
        accessibilityLabel="اختيار عميل"
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radius.lg,
            backgroundColor: selectedCustomer ? c.primary : c.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons
            name={selectedCustomer ? 'person' : 'person-outline'}
            size={20}
            color={selectedCustomer ? c.primaryForeground : c.textMuted}
          />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {selectedCustomer ? (
            <>
              <Text style={{ ...textStart, fontFamily: fonts.bold, fontSize: typography.body, color: c.text }} numberOfLines={1}>
                {selectedCustomer.name}
              </Text>
              <Text style={{ ...textStart, fontFamily: fonts.medium, fontSize: typography.tiny, color: c.textMuted }} numberOfLines={1}>
                {selectedCustomer.phone ?? 'بدون هاتف مسجّل'}
              </Text>
            </>
          ) : (
            <Text style={{ ...textStart, fontFamily: fonts.bold, fontSize: typography.body, color: c.textMuted }}>
              بيع بدون عميل — اضغط للاختيار
            </Text>
          )}
        </View>
        {selectedCustomer ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onSelectCustomer(null);
            }}
            hitSlop={8}
            style={{
              width: 32,
              height: 32,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: c.borderSubtle,
              backgroundColor: c.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="مسح العميل"
          >
            <MaterialIcons name="close" size={18} color={c.textMuted} />
          </Pressable>
        ) : (
          <MaterialIcons name="chevron-left" size={24} color={c.textCaption} />
        )}
      </Pressable>

      <AppBottomSheet visible={open} onClose={closeSheet} title="اختيار عميل">
        <View style={{ gap: spacing.md }}>
          <AppSearchField value={query} onChangeText={setQuery} compact placeholder="بحث بالاسم أو الهاتف..." />
          {onQuickAdd ? (
            <AppButton title="إضافة عميل سريع" variant="secondary" fullWidth onPress={() => { closeSheet(); onQuickAdd(); }} />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 400 }}
            ListEmptyComponent={<AppEmptyState title="لا يوجد عملاء مطابقون" />}
            ListFooterComponent={
              <AppButton title="بيع بدون عميل" variant="outline" fullWidth onPress={handleClear} style={{ marginTop: spacing.sm }} />
            }
            renderItem={({ item }) => (
              <AppListItem
                title={item.name}
                subtitle={item.phone ?? undefined}
                meta={item.wallet_balance != null ? `محفظة: ${money(item.wallet_balance)}` : undefined}
                onPress={() => handleSelect(item)}
              />
            )}
          />
        </View>
      </AppBottomSheet>
    </>
  );
}
