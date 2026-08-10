import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { ApiEnvelope, ListParams } from '@/types/api';
import type { Expense, ExpenseCategory } from '@/types/expenses';
import { expensesAPI } from '@/api/expenses';
import { HeroActionChip, ListScreenLayout, MasterDetailLayout } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { AppBadge } from '@/components/ui/AppBadge';
import { FinancialRow } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { ExpenseDetailScreen } from '@/screens/expenses/ExpenseDetailScreen';
import { useListResource } from '@/hooks/useListResource';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useBranchStore } from '@/store/branchStore';
import { usePermissions } from '@/hooks/usePermissions';
import { isTablet } from '@/constants/responsive';
import { useWindowDimensions } from 'react-native';
import { extractArray } from '@/utils/data';
import { dateText, money, numberText } from '@/utils/format';
import { expensePaymentTotals } from '@/utils/expenseFinancials';
import {
  EMPTY_EXPENSE_FILTERS,
  ExpenseFiltersSheet,
  countExpenseFilters,
  type ExpenseListFilters,
} from './ExpenseFiltersSheet';

function statusPresentation(status?: string): { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  switch (status) {
    case 'paid': return { label: 'مدفوع', tone: 'success' };
    case 'partially_paid': return { label: 'مدفوع جزئياً', tone: 'warning' };
    case 'approved': return { label: 'معتمد', tone: 'info' };
    case 'draft': return { label: 'مسودة', tone: 'default' };
    case 'cancelled': return { label: 'ملغي', tone: 'danger' };
    default: return { label: 'غير مدفوع', tone: 'warning' };
  }
}
function paymentSourceLabel(expense: Expense): string {
  if (expense.cash_source === 'drawer') return 'درج الوردية';
  const names = (expense.payment_lines ?? expense.paymentLines ?? [])
    .filter((line) => line.status !== 'reversed')
    .map((line) => line.financial_account?.name ?? line.financialAccount?.name ?? line.vault?.name)
    .filter(Boolean);
  return names.length > 0 ? Array.from(new Set(names)).join('، ') : 'حساب مالي';
}

