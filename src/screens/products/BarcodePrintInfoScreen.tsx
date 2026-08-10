import React from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { AttentionBand, MadarSurface } from '@/components/madar';
import { AppEmptyState } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import { spacing } from '@/constants/spacing';

export function BarcodePrintInfoScreen({ navigation }: { navigation: any }) {
  return (
    <AppScreen title="طباعة الباركود" subtitle="حالة توافق مسار الويب" onBack={navigation.goBack}>
      <AttentionBand
        title="طباعة الملصقات"
        items={[
          {
            id: 'web-only',
            title: 'غير متاح كطباعة ملصقات أصلية بعد',
            detail: 'معاينة المقاسات تبقى من الويب حتى يكتمل قالب جوال مع اختبار طابعة.',
            tone: 'warning',
          },
        ]}
      />
      <MadarSurface>
        <AppEmptyState
          title="طباعة الملصقات Web-only حالياً"
          message="مسار الويب يعتمد على معاينة ملصقات وطباعة متصفح بمقاسات ورق/ملصقات دقيقة. الجوال لا ينفذ هذه العملية بصمت حتى لا يطبع باركود غير مضبوط. يمكن إدارة الباركودات من شاشة المنتج."
        />
      </MadarSurface>
      <View style={{ gap: spacing.sm }}>
        <AppButton title="فتح المنتجات" onPress={() => navigation.getParent?.()?.navigate('ProductsTab', { screen: 'ProductsHome' })} />
        <AppButton
          title="ملفات الطابعات"
          variant="secondary"
          onPress={() => {
            const branchId = useBranchStore.getState().activeBranch?.id;
            if (branchId) navigation.navigate('BranchDetail', { id: branchId });
            else navigation.navigate('BranchesList');
          }}
        />
      </View>
    </AppScreen>
  );
}
