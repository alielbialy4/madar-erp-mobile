import React, { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View } from 'react-native';
import { customersAPI } from '@/api/customers';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { FormError } from '@/components/forms';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import type { Customer } from '@/types/api';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

const schema = z.object({
  name: z.string().min(2, 'اسم العميل مطلوب'),
  phone: z.string().min(6, 'رقم الهاتف مطلوب'),
  email: z.string().email('البريد الإلكتروني غير صحيح').optional().or(z.literal('')),
});

type CustomerForm = z.infer<typeof schema>;

export function CustomersScreen({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const debounced = useDebouncedValue(query);
  const params = useMemo(() => ({ search: debounced }), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Customer & Record<string, unknown>>(customersAPI.getAll, params);
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CustomerForm>({ resolver: zodResolver(schema), defaultValues: { name: '', phone: '', email: '' } });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await customersAPI.create({ name: values.name, phone: values.phone, email: values.email || undefined });
      setOpen(false);
      reset();
      await refresh();
    } catch (err) {
      setFormError(normalizeApiError(err).message);
    }
  });

  return (
    <AppScreen
      title="العملاء"
      subtitle="بحث وتفاصيل ومحفظة وولاء"
      scroll={false}
      headerRight={<AppButton title="إضافة" onPress={() => setOpen(true)} />}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث بالاسم أو الهاتف..." />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا يوجد عملاء"
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AppListItem
            title={item.name}
            subtitle={item.phone ?? item.primary_phone ?? undefined}
            meta={`المحفظة: ${money(item.wallet_balance ?? item.balance ?? 0)} • النقاط: ${item.points_balance ?? 0}`}
            badge={<AppBadge label={`${item.orders_count ?? item.sales_count ?? 0} طلب`} tone="info" />}
            onPress={() => navigation.navigate('CustomerDetail', { id: item.id, name: item.name })}
          />
        )}
      />

      <AppBottomSheet visible={open} onClose={() => setOpen(false)}>
        <View style={{ gap: 12 }}>
          <AppSectionHeader title="إضافة عميل" />
          <Controller control={control} name="name" render={({ field }) => <AppInput label="الاسم" value={field.value} onChangeText={field.onChange} error={errors.name?.message} />} />
          <Controller control={control} name="phone" render={({ field }) => <AppInput label="الهاتف" value={field.value} onChangeText={field.onChange} error={errors.phone?.message} keyboardType="phone-pad" />} />
          <Controller control={control} name="email" render={({ field }) => <AppInput label="البريد الإلكتروني" value={field.value} onChangeText={field.onChange} error={errors.email?.message} keyboardType="email-address" />} />
          <FormError message={formError} />
          <AppButton title="حفظ العميل" onPress={submit} loading={isSubmitting} />
        </View>
      </AppBottomSheet>
    </AppScreen>
  );
}
