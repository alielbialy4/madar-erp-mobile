import React, { forwardRef, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { ProductFormSectionKey } from './ProductFormContext';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Props = {
  title: string;
  subtitle?: string;
  icon: IconName;
  sectionKey: ProductFormSectionKey;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  badge?: string;
  hasError?: boolean;
  children: React.ReactNode;
};

export const CollapsibleFormSection = forwardRef<View, Props>(function CollapsibleFormSection(
  {
    title,
    subtitle,
    icon,
    defaultExpanded = true,
    expanded: controlledExpanded,
    onExpandedChange,
    badge,
    hasError,
    children,
  },
  ref,
) {
  const c = useColors();
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded ?? internalExpanded;
  const styles = useMemo(() => createStyles(c, hasError), [c, hasError]);

  const toggle = () => {
    const next = !expanded;
    if (controlledExpanded == null) setInternalExpanded(next);
    onExpandedChange?.(next);
  };

  return (
    <View ref={ref} style={styles.card}>
      <Pressable onPress={toggle} style={styles.header} accessibilityRole="button" accessibilityState={{ expanded }}>
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={22} color={hasError ? c.danger : c.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, hasError && { color: c.danger }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={24} color={c.textMuted} />
      </Pressable>
      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
});

function createStyles(c: ReturnType<typeof useColors>, hasError?: boolean) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: hasError ? c.danger + '60' : c.borderSubtle,
      overflow: 'hidden',
    },
    header: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hasError ? c.danger + '12' : c.softPrimary,
    },
    headerText: { flex: 1, gap: 2 },
    title: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
    },
    subtitle: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: c.softPrimary,
    },
    badgeText: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.accent,
    },
    body: {
      padding: spacing.md,
      paddingTop: 0,
      gap: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.borderSubtle,
    },
  });
}
