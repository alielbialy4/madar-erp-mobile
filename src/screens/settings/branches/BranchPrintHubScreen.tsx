import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ListScreenLayout } from '@/components/layout';
import { AppSectionHeader } from '@/components/ui';
import { DenseRow, MadarSurface } from '@/components/madar';
import { AppText as Text } from '@/components/ui/AppText';
import { AppInlineAlert } from '@/components/feedback';
import { useBranchPrintSummary } from '@/hooks/useBranchPrintSummary';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'BranchPrintHub'>;

export function BranchPrintHubScreen({ navigation, route }: Props) {
  const branchId = String(route.params?.id ?? '');
  const c = useColors();
  const printSummary = useBranchPrintSummary(branchId);
  const transportHint =
    Platform.OS === 'ios'
      ? 'على iOS: الشبكة (IP:9100) أو AirPrint. على ويندوز يستخدم الفرونت اسم طابعة النظام.'
      : 'على أندرويد: الشبكة (IP:9100) أو بلوتوث. على ويندوز يستخدم الفرونت اسم طابعة النظام.';

  const statusLine = printSummary.loading
    ? 'جاري التحميل…'
    : [
        printSummary.hasDefaultReceipt
          ? `إيصال: ${printSummary.defaultReceiptName}`
          : '⚠ لم تُحدَّد طابعة إيصال',
        printSummary.autoPrintReceipt ? 'طباعة تلقائية ✓' : 'طباعة يدوية',
        printSummary.enableKitchenPrint ? 'مطبخ ✓' : 'مطبخ ✗',
        `${printSummary.printerCount} طابعة جهاز`,
      ].join(' · ');

  return (
    <ListScreenLayout
      title="الطباعة"
      subtitle={printSummary.branchName ?? branchId}
      onBack={navigation.goBack}
      hero={{
        eyebrow: 'إعدادات الفرع',
        title: 'الطباعة والإيصالات',
        subtitle: statusLine,
        compact: true,
      }}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
        <AppInlineAlert tone="info" message={transportHint} />
        {printSummary.useServerKitchenQueue ? (
          <AppInlineAlert
            tone="warning"
            message="طابور طباعة السيرفر مفعّل — الموبايل لن يطبع تذاكر مطبخ محلياً. عطّله هنا إذا تستخدم IP على الجهاز."
          />
        ) : null}
        <View
          style={{
            gap: spacing.xs,
            padding: spacing.md,
            borderRadius: 12,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: c.borderSubtle,
            backgroundColor: c.surfaceMuted,
          }}
        >
          <Text style={{ color: c.text, fontWeight: '600' }}>قائمة التحقق على هذا الجهاز</Text>
          <Text style={{ color: printSummary.hasDefaultReceipt ? c.success : c.warning }}>
            {printSummary.hasDefaultReceipt ? '✓' : '○'} ملف كاشير (IP) + اختياره في إعدادات الإيصال
          </Text>
          <Text style={{ color: printSummary.enableKitchenPrint ? c.text : c.textMuted }}>
            {printSummary.enableKitchenPrint ? '✓' : '○'} ملفات مطبخ محلية + ربط سجلات السيرفر
          </Text>
          <Text style={{ color: printSummary.autoPrintReceipt ? c.success : c.textMuted }}>
            {printSummary.autoPrintReceipt ? '✓' : '○'} طباعة إيصال تلقائياً بعد البيع
          </Text>
          <Text style={{ color: c.textMuted }}>○ توجيه المطبخ (تصنيف/منتج → طابعة)</Text>
        </View>
        <AppSectionHeader title="مثل تبويب الطباعة في الويب" />
        <MadarSurface padded={false}>
          <DenseRow
            primary="إعدادات الإيصال والسلوك"
            secondary="طباعة تلقائية، محتوى الإيصال، أحجام الخط"
            onPress={() => navigation.navigate('BranchPrintSettings', { id: branchId })}
            showDivider
          />
          <DenseRow
            primary="طابعات هذا الجهاز"
            secondary={`${printSummary.printerCount} ملف · شبكة · بلوتوث · AirPrint`}
            onPress={() => navigation.navigate('PrinterProfiles', { branchId })}
            showDivider
          />
          <DenseRow
            primary="طابعات المطبخ (السيرفر)"
            secondary="سجلات المطبخ على السيرفر + ربط بالجهاز"
            onPress={() => navigation.navigate('BranchKitchenPrinters', { branchId })}
            showDivider
          />
          <DenseRow
            primary="توجيه المطبخ"
            secondary="تصنيفات · منتجات · محطات · طابعات"
            onPress={() => navigation.navigate('BranchKitchenRouting', { branchId })}
            showDivider
          />
          <DenseRow
            primary="تشخيص الطباعة"
            secondary="اختبار اتصال وقائمة انتظار"
            onPress={() => navigation.navigate('PrinterDiagnostics', { branchId })}
            showDivider={false}
          />
        </MadarSurface>
      </ScrollView>
    </ListScreenLayout>
  );
}


