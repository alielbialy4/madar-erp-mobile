import React from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppCard, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';

export function BackupInfoScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  return (
    <AppScreen title="النسخ الاحتياطي" onBack={navigation.goBack}>
      <AppCard>
        <AppSectionHeader title="متاح على الويب فقط" />
        <View style={{ gap: spacing.md }}>
          <Text style={{ color: c.text, lineHeight: 22 }}>
            عمليات النسخ الاحتياطي واستعادة قاعدة البيانات عملية إدارية عالية المخاطر. لا يوجد على الجوال سير
            تأكيد وتدقيق كافٍ لمطابقة متطلبات الأمان في الويب.
          </Text>
          <Text style={{ color: c.textMuted, lineHeight: 20 }}>
            استخدم مسار الويب /backup من لوحة التحكم على متصفح سطح المكتب مع صلاحية manage_settings ونسخ احتياطي
            موثّق.
          </Text>
        </View>
      </AppCard>
    </AppScreen>
  );
}
