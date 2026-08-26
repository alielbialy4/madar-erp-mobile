import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { hrAPI, type AttendanceStatus, type HrEmployee } from '@/api/hr';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, ConfirmDialog, useToast } from '@/components/feedback';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppDatePicker, AppInput, AppSelect, AppText as Text } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { MadarSection } from '@/components/madar';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'half_day', 'leave', 'holiday'];

type RowState = {
  user_id: number;
  name: string;
  status: AttendanceStatus;
  check_in: string;
};

const needsCheckIn = (status: AttendanceStatus) => status === 'present' || status === 'late' || status === 'half_day';

const todayLocalDateString = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  half_day: 'نصف يوم',
  leave: 'إجازة',
  holiday: 'عطلة',
};

const statusOptions: SelectOption[] = STATUSES.map((s) => ({ label: STATUS_LABELS[s], value: s }));

type ExistingRecord = {
  user_id: number;
  status: AttendanceStatus;
  check_in?: string | null;
};

export function AttendanceTodayScreen() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const viewMode = useBranchStore((state) => state.viewMode);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const canManage = hasPermission(user, 'manage_attendance');
  const isBranchView = viewMode === 'branch';

  const [branchId, setBranchId] = useState('');
  const [date, setDate] = useState(todayLocalDateString());
  const [rows, setRows] = useState<RowState[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);

  const branchOptions = useMemo<SelectOption[]>(
    () => branches.map((b) => ({ label: b.name, value: String(b.id) })),
    [branches],
  );

  useEffect(() => {
    if (isBranchView && activeBranch?.id) setBranchId(String(activeBranch.id));
    else if (!isBranchView && !branchId && branches.length > 0) setBranchId(String(branches[0].id));
  }, [isBranchView, activeBranch, branches, branchId]);

  const load = useCallback(async () => {
    if (!canManage || !branchId || !date) return;
    setLoading(true);
    setError(null);
    try {
      const [eligibleRes, listRes] = await Promise.all([
        hrAPI.attendance.eligible(branchId),
        hrAPI.attendance.list(branchId, date),
      ]);
      const existing = new Map<number, { status: AttendanceStatus; check_in: string }>();
      for (const r of extractArray<ExistingRecord>(listRes)) {
        existing.set(r.user_id, {
          status: r.status,
          check_in: r.check_in ? String(r.check_in).slice(0, 5) : '',
        });
      }
      const eligible = extractArray<HrEmployee>(eligibleRes);
      setRows(
        eligible.map((u) => ({
          user_id: u.id,
          name: u.name,
          status: existing.get(u.id)?.status ?? 'present',
          check_in: existing.get(u.id)?.check_in ?? '',
        })),
      );
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [branchId, canManage, date]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const map: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, half_day: 0, leave: 0, holiday: 0 };
    for (const row of rows) map[row.status] += 1;
    return map;
  }, [rows]);

  const updateRow = (userId: number, patch: Partial<RowState>) => {
    setRows((prev) => prev.map((row) => (row.user_id === userId ? { ...row, ...patch } : row)));
  };

  const markAllPresent = () => {
    setRows((prev) => prev.map((row) => ({ ...row, status: 'present' as AttendanceStatus })));
  };

  const save = async () => {
    if (!branchId) return;
    setConfirmSave(false);
    setSaving(true);
    setError(null);
    try {
      await hrAPI.attendance.bulk({
        branch_id: branchId,
        date,
        rows: rows.map((r) => ({
          user_id: r.user_id,
          status: r.status,
          check_in: needsCheckIn(r.status) && r.check_in ? r.check_in : undefined,
        })),
      });
      toast.success('تم حفظ الحضور بنجاح');
      await load();
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <ListScreenLayout title="الحضور" subtitle="تسجيل حضور اليوم">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية إدارة الحضور." />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="الحضور"
      subtitle="تسجيل حضور العاملين ليوم محدد وحفظه دفعة واحدة"
      onRefresh={() => void load()}
      refreshing={loading}
      hero={{
        eyebrow: 'الموارد البشرية',
        title: 'حضور اليوم',
        subtitle: 'حدد الفرع والتاريخ ثم سجل الحضور',
        stats: [{ label: 'العاملون', value: rows.length }],
        compact: true,
      }}
      filters={
        <>
          {!isBranchView ? (
            <AppSelect label="الفرع" value={branchId} options={branchOptions} onChange={setBranchId} />
          ) : null}
          <AppDatePicker label="التاريخ" value={date} onChange={setDate} />
          <AppButton title="تحديث" variant="outline" onPress={() => void load()} loading={loading} />
        </>
      }
    >
      {error ? <AppBanner tone="danger" message={error} /> : null}

      {rows.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.badgeRow}>
            <AppBadge label={`${rows.length} عامل`} tone="default" />
            <AppBadge label={`${STATUS_LABELS.present}: ${counts.present}`} tone="success" />
            <AppBadge label={`${STATUS_LABELS.absent}: ${counts.absent}`} tone="danger" />
            <AppBadge label={`${STATUS_LABELS.late}: ${counts.late}`} tone="warning" />
          </View>
          <View style={styles.actionsRow}>
            <AppButton title="الكل حاضر" variant="outline" onPress={markAllPresent} disabled={saving || loading} />
            <AppButton
              title="حفظ الحضور"
              onPress={() => setConfirmSave(true)}
              disabled={saving || loading || rows.length === 0}
              loading={saving}
            />
          </View>
        </View>
      ) : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.sm }} showsVerticalScrollIndicator={false}>
        {rows.map((row) => (
          <MadarSection key={row.user_id} title={row.name}>
            <View style={styles.rowBody}>
              <AppSelect
                label="الحالة"
                value={row.status}
                options={statusOptions}
                onChange={(value) =>
                  updateRow(row.user_id, {
                    status: (value || 'present') as AttendanceStatus,
                    check_in: needsCheckIn((value as AttendanceStatus) || 'present') ? row.check_in : '',
                  })
                }
              />
              <AppInput
                label="وقت الحضور (HH:mm)"
                value={row.check_in}
                onChangeText={(v) => updateRow(row.user_id, { check_in: v })}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                placeholder="08:30"
                editable={needsCheckIn(row.status)}
              />
            </View>
          </MadarSection>
        ))}
        {!loading && rows.length === 0 ? (
          <Text style={styles.empty}>لا يوجد عاملون مؤهلون لتسجيل الحضور في هذا الفرع.</Text>
        ) : null}
      </ScrollView>

      <ConfirmDialog
        visible={confirmSave}
        title="حفظ الحضور"
        message={`سيتم حفظ حالة حضور ${rows.length} عامل ليوم ${date}.`}
        confirmLabel="حفظ"
        loading={saving}
        onCancel={() => setConfirmSave(false)}
        onConfirm={() => void save()}
      />
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  rowBody: { gap: spacing.sm },
  empty: { textAlign: 'center', paddingVertical: spacing.lg },
});
