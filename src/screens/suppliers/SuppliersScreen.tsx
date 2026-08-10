import React, { useMemo, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suppliersAPI } from '@/api/suppliers';
import { AppBottomSheet, ListScreenLayout, MasterDetailLayout } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader, AppSwipeRow, AppText } from '@/components/ui';
import { FinancialRow, MadarSection, MadarSurface, MetricBlock, QuickActionBar } from '@/components/madar';
import { FormError } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { isTablet } from '@/constants/responsive';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { getCurrentBalanceInterpretation } from '@/utils/supplierBalanceLabels';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { textStart } from '@/constants/layout';

const createSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  notes: z.string().optional(),
  opening_balance: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  phone: z.string().min(1, 'رقم الهاتف مطلوب'),
  notes: z.string().optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

function truncateNotes(notes: unknown, max = 50): string {
  const text = String(notes ?? '').trim();
  if (!text) return '—';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function SuppliersScreen({ navigation }: { navigation: any }) {
  const { width } = useWindowDimensions();
  const tablet = isTablet(width);
  const toast = useToast();
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_suppliers');

  const [query, setQuery] = useState('');
  const [previewId, setPreviewId] = useState<string | number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [deleting, setDeleting] = useState(false);

  const debounced = useDebouncedValue(query);
  const params = useMemo(() => (debounced ? { search: debounced } : {}), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    suppliersAPI.getAll,
    params,
  );

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', phone: '', notes: '', opening_balance: '' },
  });

  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: '', phone: '', notes: '' },
  });

  const openEdit = (item: Record<string, unknown>) => {
    setSelected(item);
    updateForm.reset({
      name: String(item.name ?? ''),
      phone: String(item.phone ?? ''),
      notes: String(item.notes ?? ''),
    });
    setFormError(null);
    setEditOpen(true);
  };

  const submitCreate = createForm.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        phone: values.phone,
        notes: values.notes || undefined,
      };
      if (values.opening_balance?.trim()) {
        payload.opening_balance = Number(values.opening_balance);
      }
      await suppliersAPI.create(payload);
      setCreateOpen(false);
      createForm.reset();
      await refresh();
      toast.success('تم إضافة المورد بنجاح');
    } catch (err) {
      setFormError(normalizeApiError(err).message);
    }
  });

  const submitUpdate = updateForm.handleSubmit(async (values) => {
    if (!selected?.id) return;
    setFormError(null);
    try {
      await suppliersAPI.update(Number(selected.id), {
        name: values.name,
        phone: values.phone,
        notes: values.notes || undefined,
      });
      setEditOpen(false);
      setSelected(null);
      await refresh();
      toast.success('تم تحديث المورد بنجاح');
    } catch (err) {
      setFormError(normalizeApiError(err).message);
    }
  });

  const performDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await suppliersAPI.delete(Number(deleteTarget.id));
      setDeleteTarget(null);
      await refresh();
      toast.success('تم حذف المورد بنجاح');
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const balanceMeta = (item: Record<string, unknown>) => {
    const signed = Number(item.current_balance ?? item.balance ?? item.opening_balance ?? 0);
    const info = getCurrentBalanceInterpretation(signed, item.current_balance_interpretation as never);
    return { signed, info };
  };

  const openSupplier = (item: Record<string, unknown>) => {
    if (tablet) {
      setPreviewId(item.id as string | number);
      return;
    }
    openEdit(item);
  };

  const previewSupplier = items.find((item) => String(item.id) === String(previewId)) ?? null;

  return (
    <ListScreenLayout
      title="الموردين"
      subtitle="متابعة الموردين والأرصدة وروابط التقارير"
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="بحث عن الموردين..."
      onRefresh={refresh}
      refreshing={refreshing}
      contentStyle={tablet ? { flex: 1 } : undefined}
      fab={canManage ? { onPress: () => { setFormError(null); setCreateOpen(true); }, label: 'إضافة مورد' } : undefined}
      hero={{
        eyebrow: 'المشتريات',
        title: 'الموردين',
        subtitle: 'متابعة الموردين والأرصدة وروابط التقارير',
        stats: [{ label: 'الموردين', value: items.length }],
        compact: true,
      }}
    >
      <MasterDetailLayout
        emptyTitle="اختر موردًا"
        emptyMessage="اختر موردًا من القائمة لمراجعة الرصيد والتقارير دون مغادرة الشاشة."
        master={
          <ResourceList
            data={items}
            loading={loading}
            refreshing={refreshing}
            error={error}
            onRefresh={refresh}
            onEndReached={loadMore}
            emptyTitle="لا توجد موردين"
            emptyCtaLabel={canManage ? 'إضافة مورد' : undefined}
            onEmptyCta={canManage ? () => { setFormError(null); setCreateOpen(true); } : undefined}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={({ item }) => {
              const { signed, info } = balanceMeta(item);
              const card = (
                <FinancialRow
                  primary={String(item.name ?? 'مورد')}
                  secondary={String(item.phone ?? '—')}
                  meta={`${truncateNotes(item.notes)} · ${info.label_ar} · ${item.purchases_count ?? 0} فاتورة`}
                  amount={signed}
                  currency="ج.م"
                  amountTone={signed > 0 ? 'negative' : signed < 0 ? 'positive' : 'default'}
                  selected={tablet && String(previewId) === String(item.id)}
                  onPress={() => openSupplier(item)}
                />
              );
              const swipeActions = [
                { label: 'تقرير', icon: 'assessment' as const, onPress: () => navigation.navigate('SupplierReport', { id: item.id, name: item.name }) },
                { label: 'كشف', icon: 'receipt-long' as const, onPress: () => navigation.navigate('SupplierStatement', { id: item.id, name: item.name }) },
                ...(canManage ? [
                  { label: 'تعديل', icon: 'edit' as const, onPress: () => openEdit(item) },
                  { label: 'حذف', icon: 'delete' as const, tone: 'danger' as const, onPress: () => setDeleteTarget(item) },
                ] : []),
              ];
              return swipeActions.length > 0 ? <AppSwipeRow rightActions={swipeActions}>{card}</AppSwipeRow> : card;
            }}
          />
        }
        detail={
          previewSupplier ? (
            <View style={{ flex: 1, padding: spacing.lg, gap: spacing.lg }}>
              <MadarSection title={String(previewSupplier.name ?? 'مورد')}>
                <AppText style={{ ...textStart, color: c.textMuted }}>
                  {[previewSupplier.phone, truncateNotes(previewSupplier.notes, 120)].filter(Boolean).join(' · ')}
                </AppText>
                {(() => {
                  const { signed, info } = balanceMeta(previewSupplier);
                  return (
                    <MetricBlock
                      label={info.label_ar}
                      value={money(signed)}
                      hint={`${previewSupplier.purchases_count ?? 0} فاتورة شراء`}
                      level="A"
                      tone={signed > 0 ? 'negative' : signed < 0 ? 'positive' : 'neutral'}
                    />
                  );
                })()}
              </MadarSection>
              <QuickActionBar
                actions={[
                  {
                    id: 'report',
                    label: 'تقرير',
                    icon: 'chart-bar',
                    onPress: () => navigation.navigate('SupplierReport', { id: previewSupplier.id, name: previewSupplier.name }),
                    tone: 'accent',
                  },
                  {
                    id: 'statement',
                    label: 'كشف حساب',
                    icon: 'receipt',
                    onPress: () => navigation.navigate('SupplierStatement', { id: previewSupplier.id, name: previewSupplier.name }),
                  },
                  ...(canManage
                    ? [{ id: 'edit', label: 'تعديل', icon: 'pencil' as const, onPress: () => openEdit(previewSupplier) }]
                    : []),
                ]}
              />
              <MadarSurface>
                <AppText style={{ ...textStart, color: c.textMuted, fontSize: 13 }}>
                  استخدم التقرير أو كشف الحساب للتفاصيل المحاسبية الكاملة.
                </AppText>
              </MadarSurface>
            </View>
          ) : null
        }
      />

      <AppBottomSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <View style={{ gap: spacing.md }}>
          <AppSectionHeader title="إضافة مورد جديد" />
          <Controller control={createForm.control} name="name" render={({ field }) => (
            <AppInput label="الاسم" required value={field.value} onChangeText={field.onChange} error={createForm.formState.errors.name?.message} />
          )} />
          <Controller control={createForm.control} name="phone" render={({ field }) => (
            <AppInput label="رقم الهاتف" required value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" error={createForm.formState.errors.phone?.message} />
          )} />
          <Controller control={createForm.control} name="opening_balance" render={({ field }) => (
            <AppInput label="الرصيد الابتدائي" value={field.value} onChangeText={field.onChange} keyboardType="decimal-pad" placeholder="موجب أو سالب" />
          )} />
          <Controller control={createForm.control} name="notes" render={({ field }) => (
            <AppInput label="الملاحظات" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4} />
          )} />
          <FormError message={formError} />
          <AppButton title="حفظ" onPress={submitCreate} loading={createForm.formState.isSubmitting} />
        </View>
      </AppBottomSheet>

      <AppBottomSheet visible={editOpen} onClose={() => { setEditOpen(false); setSelected(null); }}>
        <View style={{ gap: spacing.md }}>
          <AppSectionHeader title="تحديث المورد" />
          {selected ? (
            <View style={{ gap: spacing.xs, padding: spacing.md, borderRadius: 8, borderWidth: 1, borderColor: c.borderSubtle, backgroundColor: c.surface }}>
              <AppInput label="الرصيد الابتدائي (قراءة فقط)" value={money(selected.opening_balance ?? 0)} editable={false} />
              <AppInput
                label="الرصيد الحالي (قراءة فقط)"
                value={money(selected.current_balance ?? selected.balance ?? 0)}
                editable={false}
              />
            </View>
          ) : null}
          <Controller control={updateForm.control} name="name" render={({ field }) => (
            <AppInput label="الاسم" required value={field.value} onChangeText={field.onChange} error={updateForm.formState.errors.name?.message} />
          )} />
          <Controller control={updateForm.control} name="phone" render={({ field }) => (
            <AppInput label="رقم الهاتف" required value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" error={updateForm.formState.errors.phone?.message} />
          )} />
          <Controller control={updateForm.control} name="notes" render={({ field }) => (
            <AppInput label="الملاحظات" value={field.value} onChangeText={field.onChange} multiline numberOfLines={4} />
          )} />
          <FormError message={formError} />
          <AppButton title="تحديث" onPress={submitUpdate} loading={updateForm.formState.isSubmitting} />
          <AppButton
            title="فتح تقرير المورد"
            variant="secondary"
            onPress={() => {
              if (!selected?.id) return;
              setEditOpen(false);
              navigation.navigate('SupplierReport', { id: selected.id, name: selected.name });
            }}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="حذف المورد"
        message={`حذف «${deleteTarget?.name ?? ''}»؟`}
        confirmLabel="حذف"
        onConfirm={() => void performDelete()}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </ListScreenLayout>
  );
}
