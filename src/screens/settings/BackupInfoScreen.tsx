import React from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { AttentionBand, MadarSurface } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';

export function BackupInfoScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  return (
    <AppScreen title="النسخ الاحتياطي" onBack={navigation.goBack}>
      <AttentionBand
        title="قيود الأمان"
        items={[{ id: 'web', title: 'متاح على الويب فقط', detail: 'عملية إدارية عالية المخاطر تتطلب سطح مكتب.', tone: 'warning' }]}
      />
      <MadarSurface>
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
      </MadarSurface>
    </AppScreen>
  );
}
