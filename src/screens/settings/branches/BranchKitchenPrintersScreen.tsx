import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  kitchenPrintersAPI,
  type KitchenPrinter,
  type KitchenPrinterPayload,
} from '@/api/kitchenPrinters';
import { ListScreenLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import {
  AppButton,
  AppCard,
  AppInput,
  AppListItem,
  AppSelect,
} from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppErrorState, AppInlineAlert, AppLoadingState, useToast } from '@/components/feedback';
import {
  getServerPrinterMap,
  mapServerPrinterToLocal,
} from '@/services/printing/branchPrintBinding';
import { getPrinterProfilesStrict } from '@/services/printing/printerProfiles';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { PrinterProfile } from '@/types/printing';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'BranchKitchenPrinters'>;

const emptyDraft = (): KitchenPrinterPayload => ({
  name: '',
  printer_name: '',
  is_active: true,
  auto_print_enabled: true,
  copies_count: 1,
  sort_order: 0,
  notes: null,
});

export function BranchKitchenPrintersScreen({ navigation, route }: Props) {
  const branchId = String(route.params?.branchId ?? '');
  const c = useColors();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const canManage =
    Boolean(user?.is_super_admin) ||
    hasPermission(user, 'manage_branches') ||
    hasPermission(user, 'manage_kitchen');

  const [printers, setPrinters] = useState<KitchenPrinter[]>([]);
  const [localProfiles, setLocalProfiles] = useState<PrinterProfile[]>([]);
  const [serverMap, setServerMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<KitchenPrinterPayload | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError(null);
    try {
      const [list, profiles, map] = await Promise.all([
        kitchenPrintersAPI.list(branchId),
        getPrinterProfilesStrict(branchId),
        getServerPrinterMap(branchId),
      ]);
      setPrinters(list);
      setLocalProfiles(profiles.filter((p) => p.role === 'kitchen' || p.role === 'bar'));
      setServerMap(map);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const localOptions = useMemo<SelectOption[]>(
    () => [
      { label: '— اختر طابعة محلية —', value: '' },
      ...localProfiles.map((p) => ({
        label: `${p.name}${p.ip ? ` · ${p.ip}` : ''}`,
        value: p.id,
      })),
    ],
    [localProfiles],
  );

  const startCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const startEdit = (printer: KitchenPrinter) => {
    setEditingId(printer.id);
    setDraft({
      name: printer.name,
      printer_name: printer.printer_name,
      is_active: printer.is_active,
      auto_print_enabled: printer.auto_print_enabled,
      copies_count: printer.copies_count,
      sort_order: printer.sort_order,
      notes: printer.notes ?? null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const onPickLocalForDraft = (localId: string) => {
    const profile = localProfiles.find((p) => p.id === localId);
    setDraft((d) =>
      d
        ? {
            ...d,
            printer_name: profile?.name ?? d.printer_name,
          }
        : d,
    );
  };

  const save = async () => {
    if (!canManage || !draft || !branchId) return;
    if (!draft.name.trim()) {
      toast.error('اسم الطابعة مطلوب');
      return;
    }
    if (!draft.printer_name.trim()) {
      toast.error('اربط طابعة محلية أو أدخل اسم الطابعة');
      return;
    }
    setSaving(true);
    try {
      const payload: KitchenPrinterPayload = {
        ...draft,
        name: draft.name.trim(),
        printer_name: draft.printer_name.trim(),
        copies_count: Math.max(1, Math.min(5, Number(draft.copies_count) || 1)),
        notes: (draft.notes || '').trim() || null,
      };
      if (editingId) {
        await kitchenPrintersAPI.update(editingId, payload);
        toast.success('تم تحديث طابعة المطبخ');
      } else {
        payload.branch_id = branchId;
        await kitchenPrintersAPI.create(payload);
        toast.success('تم إضافة طابعة المطبخ');
      }
      cancelEdit();
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (printer: KitchenPrinter) => {
    if (!canManage) return;
    setSaving(true);
    try {
      await kitchenPrintersAPI.remove(printer.id);
      toast.success('تم حذف الطابعة');
      if (editingId === printer.id) cancelEdit();
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const onMapLocal = async (serverPrinterId: string, localId: string) => {
    await mapServerPrinterToLocal(branchId, serverPrinterId, localId || null);
    setServerMap(await getServerPrinterMap(branchId));
    toast.success('تم ربط الطابعة بالجهاز');
  };

  if (!branchId) {
    return (
      <ListScreenLayout title="طابعات المطبخ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف الفرع مطلوب" />
      </ListScreenLayout>
    );
  }

  if (loading && printers.length === 0 && !draft) {
    return (
      <ListScreenLayout title="طابعات المطبخ" onBack={navigation.goBack}>
        <AppLoadingState message="جاري التحميل…" />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="طابعات المطبخ"
      subtitle="سجلات السيرفر"
      onBack={navigation.goBack}
      onRefresh={() => void load()}
      refreshing={loading}
      hero={{
        eyebrow: 'الفرع',
        title: 'طابعات المطبخ',
        subtitle: 'مثل قسم طابعات المطبخ في إعدادات الفرع على الويب',
        compact: true,
      }}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        {error ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

        <AppInlineAlert
          tone="info"
          message="كل طابعة مطبخ على السيرفر تحتاج ربطاً بملف IP (أو بلوتوث) على هذا الجهاز — مثل الفرونت لكن عبر server map بدل اسم ويندوز."
        />
        {printers.some((p) => p.is_active && !serverMap[p.id]) ? (
          <AppInlineAlert
            tone="warning"
            message="يوجد سجل مطبخ نشط بدون ربط محلي — لن تُطبع أصنافه حتى تربطه بملف الطابعة."
          />
        ) : null}

        {canManage ? (
          <AppButton
            title={draft && !editingId ? 'إلغاء الإضافة' : 'إضافة طابعة مطبخ'}
            variant="secondary"
            onPress={() => (draft && !editingId ? cancelEdit() : startCreate())}
          />
        ) : null}

        {draft ? (
          <FormSection title={editingId ? 'تعديل طابعة' : 'طابعة جديدة'} icon="print">
            <AppInput
              label="اسم النظام"
              value={draft.name}
              onChangeText={(t) => setDraft((d) => (d ? { ...d, name: t } : d))}
            />
            <AppSelect
              label="طابعة محلية على هذا الجهاز"
              value={localProfiles.find((p) => p.name === draft.printer_name)?.id ?? ''}
              options={localOptions}
              onChange={(v) => onPickLocalForDraft(v)}
            />
            <AppInput
              label="معرّف الطابعة (للسيرفر)"
              value={draft.printer_name}
              onChangeText={(t) => setDraft((d) => (d ? { ...d, printer_name: t } : d))}
              placeholder="يُملأ تلقائياً عند اختيار طابعة محلية"
            />
            <SwitchRow
              label="نشطة"
              value={draft.is_active ?? true}
              onValueChange={(v) => setDraft((d) => (d ? { ...d, is_active: v } : d))}
            />
            <SwitchRow
              label="طباعة تلقائية"
              value={draft.auto_print_enabled ?? true}
              onValueChange={(v) => setDraft((d) => (d ? { ...d, auto_print_enabled: v } : d))}
            />
            <AppInput
              label="عدد النسخ (1–5)"
              value={String(draft.copies_count ?? 1)}
              onChangeText={(t) =>
                setDraft((d) => (d ? { ...d, copies_count: parseInt(t.replace(/\D/g, ''), 10) || 1 } : d))
              }
              keyboardType="number-pad"
            />
            <AppInput
              label="ملاحظات"
              value={draft.notes ?? ''}
              onChangeText={(t) => setDraft((d) => (d ? { ...d, notes: t } : d))}
              multiline
            />
            <View style={{ ...flexRow, gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <AppButton title="حفظ" onPress={() => void save()} loading={saving} disabled={!canManage} />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton title="إلغاء" variant="secondary" onPress={cancelEdit} />
              </View>
            </View>
            <AppButton
              title="إضافة طابعة محلية جديدة"
              variant="outline"
              onPress={() =>
                navigation.navigate('PrinterProfileForm', { branchId, presetRole: 'kitchen' })
              }
            />
          </FormSection>
        ) : null}

        {printers.length === 0 ? (
          <AppCard>
            <Text style={{ color: c.textMuted }}>لا توجد طابعات مطبخ على السيرفر لهذا الفرع.</Text>
          </AppCard>
        ) : (
          printers.map((printer) => (
            <AppCard key={printer.id}>
              <AppListItem
                title={printer.name}
                subtitle={`${printer.printer_name} · ${printer.is_active ? 'نشطة' : 'معطّلة'}`}
                onPress={canManage ? () => startEdit(printer) : undefined}
              />
              <AppSelect
                label="ربط بجهاز هذا الجهاز"
                value={serverMap[printer.id] ?? ''}
                options={localOptions}
                onChange={(v) => void onMapLocal(printer.id, v)}
              />
              {canManage ? (
                <AppButton
                  title="حذف"
                  variant="danger"
                  onPress={() => void remove(printer)}
                  loading={saving}
                />
              ) : null}
            </AppCard>
          ))
        )}
      </ScrollView>
    </ListScreenLayout>
  );
}
