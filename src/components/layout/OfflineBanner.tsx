import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useNetworkStore } from '@/store/networkStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function OfflineBanner() {
  const c = useColors();
  const isOnline = useNetworkStore((state) => state.isOnline);
  if (isOnline) return null;
  return (
    <View style={{
      backgroundColor: c.softWarning,
      borderBottomWidth: 1,
      borderBottomColor: c.softWarningBorder,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    }}>
      <MaterialIcons name="wifi-off" size={14} color={c.warning} />
      <AppText style={{
        color: '#B45309',
        fontSize: typography.tiny,
        fontFamily: fonts.bold,
        fontWeight: '700',
        flex: 1,
        writingDirection: 'rtl',
      }}>
        لا يوجد اتصال بالإنترنت — البيانات المخزنة قيد الاستخدام
      </AppText>
    </View>
  );
}
