import React from 'react';
import { textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { customersAPI } from '@/api/customers';
import { AppCard, AppSectionHeader } from '@/components/ui';
import { AppErrorState } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { Customer } from '@/types/api';
import { money } from '@/utils/format';

export function CustomerDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف العميل مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  const id = Number(rawId);
  return (
    <DetailScreen<Customer & Record<string, unknown>>
      title={route.params?.name || 'تفاصيل العميل'}
      onBack={navigation.goBack}
      loader={() => customersAPI.getById(id)}
      fields={[
        { label: 'الاسم', value: (item) => item.name },
        { label: 'الهاتف', value: (item) => item.phone ?? item.primary_phone, ltr: true },
        { label: 'البريد', value: (item) => item.email, ltr: true },
        { label: 'رصيد المحفظة', value: (item) => money(item.wallet_balance ?? item.balance ?? 0) },
        { label: 'النقاط', value: (item) => String(item.points_balance ?? 0) },
      ]}
    >
      {(item) => (
        <AppCard>
          <AppSectionHeader title="العناوين" />
          {(item.addresses ?? []).length === 0 ? <Text style={{ ...textStart }}>لا توجد عناوين</Text> : item.addresses?.map((address) => (
            <Text key={address.id} style={{ ...textStart }}>
              {address.label ? `${address.label}: ` : ''}{address.address_line_1 ?? ''} {address.area ?? ''} {address.city ?? ''}
            </Text>
          ))}
        </AppCard>
      )}
    </DetailScreen>
  );
}
