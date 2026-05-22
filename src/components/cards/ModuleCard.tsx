import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { colors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppBadge } from '@/components/ui';

const moduleIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  customers: 'people',
  refunds: 'undo',
  dining: 'restaurant',
  kitchen: 'restaurant-menu',
  inventory: 'inventory-2',
  purchases: 'shopping-bag',
  suppliers: 'local-shipping',
  vaults: 'account-balance-wallet',
  expenses: 'payments',
  coupons: 'local-offer',
  promotions: 'campaign',
  giftcards: 'card-giftcard',
  users: 'admin-panel-settings',
  delivery: 'delivery-dining',
  reports: 'assessment',
  notifications: 'notifications',
  settings: 'settings',
  profile: 'person',
  logout: 'logout',
};

export function ModuleCard({
  moduleKey,
  label,
  description,
  disabled,
  onPress,
}: {
  moduleKey?: string;
  label: string;
  description: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  const iconName = (moduleKey && moduleIcons[moduleKey]) || 'folder';
  const isLogout = moduleKey === 'logout';
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
      ]}
    >
      <View style={[styles.iconWell, isLogout ? styles.iconWellDanger : undefined]}>
        <MaterialIcons
          name={iconName}
          size={20}
          color={disabled ? colors.textCaption : isLogout ? colors.danger : colors.accent}
        />
      </View>
      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          {disabled ? <AppBadge label="غير متاح" tone="warning" /> : null}
          <Text style={[styles.title, disabled ? styles.titleDisabled : undefined]}>{label}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>
      </View>
      {!disabled && onPress ? (
        <MaterialIcons name={chevronForwardIcon()} size={20} color={colors.textCaption} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    minHeight: 64,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  disabled: { opacity: 0.55 },
  iconWell: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWellDanger: {
    backgroundColor: colors.softDanger,
  },
  textCol: { flex: 1, gap: 4 },
  titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: {
    ...textStart,
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  titleDisabled: { color: colors.textCaption },
  description: {
    ...textStart,
    color: colors.textMuted,
    fontSize: typography.tiny,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
});
