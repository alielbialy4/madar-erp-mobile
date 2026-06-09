import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { Text } from '@/components/ui/AppText';

type Props = {
  title?: string;
  subtitle?: string;
  step?: number;
  isFirst?: boolean;
  columns?: 1 | 2;
  children: React.ReactNode;
};

function formatStep(step: number): string {
  return step.toLocaleString('ar-EG');
}

export function ProductInsightsSectionGroup({ title, subtitle, step, isFirst, columns = 1, children }: Props) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const isTabletLandscape = width >= 900 && width > height;
  const useColumns = columns === 2 && isTabletLandscape;
  const styles = useMemo(() => createStyles(c, isFirst), [c, isFirst]);

  const childArray = React.Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.group}>
      {title ? (
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            {step != null ? (
              <View style={styles.stepBadge}>
                <Text style={styles.stepText}>{formatStep(step)}</Text>
              </View>
            ) : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {useColumns ? (
        <View style={styles.columnsRow}>
          {childArray.map((child, index) => (
            <View key={index} style={styles.column}>
              {child}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.stack}>{childArray}</View>
      )}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>, isFirst?: boolean) {
  return StyleSheet.create({
    group: {
      gap: spacing.md,
      marginTop: isFirst ? spacing.sm : spacing.lg,
    },
    titleBlock: {
      gap: spacing.xs,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    titleRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
    },
    stepBadge: {
      minWidth: 28,
      height: 28,
      borderRadius: radius.pill,
      backgroundColor: c.accent + '18',
      borderWidth: 1,
      borderColor: c.accent + '40',
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepText: {
      fontSize: typography.small,
      fontFamily: fonts.bold,
      color: c.accent,
    },
    title: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
      letterSpacing: 0.3,
    },
    subtitle: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    stack: { gap: spacing.lg },
    columnsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.lg,
    },
    column: {
      flex: 1,
      minWidth: 0,
      gap: spacing.lg,
    },
  });
}
