import React, { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { APP_HEADER_HEIGHT, OFFLINE_BANNER_HEIGHT, rootRtl, screenRtl } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useOptionalGoBack } from '@/hooks/useOptionalGoBack';
import { useNetworkStore } from '@/store/networkStore';
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
  const keyboardHeight = useKeyboardHeight();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const defaultBack = useOptionalGoBack();
  const handleBack = onBack ?? defaultBack;
  const showHeader = !noHeader;
  const edges = safeEdges ?? ['top', 'left', 'right'];

  const keyboardVerticalOffset = Platform.OS === 'ios'
    ? (showHeader ? APP_HEADER_HEIGHT : 0) + (isOnline ? 0 : OFFLINE_BANNER_HEIGHT)
    : 0;
  const keyboardExtraPadding = keyboardHeight > 0 ? spacing.xl : 0;
  const scrollPaddingBottom = tabBarInset + keyboardExtraPadding;

  const content = (
    <View
      style={[
        {
          flex: 1,
          padding: spacing.lg,
          gap: spacing.md,
          ...(noHeader ? { paddingTop: spacing.md } : {}),
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: '#F1F5F9' }]}>
      {/* Mesh gradient background — iOS only */}
      {Platform.OS === 'ios' ? (
        <LinearGradient
          colors={[c.meshGradient1, c.meshGradient2, c.meshGradient3, '#F8FAFC']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.33, 0.66, 1]}
        />
      ) : null}
      <SafeAreaView style={[styles.safeArea, rootRtl, screenRtl]} edges={edges}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          {showHeader ? <AppHeader title={title} subtitle={subtitle} onBack={handleBack} right={headerRight} /> : null}
          <OfflineBanner />
          {scroll ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: scrollPaddingBottom }}
              refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={c.accent} colors={[c.accent]} /> : undefined}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {content}
            </ScrollView>
          ) : content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
