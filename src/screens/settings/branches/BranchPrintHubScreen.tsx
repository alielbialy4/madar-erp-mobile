import React from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { ListScreenLayout } from '@/components/layout';
import { AppDomainCard, AppSectionHeader } from '@/components/ui';
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
            borderWidth: 1,
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
        <AppDomainCard
          title="إعدادات الإيصال والسلوك"
          subtitle="طباعة تلقائية، محتوى الإيصال، أحجام الخط"
          leadingIcon="receipt-long"
          onPress={() => navigation.navigate('BranchPrintSettings', { id: branchId })}
        />
        <AppDomainCard
          title="طابعات هذا الجهاز"
          subtitle={`${printSummary.printerCount} ملف · شبكة · بلوتوث · AirPrint`}
          leadingIcon="print"
          onPress={() => navigation.navigate('PrinterProfiles', { branchId })}
        />
        <AppDomainCard
          title="طابعات المطبخ (السيرفر)"
          subtitle="سجلات المطبخ على السيرفر + ربط بالجهاز"
          leadingIcon="kitchen"
          onPress={() => navigation.navigate('BranchKitchenPrinters', { branchId })}
        />
        <AppDomainCard
          title="توجيه المطبخ"
          subtitle="تصنيفات · منتجات · محطات · طابعات"
          leadingIcon="swap-horiz"
          onPress={() => navigation.navigate('BranchKitchenRouting', { branchId })}
        />
        <AppDomainCard
          title="تشخيص الطباعة"
          subtitle="اختبار اتصال وقائمة انتظار"
          leadingIcon="bug-report"
          onPress={() => navigation.navigate('PrinterDiagnostics', { branchId })}
        />
      </ScrollView>
    </ListScreenLayout>
  );
}
