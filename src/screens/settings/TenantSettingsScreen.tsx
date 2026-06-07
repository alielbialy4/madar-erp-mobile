import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { tenantAPI } from '@/api/tenant';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { AppButton, AppInput } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState, useToast } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useThemeStore } from '@/store/themeStore';
import { hapticSuccess } from '@/utils/haptics';

function FieldRow({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 4, paddingVertical: spacing.xs }}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

export function TenantSettingsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const toast = useToast();
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [themeHex, setThemeHex] = useState(c.darkNavy);
  const [themeMessage, setThemeMessage] = useState<string | null>(null);
  const [savingTheme, setSavingTheme] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, themeRes] = await Promise.all([
        tenantAPI.info(),
        tenantAPI.getTheme().catch(() => null),
      ]);
      const data = extractData(res) as { tenant?: Record<string, unknown> } | undefined;
      setInfo(data?.tenant ?? (data as Record<string, unknown>) ?? null);
      const themeData = themeRes ? extractData<Record<string, unknown>>(themeRes) : null;
      const primary = String(themeData?.primary_hex ?? '').trim();
      if (/^#([0-9a-fA-F]{6})$/.test(primary)) {
        const clean = primary.toUpperCase();
        setThemeHex(clean);
        useThemeStore.getState().setPrimaryHex(clean);
      }
      setError(null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const settings = (info?.settings as Record<string, unknown>) ?? {};
  const contact = (info?.contact_info as Record<string, unknown>) ?? {};
  const canSaveTheme = /^#([0-9a-fA-F]{6})$/.test(themeHex.trim());

  const saveTheme = async () => {
    if (!canSaveTheme) {
      setThemeMessage(`لون غير صالح. اكتب Hex مثل ${c.darkNavy}.`);
      return;
    }
    setSavingTheme(true);
    setThemeMessage(null);
    try {
      const response = await tenantAPI.updateTheme(themeHex.trim());
      useThemeStore.getState().setPrimaryHex(themeHex.trim());
      setThemeMessage(response.message || 'تم حفظ لون الواجهة.');
      toast.success('تم حفظ لون الواجهة');
      void hapticSuccess();
    } catch (err) {
      setThemeMessage(normalizeApiError(err).message);
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <FormScreenLayout
      title="إعدادات المستأجر"
      subtitle="قراءة — التعديل الكامل على الويب"
      onBack={navigation.goBack}
    >
      {loading && !info ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {info ? (
        <>
          <FormSection title="الشركة" icon="business">
            <FieldRow label="الاسم" value={String(info.name ?? '—')} />
            <FieldRow label="المعرّف" value={String(info.slug ?? '—')} />
            <FieldRow label="السجل التجاري" value={String(contact.cr_number ?? '—')} />
          </FormSection>
          <FormSection title="الثيم العام" icon="palette">
            <Text style={{ color: c.textMuted, fontSize: 13 }}>
              يدعم الخادم حالياً تعديل لون الواجهة الأساسي فقط من الجوال. محرر الألوان الكامل ورفع الشعارات يبقيان على الويب.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: canSaveTheme ? themeHex.trim() : c.darkNavy, borderWidth: 1, borderColor: c.border }} />
              <View style={{ flex: 1 }}>
                <AppInput label="لون الواجهة Hex" value={themeHex} onChangeText={setThemeHex} placeholder={c.darkNavy} autoCapitalize="none" />
              </View>
            </View>
            {themeMessage ? <Text style={{ color: c.info, fontSize: 13 }}>{themeMessage}</Text> : null}
            <AppButton title="حفظ اللون" loading={savingTheme} disabled={!canSaveTheme} onPress={() => void saveTheme()} />
          </FormSection>
          <FormSection title="إعدادات POS / الضريبة" icon="point-of-sale" subtitle="قراءة فقط">
            <Text style={{ color: c.textMuted, fontSize: 13 }}>
              لتعديل ضريبة نقطة البيع والإيصال وعلامات POS استخدم تفاصيل الفرع من قائمة الفروع.
            </Text>
            <FieldRow label="لون الواجهة" value={String((settings.theme as Record<string, unknown>)?.primary_hex ?? '—')} />
            <AppButton title="فروع وإعدادات POS" variant="secondary" onPress={() => navigation.navigate('BranchesList')} />
          </FormSection>
        </>
      ) : !loading && !error ? <AppEmptyState title="لا بيانات" /> : null}
    </FormScreenLayout>
  );
}
