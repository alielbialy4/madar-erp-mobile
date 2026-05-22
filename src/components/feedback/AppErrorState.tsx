import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppButton } from '@/components/ui';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export function AppErrorState({ message = 'حدث خطأ أثناء تحميل البيانات', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <View style={styles.iconBox}>
        <MaterialIcons name="error-outline" size={32} color={colors.danger} />
      </View>
      <Text style={styles.title}>حدث خطأ</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? <AppButton title="إعادة المحاولة" onPress={onRetry} variant="outline" size="sm" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { padding: spacing.xxxl, alignItems: 'center', gap: spacing.md },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: radius.xxl,
    backgroundColor: colors.softDanger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontSize: typography.cardTitle, fontFamily: fonts.bold, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center', lineHeight: 23 },
});
