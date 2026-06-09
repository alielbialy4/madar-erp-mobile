import React, { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
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

type Props = {
  title: string;
  subtitle?: string;
  icon: IconName;
  children: React.ReactNode;
};

export function FormSection({ title, subtitle, icon, children }: Props) {
  const c = useColors();
  const styles = useMemo(() => createFormSectionStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={22} color={c.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

export function SwitchRow({ label, hint, value, onValueChange, disabled }: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const c = useColors();
  const styles = useMemo(() => createFormSectionStyles(c), [c]);

  return (
    <View style={[styles.switchRow, disabled && { opacity: 0.5 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        {hint ? <Text style={styles.switchHint}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: c.border, true: c.accent }}
      />
    </View>
  );
}

function createFormSectionStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      overflow: 'hidden',
      gap: spacing.md,
    },
    header: { ...flexRow, alignItems: 'center', gap: spacing.md, padding: spacing.md, paddingBottom: 0 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.softPrimary,
    },
    headerText: { flex: 1, gap: 2 },
    title: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
    },
    subtitle: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
    body: { padding: spacing.md, paddingTop: spacing.sm, gap: spacing.md },
    switchRow: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    switchLabel: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.medium,
      color: c.text,
    },
    switchHint: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textCaption,
    },
  });
}
