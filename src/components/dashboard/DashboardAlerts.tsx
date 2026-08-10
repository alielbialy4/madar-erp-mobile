import React from 'react';
import { AttentionBand } from '@/components/madar';

type AlertItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  tone: 'danger' | 'warning' | 'info';
  meta?: string;
  onPress?: () => void;
};

type Props = {
  alerts: AlertItem[];
};

export function DashboardAlerts({ alerts }: Props) {
  if (!alerts.length) return null;

  return (
    <AttentionBand
      title="التنبيهات"
      items={alerts.map((alert) => ({
        id: alert.id,
        title: alert.meta ? `${alert.title} · ${alert.meta}` : alert.title,
        detail: alert.subtitle,
        tone: alert.tone,
        onPress: alert.onPress,
      }))}
    />
  );
}
