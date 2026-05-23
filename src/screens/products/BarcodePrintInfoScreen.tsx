import React from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppSectionHeader } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { spacing } from '@/constants/spacing';

export function BarcodePrintInfoScreen({ navigation }: { navigation: any }) {
  return (
    <AppScreen title="طباعة الباركود" subtitle="حالة توافق مسار الويب" onBack={navigation.goBack}>
      <AppCard>
        <AppSectionHeader title="غير متاح كطباعة ملصقات أصلية بعد" />
        <AppEmptyState
          title="طباعة الملصقات Web-only حالياً"
          message="مسار الويب يعتمد على معاينة ملصقات وطباعة متصفح بمقاسات ورق/ملصقات دقيقة. الجوال لا ينفذ هذه العملية بصمت حتى لا يطبع باركود غير مضبوط. يمكن إدارة الباركودات من شاشة المنتج، وتبقى طباعة الملصقات من الويب إلى أن يكتمل قالب جوال مع اختبار طابعة فعلي."
        />
      </AppCard>
      <View style={{ gap: spacing.sm }}>
        <AppButton title="فتح المنتجات" onPress={() => navigation.getParent?.()?.navigate('ProductsTab', { screen: 'ProductsHome' })} />
        <AppButton title="ملفات الطابعات" variant="secondary" onPress={() => navigation.navigate('PrinterProfiles')} />
      </View>
    </AppScreen>
  );
}
