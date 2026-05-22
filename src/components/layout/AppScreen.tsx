import React, { PropsWithChildren, useMemo } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rootRtl, screenRtl } from '@/constants/layout';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { AppHeader } from './AppHeader';
import { OfflineBanner } from './OfflineBanner';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  onBack?: () => void;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  headerRight?: React.ReactNode;
  noHeader?: boolean;
}>;

export function AppScreen({ title, subtitle, onBack, scroll = true, refreshing, onRefresh, children, contentStyle, headerRight, noHeader }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const showHeader = !noHeader;
  const content = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, rootRtl, screenRtl]} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        {showHeader ? <AppHeader title={title} subtitle={subtitle} onBack={onBack} right={headerRight} /> : null}
        <OfflineBanner />
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.accent} /> : undefined}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {content}
          </ScrollView>
        ) : content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    content: { flex: 1, padding: spacing.lg, gap: spacing.lg },
  });
}
