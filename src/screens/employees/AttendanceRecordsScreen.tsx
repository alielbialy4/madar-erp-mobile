import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { hrAPI, type AttendanceDaySummary, type AttendanceRecord, type AttendanceStatus } from '@/api/hr';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppDatePicker, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { DenseRow } from '@/components/madar';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  half_day: 'نصف يوم',
  leave: 'إجازة',
  holiday: 'عطلة',
};

const STATUS_TONES: Record<AttendanceStatus, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  half_day: 'info',
  leave: 'neutral',
  holiday: 'neutral',
};

const todayLocalDateString = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export function AttendanceRecordsScreen() {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const viewMode = useBranchStore((state) => state.viewMode);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const canView = hasPermission(user, 'manage_attendance');
  const isBranchView = viewMode === 'branch';

  const [branchId, setBranchId] = useState('');
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(todayLocalDateString());
  const [days, setDays] = useState<AttendanceDaySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayRows, setDayRows] = useState<AttendanceRecord[]>([]);
  const [dayLoading, setDayLoading] = useState(false);

  const branchOptions = useMemo<SelectOption[]>(
    () => branches.map((b) => ({ label: b.name, value: String(b.id) })),
    [branches],
  );

  useEffect(() => {
    if (isBranchView && activeBranch?.id) setBranchId(String(activeBranch.id));
    else if (!isBranchView && !branchId && branches.length > 0) setBranchId(String(branches[0].id));
  }, [isBranchView, activeBranch, branches, branchId]);

  const loadDays = useCallback(async () => {
    if (!canView || !branchId || !dateFrom || !dateTo) return;
    setLoading(true);
    setError(null);
    try {
      const res = await hrAPI.attendance.days({ branch_id: branchId, date_from: dateFrom, date_to: dateTo });
      setDays(extractArray<AttendanceDaySummary>(res));
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
      setDays([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, canView, dateFrom, dateTo, toast]);

  useEffect(() => {
    setSelectedDate(null);
    void loadDays();
  }, [loadDays]);

  const openDay = async (date: string) => {
    if (!branchId) return;
    setSelectedDate(date);
    setDayLoading(true);
    try {
      const res = await hrAPI.attendance.list(branchId, date);
      setDayRows(extractArray<AttendanceRecord>(res));
    } catch (err) {
      const message = normalizeApiError(err).message;
      toast.error(message);
      setDayRows([]);
    } finally {
      setDayLoading(false);
    }
  };

  if (!canView) {
    return (
      <ListScreenLayout title="سجل الحضور" subtitle="سجل الحضور التاريخي">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية إدارة الحضور." />
      </ListScreenLayout>
    );
  }

  if (selectedDate) {
    return (
      <ListScreenLayout
        title={`حضور يوم ${selectedDate}`}
        subtitle="سجلات الحضور لليوم المحدد"
        onBack={() => setSelectedDate(null)}
        onRefresh={() => void openDay(selectedDate)}
        refreshing={dayLoading}
        headerRight={
          <AppButton title="عودة للأيام" variant="outline" onPress={() => setSelectedDate(null)} />
        }
      >
        <ResourceList
          data={dayRows}
          loading={dayLoading}
          refreshing={dayLoading}
          onRefresh={() => void openDay(selectedDate)}
          emptyTitle="لا توجد سجلات حضور لهذا اليوم"
          keyExtractor={(item, index) => String(item.id ?? `${item.user_id}-${index}`)}
          renderItem={({ item }) => (
            <DenseRow
              primary={item.user?.name ?? `#${item.user_id}`}
              secondary={`${STATUS_LABELS[item.status] ?? item.status}${item.late_minutes ? ` · تأخير ${item.late_minutes} د` : ''}`}
              meta={item.check_in ? `حضور ${String(item.check_in).slice(0, 5)}` : undefined}
              status={<AppBadge label={STATUS_LABELS[item.status] ?? item.status} tone={STATUS_TONES[item.status] ?? 'neutral'} />}
            />
          )}
        />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="سجل الحضور"
      subtitle="ملخص أيام الحضور حسب الفرع والفترة"
      onRefresh={() => void loadDays()}
      refreshing={loading}
      hero={{
        eyebrow: 'الموارد البشرية',
        title: 'أيام الحضور',
        subtitle: `${days.length} يوم مسجل في الفترة`,
        compact: true,
      }}
      filters={
        <>
          {!isBranchView ? (
            <AppSelect label="الفرع" value={branchId} options={branchOptions} onChange={setBranchId} />
          ) : null}
          <AppDatePicker label="من تاريخ" value={dateFrom} onChange={setDateFrom} />
          <AppDatePicker label="إلى تاريخ" value={dateTo} onChange={setDateTo} />
          <AppButton title="تحديث" variant="outline" onPress={() => void loadDays()} loading={loading} />
        </>
      }
    >
      {error ? <AppBanner tone="danger" message={error} /> : null}

      <ResourceList
        data={days}
        loading={loading}
        refreshing={loading}
        onRefresh={() => void loadDays()}
        emptyTitle="لا توجد أيام حضور في هذه الفترة"
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => (
          <DenseRow
            primary={item.date}
            secondary={`${STATUS_LABELS.present}: ${item.present} · ${STATUS_LABELS.absent}: ${item.absent} · ${STATUS_LABELS.late}: ${item.late}${item.half_day ? ` · نصف يوم: ${item.half_day}` : ''}${item.leave ? ` · إجازة: ${item.leave}` : ''}${item.holiday ? ` · عطلة: ${item.holiday}` : ''}`}
            meta={`الإجمالي: ${item.total}`}
            onPress={() => void openDay(item.date)}
          />
        )}
      />
    </ListScreenLayout>
  );
}
