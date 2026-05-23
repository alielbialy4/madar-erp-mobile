import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import type { AppColors } from '@/constants/colors';
import { Text } from '@/components/ui/AppText';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Field = { label: string; value: string; ltr?: boolean };

type Props = {
  title: string;
  icon: IconName;
  fields: Field[];
  children?: React.ReactNode;
};

export function DetailInfoCard({ title, icon, fields, children }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MaterialIcons name={icon} size={20} color={c.accent} />
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <View style={styles.grid}>
        {fields.map((f) => (
          <View key={f.label} style={[styles.field, isTablet && styles.fieldTablet]}>
            <Text style={styles.label}>{f.label}</Text>
            <Text style={[styles.value, f.ltr && styles.ltr]} numberOfLines={3}>
              {f.value}
            </Text>
          </View>
        ))}
      </View>
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

function createStyles(c: AppColors, isTablet: boolean) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.lg,
      backgroundColor: c.softPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      flex: 1,
    },
    grid: {
      gap: spacing.sm,
      ...(isTablet ? { flexDirection: 'row', flexWrap: 'wrap' } : {}),
    },
    field: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    fieldTablet: {
      flexBasis: '48%',
      flexGrow: 1,
      minWidth: 140,
    },
    label: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textCaption,
    },
    value: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    ltr: { writingDirection: 'ltr', textAlign: 'left' },
    children: { gap: spacing.sm, paddingTop: spacing.xs },
  });
}