export function ExpensesScreen({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const tablet = isTablet(width);
  const { can } = usePermissions();
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const branches = useBranchStore((state) => state.branches);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<ExpenseListFilters>({ ...EMPTY_EXPENSE_FILTERS });
  const [filterOpen, setFilterOpen] = useState(false);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [summary, setSummary] = useState<{ total: number; count: number }>({ total: 0, count: 0 });
  const [focusVersion, setFocusVersion] = useState(0);
  const debouncedQuery = useDebouncedValue(query);

  const canCreate = can(['pay_expense', 'process_sales', 'manage_expenses', 'access_admin_routes']);
  const canManage = can(['manage_expenses', 'access_admin_routes']);
  const globalView = viewMode === 'global';

  useEffect(() => {
    expensesAPI.getCategories({
      is_active: true,
      ...(viewMode === 'branch' && activeBranch?.id ? { branch_id: activeBranch.id } : {}),
    })
      .then((response) => setCategories(extractArray<ExpenseCategory>(response)))
      .catch(() => setCategories([]));
  }, [activeBranch?.id, viewMode]);

  useFocusEffect(useCallback(() => {
    setFocusVersion((version) => version + 1);
  }, []));

  const listParams = useMemo<ListParams>(() => ({
    ...(debouncedQuery.trim() ? { search: debouncedQuery.trim() } : {}),
    ...(filters.expense_category_id ? { expense_category_id: filters.expense_category_id } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.cash_source ? { cash_source: filters.cash_source } : {}),
    ...(filters.from_date ? { from_date: filters.from_date } : {}),
    ...(filters.to_date ? { to_date: filters.to_date } : {}),
    ...(filters.min_amount ? { min_amount: filters.min_amount } : {}),
    ...(filters.max_amount ? { max_amount: filters.max_amount } : {}),
    ...(globalView && filters.branch_id
      ? { branch_id: filters.branch_id }
      : !globalView && activeBranch?.id
        ? { branch_id: activeBranch.id }
        : {}),
    sort_by: 'expense_date',
    sort_dir: 'desc',
    focus_version: focusVersion,
  }), [activeBranch?.id, debouncedQuery, filters, focusVersion, globalView]);

  const loader = useCallback(async (params: ListParams): Promise<ApiEnvelope<Expense[]>> => {
    const requestParams = { ...params };
    delete requestParams.focus_version;
    const response = await expensesAPI.getAll(requestParams);
    const payload = response.data;
    setSummary({
      total: Number(payload?.summary?.total ?? 0),
      count: Number(payload?.summary?.count ?? 0),
    });
    return {
      ...response,
      data: payload?.expenses ?? [],
      pagination: payload?.pagination,
    };
  }, []);

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Expense>(loader, listParams);
  const activeFilterCount = countExpenseFilters(filters);

  const openExpense = (id: number) => {
    if (tablet) {
      setSelectedId(id);
      return;
    }
    navigation.navigate('ExpenseDetail', { id });
  };

  return (
    <>
      <ListScreenLayout
        title="المصروفات"
        subtitle="الالتزام المالي، الدفع، والمراجعة"
        noHeader
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="التصنيف، الوصف أو المرجع..."
        commandsInlineOnPhone
        onRefresh={refresh}
        refreshing={refreshing}
        contentStyle={tablet ? { flex: 1 } : undefined}
        filters={(
          <AppButton
            title={activeFilterCount > 0 ? `الفلاتر (${numberText(activeFilterCount)})` : 'الفلاتر'}
            variant={activeFilterCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            onPress={() => setFilterOpen(true)}
          />
        )}
        hero={{
          eyebrow: globalView ? 'مالية كل الفروع' : activeBranch?.name ?? 'المالية',
          title: 'المصروفات التشغيلية',
          subtitle: 'افصل تاريخ الاستحقاق عن حركة الدفع وراجع المتبقي قبل أي إجراء',
          stats: [
            { label: 'إجمالي مستحق', value: money(summary.total), tone: 'danger' },
            { label: 'عدد المصروفات', value: numberText(summary.count) },
            { label: 'نتائج ظاهرة', value: numberText(items.length) },
          ],
          actions: (
            <>
              {canCreate ? <HeroActionChip label="مصروف جديد" icon="add" onPress={() => navigation.navigate('ExpenseCreate')} /> : null}
              {canManage ? <HeroActionChip label="التصنيفات" icon="category" onPress={() => navigation.navigate('ExpenseCategories')} /> : null}
              {canManage ? <HeroActionChip label="المتكررة" icon="event-repeat" onPress={() => navigation.navigate('RecurringExpenses')} /> : null}
            </>
          ),
          compact: true,
        }}
        fab={canCreate ? { onPress: () => navigation.navigate('ExpenseCreate'), label: 'مصروف جديد' } : undefined}
      >
        <MasterDetailLayout
          emptyTitle="اختر مصروفًا"
          emptyMessage="اختر مصروفًا من القائمة لمراجعة الالتزام والدفع دون مغادرة الشاشة."
          master={
            <ResourceList<Expense>
              data={items}
              loading={loading}
              refreshing={refreshing}
              error={error}
              onRefresh={refresh}
              onEndReached={loadMore}
              emptyTitle="لا توجد مصروفات مطابقة"
              emptyCtaLabel={canCreate ? 'تسجيل مصروف' : undefined}
              onEmptyCta={canCreate ? () => navigation.navigate('ExpenseCreate') : undefined}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => {
                const payment = expensePaymentTotals(item);
                const status = statusPresentation(item.status);
                return (
                  <FinancialRow
                    primary={item.category?.name ?? `مصروف #${item.id}`}
                    secondary={item.description?.trim() || 'بدون وصف'}
                    meta={[
                      dateText(item.expense_date ?? item.created_at ?? ''),
                      globalView ? item.branch?.name ?? 'مصروف عام' : null,
                      paymentSourceLabel(item),
                      payment.remaining > 0 ? `متبقي ${money(payment.remaining)}` : 'مسدد',
                    ].filter(Boolean).join(' · ')}
                    amount={item.amount}
                    currency="ج.م"
                    amountTone={payment.remaining > 0 ? 'negative' : 'default'}
                    status={<AppBadge label={status.label} tone={status.tone} />}
                    selected={tablet && selectedId === item.id}
                    onPress={() => openExpense(item.id)}
                  />
                );
              }}
            />
          }
          detail={
            selectedId != null ? (
              <ExpenseDetailScreen
                key={selectedId}
                route={{
                  key: `embedded-expense-${selectedId}`,
                  name: 'ExpenseDetail',
                  params: { id: selectedId, embedded: true },
                } as any}
                navigation={{
                  goBack: () => setSelectedId(null),
                  navigate: navigation.navigate,
                  setOptions: () => undefined,
                } as any}
              />
            ) : null
          }
        />
      </ListScreenLayout>

      <ExpenseFiltersSheet
        visible={filterOpen}
        filters={filters}
        categories={categories}
        branches={branches}
        showBranch={globalView}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />
    </>
  );
}
