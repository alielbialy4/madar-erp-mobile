import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppButton } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { money } from '@/utils/format';
import { Text } from '@/components/ui/AppText';

type Props = {
  title: string;
  onRemove: () => void;
  children: React.ReactNode;
  totalHint?: string;
};

export function InventoryLineItemCard({ title, onRemove, children, totalHint }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="inventory-2" size={20} color={c.accent} />
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {totalHint ? <Text style={styles.total}>{totalHint}</Text> : null}
        </View>
        <AppButton title="حذف" variant="danger" size="sm" onPress={onRemove} />
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function lineTotal(quantity: string, unitCost: string): string {
  const q = Number(quantity) || 0;
  const u = Number(unitCost) || 0;
  return money(q * u);
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.md,
    },
    header: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.softPrimary,
    },
    titleCol: { flex: 1, minWidth: 0, gap: 2 },
    title: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    total: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      color: c.accent,
    },
    body: { gap: spacing.sm },
  });
}
