import React, { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { suppliersAPI } from '@/api/suppliers';
import { AppBottomSheet, ListScreenLayout } from '@/components/layout';
import { AppButton, AppDomainCard, AppInput, AppSectionHeader, AppSwipeRow } from '@/components/ui';
import { FormError } from '@/components/forms';
import { ConfirmDialog } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { getCurrentBalanceInterpretation } from '@/utils/supplierBalanceLabels';
import { moduleIcons } from '@/constants/iconMap';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

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
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_suppliers');

  const [query, setQuery] = useState('');
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
      Alert.alert('تم', 'تم إضافة المورد بنجاح');
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
      Alert.alert('تم', 'تم تحديث المورد بنجاح');
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
      Alert.alert('تم', 'تم حذف المورد بنجاح');
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const balanceMeta = (item: Record<string, unknown>) => {
    const signed = Number(item.current_balance ?? item.balance ?? item.opening_balance ?? 0);
    const info = getCurrentBalanceInterpretation(signed, item.current_balance_interpretation as never);
    return { signed, info };
  };

  return (
    <ListScreenLayout
      title="الموردين"
      subtitle="متابعة الموردين والأرصدة وروابط التقارير"
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="بحث عن الموردين..."
      onRefresh={refresh}
      refreshing={refreshing}
      fab={canManage ? { onPress: () => { setFormError(null); setCreateOpen(true); }, label: 'إضافة مورد' } : undefined}
      hero={{
        eyebrow: 'المشتريات',
        title: 'الموردين',
        subtitle: 'متابعة الموردين والأرصدة وروابط التقارير',
        stats: [{ label: 'الموردين', value: items.length }],
        compact: true,
      }}
    >
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
            <AppDomainCard
              title={String(item.name ?? 'مورد')}
              subtitle={String(item.phone ?? '—')}
              meta={`${truncateNotes(item.notes)} • ${money(signed)} — ${info.label_ar}`}
              metric={money(signed)}
              badgeLabel={`${item.purchases_count ?? 0} فاتورة`}
              badgeTone="info"
              leadingIcon={moduleIcons.suppliers}
              onPress={() => openEdit(item)}
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
            <View style={{ gap: spacing.xs, padding: spacing.md, borderRadius: 8, backgroundColor: c.surfaceMuted }}>
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
