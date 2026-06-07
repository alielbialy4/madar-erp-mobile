import React from 'react';
import { View } from 'react-native';
import { promotionsAPI } from '@/api/promotions';
import { ListScreenTemplate } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { asText, dateText } from '@/utils/format';

export function PromotionsScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, ['manage_coupons', 'manage_settings']);

  return (
    <ListScreenTemplate<Record<string, unknown>>
      title="العروض"
      subtitle="تطبيق تلقائي في POS عند استيفاء الشروط"
      moduleIcon="promotions"
      loader={(p) => promotionsAPI.getAll(p) as never}
      onItemPress={(item) => navigation.navigate('PromotionForm', { id: String(item.id) })}
      itemTitle={(item) => asText(item.name)}
      itemSubtitle={(item) => {
        const typeLabel = item.type === 'bogo' ? 'BOGO' : item.type === 'percentage_discount' ? 'نسبة' : 'مبلغ';
        return `${typeLabel} • ${dateText(asText(item.start_date, ''))}`;
      }}
      itemBadge={(item) => ({ label: item.is_active ? 'نشط' : 'متوقف', tone: item.is_active ? 'success' : 'danger' })}
      emptyTitle="لا عروض"
      headerRight={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canManage ? <AppButton title="جديد" onPress={() => navigation.navigate('PromotionForm', {})} /> : null}
          <AppButton title="تقرير" variant="secondary" onPress={() => navigation.navigate('ReportViewer', { reportId: 'marketing-promotions' })} />
        </View>
      }
    />
  );
}
