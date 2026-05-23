import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { vaultsAPI } from '@/api/vaults';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { asText, dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { statusTone } from '@/screens/shared/CrudListScreen';

type VaultTransactionRow = Record<string, unknown> & {
  id?: string | number;
  type?: string | null;
  amount?: string | number | null;
  description?: string | null;
  reference?: string | null;
  reference_no?: string | null;
  created_at?: string | null;
  transaction_date?: string | null;
  vault?: { name?: string | null } | null;
};

function typeLabel(type?: string | null) {
  switch (type) {
    case 'deposit': return 'إيداع';
    case 'withdraw':
    case 'withdrawal': return 'سحب';
    case 'transfer_in': return 'تحويل وارد';
    case 'transfer_out': return 'تحويل صادر';
    case 'sale': return 'بيع';
    case 'expense': return 'مصروف';
    default: return type || 'حركة';
  }
}

export function VaultTransactionsScreen({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const params = useMemo(() => ({ search: debounced, per_page: 20 }), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<VaultTransactionRow>(
    vaultsAPI.transactionsAll,
    params,
  );
  const styles = useMemo(() => StyleSheet.create({
    searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  }), []);

  return (
    <AppScreen title="حركات الخزن" subtitle="سجل مالي للقراءة والتتبع" scroll={false} onBack={navigation.goBack}>
      <View style={styles.searchWrap}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث برقم المرجع أو الوصف..." />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد حركات خزنة"
        keyExtractor={(item, index) => `${asText(item.id, 'tx')}-${index}`}
        renderItem={({ item }) => (
          <AppListItem
            title={item.description ?? typeLabel(item.type)}
            subtitle={`${item.vault?.name ?? 'خزنة غير محددة'} • ${dateText(item.transaction_date ?? item.created_at)}`}
            meta={`${money(item.amount ?? 0)} • ${asText(item.reference_no ?? item.reference, 'بدون مرجع')}`}
            badge={<AppBadge label={typeLabel(item.type)} tone={statusTone(item.type)} />}
            onPress={() => navigation.navigate('VaultTransactionDetail', { id: String(item.id) })}
          />
        )}
      />
    </AppScreen>
  );
}
