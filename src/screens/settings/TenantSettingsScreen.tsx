import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { tenantAPI } from '@/api/tenant';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { useThemeStore } from '@/store/themeStore';

export function TenantSettingsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [themeHex, setThemeHex] = useState('#0F172A');
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
      setThemeMessage('لون غير صالح. اكتب Hex مثل #0F172A.');
      return;
    }
    setSavingTheme(true);
    setThemeMessage(null);
    try {
      const response = await tenantAPI.updateTheme(themeHex.trim());
      useThemeStore.getState().setPrimaryHex(themeHex.trim());
      setThemeMessage(response.message || 'تم حفظ لون الواجهة.');
    } catch (err) {
      setThemeMessage(normalizeApiError(err).message);
    } finally {
      setSavingTheme(false);
    }
  };

  return (
    <AppScreen title="إعدادات المستأجر" subtitle="قراءة — التعديل الكامل على الويب" onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {loading && !info ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {info ? (
        <View style={{ gap: spacing.md }}>
          <AppCard>
            <AppSectionHeader title="الشركة" />
            <AppListItem title="الاسم" subtitle={String(info.name ?? '—')} />
            <AppListItem title="المعرّف" subtitle={String(info.slug ?? '—')} />
            <AppListItem title="السجل التجاري" subtitle={String(contact.cr_number ?? '—')} />
          </AppCard>
          <AppCard>
            <AppSectionHeader title="الثيم العام" />
            <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: spacing.sm }}>
              يدعم الخادم حالياً تعديل لون الواجهة الأساسي فقط من الجوال. محرر الألوان الكامل ورفع الشعارات يبقيان على الويب.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm }}>
              <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: canSaveTheme ? themeHex.trim() : '#000', borderWidth: 1, borderColor: c.border }} />
              <View style={{ flex: 1 }}>
                <AppInput label="لون الواجهة Hex" value={themeHex} onChangeText={setThemeHex} placeholder="#0F172A" autoCapitalize="none" />
              </View>
            </View>
            {themeMessage ? <Text style={{ color: c.info, fontSize: 13, marginBottom: spacing.sm }}>{themeMessage}</Text> : null}
            <AppButton title="حفظ اللون" loading={savingTheme} disabled={!canSaveTheme} onPress={() => void saveTheme()} />
          </AppCard>
          <AppCard>
            <AppSectionHeader title="إعدادات POS / الضريبة (قراءة)" />
            <Text style={{ color: c.textMuted, fontSize: 13, marginBottom: spacing.sm }}>
              لتعديل ضريبة نقطة البيع والإيصال وعلامات POS استخدم تفاصيل الفرع من قائمة الفروع.
            </Text>
            <AppListItem title="لون الواجهة" subtitle={String((settings.theme as Record<string, unknown>)?.primary_hex ?? '—')} />
            <AppButton title="فروع وإعدادات POS" variant="secondary" onPress={() => navigation.navigate('BranchesList')} />
          </AppCard>
        </View>
      ) : !loading && !error ? <AppEmptyState title="لا بيانات" /> : null}
    </AppScreen>
  );
}
