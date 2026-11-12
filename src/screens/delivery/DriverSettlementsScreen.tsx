import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import {
  driverSettlementsAPI,
  type DriverSettlementDepositContext,
  type DriverSettlementDepositTarget,
  type DriverSettlementQueueDriver,
  type DriverSettlementUnsettledRow,
} from '@/api/driverSettlements';
import type { EligibleRegisterMoneySession } from '@/api/posRegisters';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppChip, AppInput, AppSelect, AppListItem } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AttentionBand, MadarSurface } from '@/components/madar';
import { AppBanner, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { RegisterDrawerSessionPicker } from '@/components/pos/RegisterDrawerSessionPicker';
import { useListResource } from '@/hooks/useListResource';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { asText, dateText, money } from '@/utils/format';
import { canCreateDriverSettlement } from '@/utils/driverSettlementPermissions';
import {
  completeIdempotencyAttempt,
  idempotencyKeyForAttempt,
  resolveIdempotencyAttemptAfterError,
} from '@/utils/idempotencyAttempt';
import {
  buildDriverSettlementMoneyContext,
  driverSettlementRegisterSessionRequired,
} from '@/utils/buildDriverSettlementMoneyContext';
import { buildDriverSettlementPayload } from '@/utils/driverSettlementPayload';
import { tryAcquireSubmitLock } from '@/utils/submitLock';
import type { ApiEnvelope, ListParams } from '@/types/api';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';

export function DriverSettlementsScreen({ navigation }: { navigation: any }) {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const branchId = useBranchStore((s) => s.activeBranch?.id ?? null);
  const shiftMode = String(
    useBranchStore((s) => s.activeBranch?.settings?.register_mode) ?? 'legacy_shared_drawer',
  );
  const canManage = canCreateDriverSettlement(user);

  const loader = useCallback(
    (p: ListParams) => driverSettlementsAPI.list(p) as Promise<ApiEnvelope<Record<string, unknown>[]>>,
    [],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource(loader, {});

  const [createOpen, setCreateOpen] = useState(false);
  const [queueDrivers, setQueueDrivers] = useState<DriverSettlementQueueDriver[]>([]);
  const [depositContext, setDepositContext] = useState<DriverSettlementDepositContext | null>(null);
  const [driverId, setDriverId] = useState('');
  const [rows, setRows] = useState<DriverSettlementUnsettledRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [amountReceived, setAmountReceived] = useState('');
  const [depositTarget, setDepositTarget] = useState<DriverSettlementDepositTarget>('current_drawer');
  const [vaultId, setVaultId] = useState('');
  const [confirmVault, setConfirmVault] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadingUnsettled, setLoadingUnsettled] = useState(false);
  const [drawerSessionId, setDrawerSessionId] = useState('');
  const [drawerSession, setDrawerSession] = useState<EligibleRegisterMoneySession | null>(null);
  const [drawerBlocked, setDrawerBlocked] = useState(false);
  const submitLockRef = useRef(false);
  const idempotencyRef = useRef<{ current: string | null }>({ current: null });
  const needsRegisterSession = shiftMode === 'multi_register' && depositTarget === 'current_drawer';

  const dueTotal = useMemo(
    () =>
      rows
        .filter((r) => selectedIds.includes(String(r.delivery.id)))
        .reduce((sum, r) => sum + Number(r.due_preview ?? r.delivery.amount_due_from_driver ?? 0), 0),
    [rows, selectedIds],
  );

  const openCreate = async () => {
    setCreateOpen(true);
    setFormError(null);
    setDriverId('');
    setRows([]);
    setSelectedIds([]);
    setAmountReceived('');
    setNotes('');
    setConfirmVault(false);
    setDrawerSessionId('');
    setDrawerSession(null);
    setDrawerBlocked(false);
    setLoadingUnsettled(false);
    idempotencyRef.current.current = null;
    try {
      const res = await driverSettlementsAPI.queue(branchId ? { branch_id: branchId } : undefined);
      const data = extractData<Record<string, unknown>>(res) as unknown as {
        drivers?: DriverSettlementQueueDriver[];
        deposit_context?: DriverSettlementDepositContext;
      } | null;
      const drivers = data?.drivers ?? [];
      setQueueDrivers(drivers);
      const ctx = data?.deposit_context ?? null;
      setDepositContext(ctx);
      setDepositTarget(ctx?.default_deposit_target ?? 'current_drawer');
      setVaultId(ctx?.available_vaults?.[0]?.id ? String(ctx.available_vaults[0].id) : '');
      if (drivers[0]?.driver_id) {
        setLoadingUnsettled(true);
        setDriverId(String(drivers[0].driver_id));
      }
    } catch (err) {
      setFormError(normalizeApiError(err).message);
      setQueueDrivers([]);
      setLoadingUnsettled(false);
    }
  };

  useEffect(() => {
    if (!createOpen || !driverId) return;
    let cancelled = false;
    driverSettlementsAPI
      .unsettled({
        driver_id: driverId,
        ...(branchId ? { branch_id: branchId } : {}),
      })
      .then((res) => {
        if (cancelled) return;
        const data = extractData<Record<string, unknown>>(res) as unknown as {
          deliveries?: DriverSettlementUnsettledRow[];
          totals?: { total_due_from_driver?: number };
          deposit_context?: DriverSettlementDepositContext;
        } | null;
        const deliveries = data?.deliveries ?? [];
        setRows(deliveries);
        setSelectedIds(deliveries.map((d) => String(d.delivery.id)));
        const due = Number(data?.totals?.total_due_from_driver ?? 0);
        setAmountReceived(String(due));
        if (data?.deposit_context) {
          setDepositContext(data.deposit_context);
          setDepositTarget(data.deposit_context.default_deposit_target ?? 'current_drawer');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setRows([]);
          setSelectedIds([]);
          setFormError(normalizeApiError(err).message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingUnsettled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [createOpen, driverId, branchId]);

  const toggleDelivery = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = async () => {
    const moneyContext = buildDriverSettlementMoneyContext({
      shiftMode,
      depositTarget,
      drawerSession,
    });
    if (
      driverSettlementRegisterSessionRequired({
        shiftMode,
        depositTarget,
        moneyContext,
      }) ||
      (needsRegisterSession && drawerBlocked)
    ) {
      setFormError('اختر جلسة درج مفتوحة قبل إيداع تسوية السائق في الدرج.');
      return;
    }
    const built = buildDriverSettlementPayload({
      branchId,
      driverId,
      deliveryIds: selectedIds,
      amountReceived,
      depositTarget,
      vaultId,
      confirmPhysicalVaultDeposit: confirmVault,
      hasOpenShift: Boolean(depositContext?.open_shift),
      notes,
      clientUuid: idempotencyKeyForAttempt(idempotencyRef.current),
      posRegisterId: moneyContext.pos_register_id ?? null,
      registerSessionId: moneyContext.register_session_id ?? null,
    });
    if (!built.ok) {
      const messages = {
        missing_driver: 'اختر السائق',
        missing_deliveries: 'اختر طلبات للتسوية',
        invalid_amount: 'أدخل مبلغاً صالحاً',
        missing_vault: 'اختر الخزنة',
        confirm_vault_required: 'أكد إيداع النقد في الخزنة فعلياً',
        no_open_shift: 'لا توجد وردية مفتوحة لإيداع الدرج',
      } as const;
      setFormError(messages[built.error]);
      return;
    }
    if (!tryAcquireSubmitLock(submitLockRef)) return;
    setBusy(true);
    setFormError(null);
    try {
      await driverSettlementsAPI.create(built.payload);
      completeIdempotencyAttempt(idempotencyRef.current);
      toast.success('تم تسجيل تسوية السائق');
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      resolveIdempotencyAttemptAfterError(idempotencyRef.current, normalized);
      setFormError(normalized.message);
      toast.error(normalized.message);
    } finally {
      submitLockRef.current = false;
      setBusy(false);
    }
  };

  return (
    <AppScreen title="تسويات السائقين" subtitle="تحصيل COD وإيداع الدرج/الخزنة" onBack={navigation.goBack} scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <AttentionBand
          title="سلامة مالية"
          items={[
            {
              id: 'uuid',
              title: 'client_uuid على الإنشاء',
              detail: 'يُختم معرف عميل ثابت لكل محاولة تسوية لمنع التكرار.',
              tone: 'info',
            },
          ]}
        />
        <MadarSurface style={{ gap: spacing.sm }}>
          {canManage ? <AppButton title="تسوية سائق جديدة" onPress={() => void openCreate()} /> : null}
          <AppButton
            title="لوحة مالية التوصيل"
            variant="secondary"
            onPress={() => navigation.navigate('DeliveryFinanceDashboard')}
          />
        </MadarSurface>
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا تسويات"
        emptyCtaLabel={canManage ? 'تسوية جديدة' : undefined}
        onEmptyCta={canManage ? () => void openCreate() : undefined}
        keyExtractor={(row, index) => String(row.id ?? index)}
        renderItem={({ item }) => (
          <AppListItem
            title={`سائق ${asText((item.driver as Record<string, unknown>)?.name, String(item.driver_id ?? ''))}`}
            subtitle={dateText(asText(item.created_at ?? item.settled_at, ''))}
            meta={money(item.amount_received ?? 0)}
            badge={<AppBadge label={`${asText(item.deliveries_count, '0')} طلب`} tone="neutral" />}
          />
        )}
      />

      <AppBottomSheet visible={createOpen} onClose={() => !busy && setCreateOpen(false)} title="تسوية سائق">
        <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
          <AppSelect
            label="السائق"
            value={driverId}
            options={queueDrivers.map((d) => ({
              label: `${d.driver_name} · مستحق ${money(d.total_due_from_driver)}`,
              value: String(d.driver_id),
            }))}
            onChange={(value) => {
              setLoadingUnsettled(Boolean(value));
              setDriverId(value);
            }}
          />

          <Text style={textStart}>الطلبات غير المسوّاة {loadingUnsettled ? '(جاري التحميل…)' : ''}</Text>
          <View style={{ gap: spacing.xs }}>
            {rows.map((row) => {
              const id = String(row.delivery.id);
              const active = selectedIds.includes(id);
              const invoice = row.delivery.sale?.invoice_number ?? id.slice(0, 8);
              return (
                <AppChip
                  key={id}
                  label={`#${invoice} · ${money(row.due_preview ?? row.delivery.amount_due_from_driver ?? 0)}`}
                  active={active}
                  onPress={() => toggleDelivery(id)}
                />
              );
            })}
            {!loadingUnsettled && rows.length === 0 ? (
              <Text style={textStart}>لا طلبات مستحقة لهذا السائق.</Text>
            ) : null}
          </View>

          <AppInput
            label={`المبلغ المستلم (مستحق ${money(dueTotal)})`}
            value={amountReceived}
            onChangeText={setAmountReceived}
            keyboardType="decimal-pad"
          />

          <View style={{ gap: spacing.xs }}>
            <Text style={{ ...textStart, fontWeight: '700' }}>وجهة الإيداع</Text>
            <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.xs }}>
              <AppChip
                label="درج الوردية الحالية"
                active={depositTarget === 'current_drawer'}
                onPress={() => setDepositTarget('current_drawer')}
              />
              <AppChip
                label="خزنة أخرى"
                active={depositTarget === 'other_vault'}
                onPress={() => setDepositTarget('other_vault')}
              />
            </View>
            {depositTarget === 'current_drawer' ? (
              <>
                <Text style={textStart}>
                  {depositContext?.open_shift
                    ? `وردية #${depositContext.open_shift.shift_no ?? '—'} · ${depositContext.open_shift.vault_name ?? 'درج'}`
                    : 'لا توجد وردية مفتوحة'}
                </Text>
                <RegisterDrawerSessionPicker
                  visible={needsRegisterSession}
                  required={needsRegisterSession}
                  value={drawerSessionId}
                  onChange={(sessionId, session) => {
                    setDrawerSessionId(sessionId);
                    setDrawerSession(session);
                  }}
                  onAvailabilityChange={(info) => setDrawerBlocked(info.requiredBlocked)}
                />
              </>
            ) : (
              <>
                <AppSelect
                  label="الخزنة"
                  value={vaultId}
                  options={(depositContext?.available_vaults ?? []).map((v) => ({
                    label: v.name,
                    value: String(v.id),
                  }))}
                  onChange={setVaultId}
                />
                <AppChip
                  label={confirmVault ? 'تم تأكيد الإيداع الفعلي' : 'أكد إيداع النقد في الخزنة'}
                  active={confirmVault}
                  onPress={() => setConfirmVault((v) => !v)}
                />
              </>
            )}
          </View>

          <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} />
          {formError ? <AppBanner tone="danger" message={formError} /> : null}
          <AppButton title="تسجيل التسوية" loading={busy} onPress={() => void submit()} />
        </View>
      </AppBottomSheet>
    </AppScreen>
  );
}
