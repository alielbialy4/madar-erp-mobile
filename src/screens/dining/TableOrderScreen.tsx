import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { diningAPI } from '@/api/dining';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { useBranchStore } from '@/store/branchStore';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

type TableItem = {
  id: string;
  name?: string;
  number?: number | string;
  status?: string;
  capacity?: number;
};

type ActionMode = 'merge' | 'transfer' | null;

export function TableOrderScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawTableId = route.params?.tableId;
  if (!rawTableId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف الطاولة مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <TableOrder tableId={String(rawTableId)} tableName={route.params?.tableName || 'طلب الطاولة'} navigation={navigation} />;
}

function TableOrder({ tableId, tableName, navigation }: { tableId: string; tableName: string; navigation: any }) {
  const activeBranch = useBranchStore((state) => state.activeBranch);

  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [settleConfirm, setSettleConfirm] = useState(false);
  const [releaseConfirm, setReleaseConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await diningAPI.getActiveOrder(tableId);
      setOrder((response.data as any)?.order ?? (response.data as any) ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openTablePicker = async (mode: ActionMode) => {
    if (!activeBranch?.id || !mode) return;
    setActionMode(mode);
    setSelectedTable(null);
    setTablesLoading(true);
    try {
      const status = mode === 'merge' ? 'occupied' : 'available';
      const response = await diningAPI.listTablesForBranch(activeBranch.id, status);
      const data = response.data as any;
      const list: TableItem[] = Array.isArray(data?.tables)
        ? data.tables.filter((t: TableItem) => String(t.id) !== tableId)
        : [];
      setTables(list);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
      setTables([]);
    } finally {
      setTablesLoading(false);
    }
  };

  const closeTablePicker = () => {
    setActionMode(null);
    setSelectedTable(null);
    setTables([]);
  };

  const requestConfirm = (table: TableItem) => {
    setSelectedTable(table);
    setConfirmVisible(true);
  };

  const executeAction = async () => {
    if (!selectedTable || !actionMode) return;
    setActionLoading(true);
    try {
      if (actionMode === 'merge') {
        await diningAPI.mergeOrder(tableId, String(selectedTable.id));
      } else {
        await diningAPI.transferOrder(tableId, String(selectedTable.id));
      }
      setMessage(actionMode === 'merge' ? 'تم دمج الطاولات بنجاح' : 'تم نقل الطلب بنجاح');
      setConfirmVisible(false);
      closeTablePicker();
      await load();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const settle = async () => {
    setMessage(null);
    setActionLoading(true);
    try {
      const total = Number(order?.total ?? order?.grand_total ?? 0);
      const response = await diningAPI.settleOrder(tableId, { payment_type: 'cash', paid: total });
      setMessage(response.message || 'تمت تسوية الطاولة');
      await load();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setActionLoading(false);
      setSettleConfirm(false);
    }
  };

  const releaseTable = async () => {
    setActionLoading(true);
    try {
      await diningAPI.releaseForPos(tableId);
      setMessage('تم إخلاء الطاولة');
      await load();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setActionLoading(false);
      setReleaseConfirm(false);
    }
  };

  const confirmTitle = actionMode === 'merge' ? 'تأكيد دمج الطاولات' : 'تأكيد نقل الطلب';
  const confirmMessage =
    actionMode === 'merge'
      ? `هل تريد دمج طلب هذه الطاولة مع "${selectedTable?.name || selectedTable?.number || '—'}"؟ سيتم نقل جميع الأصناف.`
      : `هل تريد نقل طلب هذه الطاولة إلى "${selectedTable?.name || selectedTable?.number || '—'}"؟`;

  return (
    <AppScreen title={tableName} onBack={navigation.goBack} refreshing={loading} onRefresh={load}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !order ? (
        <AppEmptyState
          title="لا يوجد طلب نشط"
          message="يمكن إضافة أصناف للطاولة من شاشة نقطة البيع عند فتح طلب طاولة."
        />
      ) : null}
      {order ? (
        <>
          <AppCard>
            <AppSectionHeader title="ملخص الطلب" />
            <Text style={styles.summaryText}>الإجمالي: {money(order.total ?? 0)}</Text>
            <Text style={styles.summaryText}>الحالة: {String(order.status ?? '—')}</Text>
          </AppCard>

          <AppCard>
            <AppSectionHeader title="الأصناف" />
            {(order.items ?? []).length === 0 ? (
              <AppEmptyState title="لا توجد أصناف" />
            ) : (
              order.items.map((item: any, index: number) => (
                <AppListItem
                  key={String(item.id ?? index)}
                  title={String(item.product?.name ?? item.product_name ?? 'صنف')}
                  subtitle={`الكمية: ${numberText(item.quantity)}`}
                  meta={money(item.subtotal ?? 0)}
                />
              ))
            )}
          </AppCard>

          <AppCard>
            <AppSectionHeader title="إجراءات الطاولة" />
            {message ? <Text style={styles.messageText}>{message}</Text> : null}
            <View style={styles.actionsContainer}>
              <AppButton title="تسوية نقدية" onPress={() => setSettleConfirm(true)} loading={actionLoading && settleConfirm} />
              <AppButton
                title="نقل الطلب"
                variant="secondary"
                onPress={() => openTablePicker('transfer')}
              />
              <AppButton
                title="دمج مع طاولة"
                variant="secondary"
                onPress={() => openTablePicker('merge')}
              />
              <AppButton
                title="إخلاء الطاولة"
                variant="ghost"
                onPress={() => setReleaseConfirm(true)}
              />
            </View>
          </AppCard>
        </>
      ) : null}

      <AppBottomSheet visible={actionMode !== null} onClose={closeTablePicker}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            {actionMode === 'merge' ? 'اختر طاولة مزدحمة للدمج' : 'اختر طاولة فارغة للنقل'}
          </Text>
          <AppBadge
            label={actionMode === 'merge' ? 'مزدحمة فقط' : 'فارغة فقط'}
            tone={actionMode === 'merge' ? 'warning' : 'success'}
          />
        </View>

        {tablesLoading ? (
          <AppLoadingState />
        ) : tables.length === 0 ? (
          <AppEmptyState
            title={
              actionMode === 'merge'
                ? 'لا توجد طاولات مزدحمة متاحة للدمج'
                : 'لا توجد طاولات فارغة متاحة للنقل'
            }
          />
        ) : (
          <FlatList
            data={tables}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <AppListItem
                title={item.name || `طاولة ${item.number ?? item.id}`}
                subtitle={`السعة: ${item.capacity ?? '—'}`}
                badge={
                  <AppBadge
                    label={item.status === 'available' ? 'فارغة' : item.status === 'occupied' ? 'مزدحمة' : String(item.status ?? '—')}
                    tone={item.status === 'available' ? 'success' : item.status === 'occupied' ? 'warning' : 'default'}
                  />
                }
                onPress={() => requestConfirm(item)}
              />
            )}
            contentContainerStyle={styles.tableList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={actionMode === 'merge' ? 'دمج' : 'نقل'}
        onConfirm={executeAction}
        onCancel={() => setConfirmVisible(false)}
        loading={actionLoading}
      />

      <ConfirmDialog
        visible={settleConfirm}
        title="تأكيد التسوية النقدية"
        message={`سيتم تسوية الطاولة بمبلغ ${money(order?.total ?? 0)}. هل أنت متأكد؟`}
        confirmLabel="تسوية"
        onConfirm={settle}
        onCancel={() => setSettleConfirm(false)}
        loading={actionLoading}
      />

      <ConfirmDialog
        visible={releaseConfirm}
        title="تأكيد إخلاء الطاولة"
        message="سيتم إخلاء الطاولة. هل أنت متأكد؟"
        confirmLabel="إخلاء"
        onConfirm={releaseTable}
        onCancel={() => setReleaseConfirm(false)}
        loading={actionLoading}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summaryText: {
    ...textStart,
    fontSize: typography.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  messageText: {
    ...textStart,
    fontSize: typography.small,
    color: colors.info,
    marginBottom: spacing.md,
  },
  actionsContainer: {
    gap: spacing.md,
  },
  sheetHeader: {
    ...flexRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: typography.h3,
    fontWeight: '900',
    color: colors.text,
    ...textStart,
    flex: 1,
  },
  tableList: {
    paddingBottom: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },
});
