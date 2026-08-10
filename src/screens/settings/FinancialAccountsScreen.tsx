import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { financialAccountsAPI } from '@/api/financialAccounts';
import { ListScreenLayout, MasterDetailLayout } from '@/components/layout';
import { ResourceList } from '@/components/lists';
import { AppBadge, AppText } from '@/components/ui';
import { FinancialValue } from '@/components/madar';
import { FinancialAccountDetailScreen } from '@/screens/settings/FinancialAccountDetailScreen';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useColors } from '@/hooks/useColors';
import { isTablet } from '@/constants/responsive';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { money } from '@/utils/format';
import { chevronForwardIcon } from '@/utils/rtl';
import type { FinancialAccount } from '@/types/api';

type Navigation = {
  navigate: (screen: 'FinancialAccountDetail', params: { id: string; name?: string }) => void;
};

function accountCapabilities(account: FinancialAccount): string {
  return [
    account.allow_sales !== false ? 'مبيعات' : null,
    account.allow_expenses ? 'مصروفات' : null,
    account.allow_deposits ? 'إيداع' : null,
    account.allow_withdrawals ? 'سحب' : null,
    account.allow_transfers ? 'تحويل' : null,
  ].filter(Boolean).join(' · ');
}

function accountScope(account: FinancialAccount): string {
  if (account.branch_scope === 'all_branches') return 'كل الفروع';
  if (account.branch_scope === 'selected_branches') return `${account.branch_links?.length ?? 0} فروع محددة`;
  return 'نطاق غير محدد';
}

function FinancialAccountRow({
  account,
  onPress,
  selected,
}: {
  account: FinancialAccount;
  onPress: () => void;
  selected?: boolean;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const active = account.is_active !== false;
  const hasBalance = account.balance != null;
  const capabilities = accountCapabilities(account);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={`${account.name}، ${hasBalance ? money(account.balance, account.currency ?? 'ج.م') : 'الرصيد غير متاح'}`}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={styles.accountMark}>
        <MaterialIcons name="account-balance-wallet" size={20} color={active ? c.textMuted : c.textCaption} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText style={styles.title} numberOfLines={1}>{account.name}</AppText>
          <AppBadge
            label={!active ? 'متوقف' : account.is_default ? 'افتراضي' : 'نشط'}
            tone={!active ? 'danger' : account.is_default ? 'info' : 'success'}
          />
        </View>
        <AppText style={styles.identity} numberOfLines={1}>
          {[account.provider_name, account.masked_identifier, account.payment_method].filter(Boolean).join(' · ') || 'حساب مالي'}
        </AppText>
        <AppText style={styles.scope} numberOfLines={1}>
          {accountScope(account)}{capabilities ? ` · ${capabilities}` : ''}
        </AppText>
        {account.reconciliation ? (
          <View style={styles.warningRow}>
            <MaterialIcons name="warning-amber" size={14} color={c.warning} />
            <AppText style={styles.warning}>يحتاج مراجعة مطابقة</AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.valueColumn}>
        <FinancialValue
          amount={hasBalance ? Number(account.balance) : '—'}
          currency={hasBalance ? (account.currency ?? 'ج.م') : undefined}
          level="inline"
          tone={hasBalance ? 'default' : 'muted'}
        />
        <AppText style={styles.balanceLabel}>الرصيد الحالي</AppText>
        <MaterialIcons name={chevronForwardIcon()} size={18} color={c.textCaption} />
      </View>
    </Pressable>
  );
}

export function FinancialAccountsScreen({ navigation }: { navigation: Navigation }) {
  const { width } = useWindowDimensions();
  const tablet = isTablet(width);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | undefined>();
  const debounced = useDebouncedValue(query);
  const params = useMemo(() => ({ ...(debounced ? { search: debounced } : {}), per_page: 50 }), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<FinancialAccount>(
    financialAccountsAPI.list,
    params,
  );

  const activeCount = items.filter((account) => account.is_active !== false).length;
  const balanceCount = items.filter((account) => account.balance != null).length;
  const warningCount = items.filter((account) => Boolean(account.reconciliation)).length;

  const openAccount = (account: FinancialAccount) => {
    if (tablet) {
      setSelectedId(String(account.id));
      setSelectedName(account.name);
      return;
    }
    navigation.navigate('FinancialAccountDetail', { id: String(account.id), name: account.name });
  };

  return (
    <ListScreenLayout
      title="الحسابات المالية"
      subtitle="الأرصدة والحركة التشغيلية حسب الصلاحية ونطاق الفرع"
      noHeader
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="بحث باسم الحساب أو مقدم الخدمة..."
      onRefresh={refresh}
      refreshing={refreshing}
      contentStyle={tablet ? { flex: 1 } : undefined}
      hero={{
        eyebrow: 'المالية',
        title: 'الحسابات المالية',
        subtitle: 'افتح الحساب لمراجعة النشاط أو تنفيذ إيداع وسحب وتحويل مصرح به.',
        stats: [
          { label: 'حسابات ظاهرة', value: items.length },
          { label: 'نشطة', value: activeCount, tone: 'success' },
          { label: 'رصيد متاح', value: balanceCount },
          { label: 'مراجعة مطابقة', value: warningCount, tone: warningCount ? 'warning' : 'default' },
        ],
        compact: true,
      }}
    >
      <MasterDetailLayout
        emptyTitle="اختر حسابًا"
        emptyMessage="اختر حسابًا من القائمة لمراجعة الرصيد والحركة دون مغادرة الشاشة."
        masterWidth={420}
        master={
          <ResourceList
            data={items}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onRefresh={refresh}
            onEndReached={loadMore}
            emptyTitle="لا توجد حسابات مالية متاحة ضمن صلاحياتك"
            keyExtractor={(account) => String(account.id)}
            renderItem={({ item }) => (
              <FinancialAccountRow
                account={item}
                selected={tablet && selectedId === String(item.id)}
                onPress={() => openAccount(item)}
              />
            )}
          />
        }
        detail={
          selectedId ? (
            <FinancialAccountDetailScreen
              key={selectedId}
              route={{
                key: `embedded-${selectedId}`,
                name: 'FinancialAccountDetail',
                params: { id: selectedId, name: selectedName, embedded: true },
              } as any}
              navigation={
                {
                  goBack: () => setSelectedId(null),
                  navigate: navigation.navigate as any,
                  setOptions: () => undefined,
                } as any
              }
            />
          ) : null
        }
      />
    </ListScreenLayout>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    row: {
      ...flexRow,
      minHeight: 64,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
      backgroundColor: c.surface,
    },
    rowSelected: {
      backgroundColor: c.surfaceMuted,
      borderStartWidth: 3,
      borderStartColor: c.accent,
    },
    rowPressed: { backgroundColor: c.surfaceMuted },
    accountMark: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1, minWidth: 0, gap: 2 },
    titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    title: { ...textStart, flexShrink: 1, color: c.text, fontFamily: fonts.medium, fontWeight: '600', fontSize: typography.rowPrimary },
    identity: { ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.rowSecondary },
    scope: { ...textStart, color: c.textCaption, fontFamily: fonts.regular, fontSize: typography.metadata },
    warningRow: { ...flexRow, alignItems: 'center', gap: spacing.xs },
    warning: { ...textStart, color: c.warning, fontFamily: fonts.medium, fontSize: typography.micro },
    valueColumn: { alignItems: 'flex-end', gap: 2, flexShrink: 0, maxWidth: '36%' },
    balanceLabel: { ...textStart, color: c.textCaption, fontFamily: fonts.regular, fontSize: typography.micro },
  });
}
