import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader, AppText as Text } from '@/components/ui';
import { getPrinterProfiles } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { getPrintDiagnostics } from '@/services/printing/printDiagnostics';
import { usePrintStore } from '@/store/printStore';
import type { PrinterProfile } from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterDiagnostics'>;

export function PrinterDiagnosticsScreen({ navigation }: Props) {
  const c = useColors();
  const refreshPrint = usePrintStore((s) => s.refresh);
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [diag, setDiag] = useState({
    last_error: null as string | null,
    last_error_at: null as string | null,
    last_success_at: null as string | null,
    last_profile_id: null as string | null,
    last_profile_name: null as string | null,
  });
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const list = await getPrinterProfiles();
    setProfiles(list);
    if (!selectedId && list[0]) setSelectedId(list[0].id);
    setDiag(await getPrintDiagnostics());
    await refreshPrint();
  }, [selectedId, refreshPrint]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  const run = async (action: 'test' | 'page' | 'arabic') => {
    if (!selected) {
      setResult('اختر طابعة أولاً');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      if (action === 'test') await printEngine.testConnection(selected);
      else if (action === 'page') await printEngine.printTestPage(selected);
      else await printEngine.printArabicTest(selected);
      setResult(action === 'test' ? 'تم الاتصال بنجاح' : 'تم إرسال أمر الطباعة');
      await load();
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'فشلت الطباعة، يمكنك إعادة المحاولة');
      await load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="تشخيص الطابعات">
      <AppCard>
        <AppSectionHeader title="الطابعة" />
        {profiles.map((p) => (
          <AppListItem
            key={p.id}
            title={p.name}
            subtitle={`${p.connection_type} · ${p.ip ?? '—'}:${p.port}`}
            onPress={() => setSelectedId(p.id)}
            badge={selected?.id === p.id ? <AppBadge label="محددة" tone="success" /> : undefined}
          />
        ))}
      </AppCard>
      <AppCard>
        <AppSectionHeader title="آخر حالة" />
        <Text style={{ ...textStart, color: c.text }}>نجاح: {diag.last_success_at ?? '—'}</Text>
        <Text style={{ ...textStart, color: c.danger }}>خطأ: {diag.last_error ?? '—'}</Text>
        {result ? <Text style={{ ...textStart, color: c.info, marginTop: 8 }}>{result}</Text> : null}
      </AppCard>
      <View style={{ gap: 8 }}>
        <AppButton title="اختبار الاتصال" onPress={() => run('test')} loading={busy} disabled={!selected} />
        <AppButton title="صفحة تجريبية" variant="outline" onPress={() => run('page')} loading={busy} disabled={!selected} />
        <AppButton title="اختبار عربي" variant="outline" onPress={() => run('arabic')} loading={busy} disabled={!selected} />
        <AppButton title="قائمة انتظار الطباعة" variant="secondary" onPress={() => navigation.navigate('PrintQueue')} />
      </View>
    </AppScreen>
  );
}
