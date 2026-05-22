import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { tenantAPI } from '@/api/tenant';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

export function TenantSettingsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenantAPI.info();
      const data = extractData(res) as { tenant?: Record<string, unknown> } | undefined;
      setInfo(data?.tenant ?? (data as Record<string, unknown>) ?? null);
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
