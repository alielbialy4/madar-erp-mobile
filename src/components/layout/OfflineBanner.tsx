import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useNetworkStore } from '@/store/networkStore';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function OfflineBanner() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  if (isOnline) return null;
  return (
    <View style={styles.banner}>
      <MaterialIcons name="wifi-off" size={14} color={colors.warning} />
      <Text style={styles.text}>لا يوجد اتصال بالإنترنت — البيانات المخزنة قيد الاستخدام</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.softWarning,
    borderBottomWidth: 1,
    borderBottomColor: colors.softWarningBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    color: '#B45309',
    fontSize: typography.tiny,
    fontFamily: 'Tajawal_700Bold',
    fontWeight: '700',
    flex: 1,
  },
});
