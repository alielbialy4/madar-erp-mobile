import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rootRtl, screenRtl } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useOptionalGoBack } from '@/hooks/useOptionalGoBack';
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
  safeEdges?: ('top' | 'bottom' | 'left' | 'right')[];
}>;

export function AppScreen({ title, subtitle, onBack, scroll = true, refreshing, onRefresh, children, contentStyle, headerRight, noHeader, safeEdges }: Props) {
  const c = useColors();
  const tabBarInset = useTabBarBottomInset(spacing.md);
  const defaultBack = useOptionalGoBack();
  const handleBack = onBack ?? defaultBack;
  const showHeader = !noHeader;
  const edges = safeEdges ?? ['top', 'left', 'right'];

  const content = (
    <View
      style={[
        {
          flex: 1,
          padding: spacing.lg,
          gap: spacing.lg,
          ...(noHeader ? { paddingTop: spacing.md } : {}),
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }, rootRtl, screenRtl]} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
        {showHeader ? <AppHeader title={title} subtitle={subtitle} onBack={handleBack} right={headerRight} /> : null}
        <OfflineBanner />
        {scroll ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: tabBarInset }}
            refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} /> : undefined}
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
