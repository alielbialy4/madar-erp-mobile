import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  hasError?: boolean;
};

export function FormNavRow({ title, subtitle, onPress, hasError }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, hasError), [c, hasError]);

  return (
    <Pressable onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={styles.iconWrap}>
        <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textMuted} />
      </View>
      <View style={styles.textBlock}>
        <Text style={[styles.title, hasError && { color: c.danger }]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialIcons name="edit-note" size={20} color={hasError ? c.danger : c.accent} />
    </Pressable>
  );
}

function createStyles(c: ReturnType<typeof useColors>, hasError?: boolean) {
  return StyleSheet.create({
    row: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: hasError ? c.danger + '60' : c.borderSubtle,
    },
    iconWrap: {
      width: 32,
      alignItems: 'center',
    },
    textBlock: { flex: 1, gap: 2 },
    title: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    subtitle: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
      color: c.textMuted,
    },
  });
}
