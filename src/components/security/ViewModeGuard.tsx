import React, { useEffect } from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useBranchStore } from '@/store/branchStore';
import type { ViewMode } from '@/navigation/viewModeRoutePolicy';
import { isViewModeAllowed } from '@/navigation/viewModeRoutePolicy';

type ViewModeGuardProps = {
  allowedModes: ViewMode[];
  children: React.ReactNode;
};

const BRANCH_REQUIRED_TITLE = 'يلزم اختيار فرع';
const SELECT_BRANCH_HINT = 'هذه الشاشة تتطلب فرعاً محدداً. اختر فرعاً من القائمة أعلاه.';

export function ViewModeGuard({ allowedModes, children }: ViewModeGuardProps) {
  const viewMode = useBranchStore((s) => s.viewMode);
  const navigation = useNavigation();

  const allowed = isViewModeAllowed(allowedModes, viewMode);
  const showBranchHint = viewMode === 'global' && !allowedModes.includes('global');

  useEffect(() => {
    if (allowed || showBranchHint) return;
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'DashboardTab' }],
      }),
    );
  }, [allowed, navigation, showBranchHint]);

  if (allowed) {
    return <>{children}</>;
  }

  if (showBranchHint) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>
        <AppCard>
          <View style={{ alignItems: 'center', gap: spacing.md, padding: spacing.lg }}>
            <MaterialIcons name="warning-amber" size={40} color="#f59e0b" />
            <AppText style={{ fontSize: typography.h3, fontWeight: '600', textAlign: 'center' }}>{BRANCH_REQUIRED_TITLE}</AppText>
            <AppText style={{ fontSize: typography.body, textAlign: 'center', opacity: 0.75 }}>{SELECT_BRANCH_HINT}</AppText>
          </View>
        </AppCard>
      </View>
    );
  }

  return null;
}
