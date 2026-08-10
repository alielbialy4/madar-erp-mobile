import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart, appWritingDirection, appTextAlignStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export function usePosSheetStyles() {
  const c = useColors();
  return useMemo(() => createPosSheetStyles(c), [c]);
}

function createPosSheetStyles(c: AppColors) {
  return StyleSheet.create({
    root: { gap: spacing.md, paddingBottom: spacing.sm },
    sheetHeader: { gap: spacing.xs },
    sheetTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
    },
    sheetSubtitle: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.textMuted,
      lineHeight: 20,
    },
    totalHero: {
      ...flexRow,
      borderRadius: radius.surface,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderStartWidth: 3,
      borderStartColor: c.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.md,
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    totalHeroCopy: { flex: 1, minWidth: 0, gap: 2 },
    totalHeroLabel: {
      fontSize: typography.controlLabel,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: c.textMuted,
      writingDirection: appWritingDirection,
      textAlign: appTextAlignStart,
    },
    totalHeroValue: {
      fontSize: typography.largeFinancial,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.4,
      fontVariant: ['tabular-nums'],
      ...textLtr,
    },
    totalHeroHint: {
      fontSize: typography.metadata,
      fontFamily: fonts.regular,
      color: c.textCaption,
      writingDirection: appWritingDirection,
      textAlign: appTextAlignStart,
    },
    section: { gap: spacing.sm },
    sectionLabel: {
      ...textStart,
      fontSize: typography.caption,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: c.textCaption,
      letterSpacing: 0.2,
    },
    sectionCard: {
      backgroundColor: c.surface,
      borderRadius: radius.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.sm,
    },
    lineCard: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    lineRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
    lineName: { ...textStart, flex: 1, fontSize: typography.body, fontFamily: fonts.bold, color: c.text },
    lineMeta: { ...textStart, fontSize: typography.tiny, fontFamily: fonts.medium, color: c.textMuted },
    lineAmount: {
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
      ...textLtr,
    },
    summaryRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { ...textStart, fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted },
    summaryValue: { fontSize: typography.small, fontFamily: fonts.bold, color: c.text, ...textLtr },
    summaryDiscount: { color: c.danger },
    divider: { height: 1, backgroundColor: c.borderSubtle, marginVertical: spacing.xs },
    paymentRow: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs, alignItems: 'stretch' },
    paymentCard: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 92,
      maxWidth: 180,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
      alignItems: 'flex-start',
      justifyContent: 'center',
      gap: 4,
      minHeight: 62,
    },
    paymentCardActive: {
      borderWidth: 1.5,
      borderColor: c.accent,
      backgroundColor: c.surface,
    },
    paymentCardTop: { ...flexRow, width: '100%', alignItems: 'center', justifyContent: 'space-between' },
    paymentCardLabel: {
      fontSize: typography.metadata,
      lineHeight: 15,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: c.text,
      writingDirection: appWritingDirection,
      textAlign: appTextAlignStart,
      width: '100%',
    },
    paymentCardLabelActive: { color: c.accent },
    walletBanner: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.surface,
      backgroundColor: c.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    walletText: { ...textStart, flex: 1, fontSize: typography.rowSecondary, fontFamily: fonts.medium, color: c.text },
    errorBanner: {
      padding: spacing.md,
      borderRadius: radius.surface,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.danger,
      gap: spacing.xs,
    },
    errorText: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.danger },
    warningBanner: {
      padding: spacing.md,
      borderRadius: radius.surface,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.warning,
      gap: spacing.xs,
    },
    warningText: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.warning },
    splitMeter: {
      ...flexRow,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    meterBox: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
    meterValue: { fontSize: typography.cardTitle, fontFamily: fonts.extraBold, color: c.text, writingDirection: appWritingDirection },
    meterLabel: { fontSize: 10, fontFamily: fonts.medium, color: c.textMuted, writingDirection: appWritingDirection },
    meterDue: { color: c.primary },
    meterPaid: { color: c.success },
    meterRemain: { color: c.warning },
    footerBar: {
      gap: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
    },
    stickyFooter: {
      gap: spacing.sm,
      paddingTop: spacing.lg,
      marginTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
    },
  });
}

export function PosSheetHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const s = usePosSheetStyles();
  return (
    <View style={s.sheetHeader}>
      <Text style={s.sheetTitle}>{title}</Text>
      {subtitle ? <Text style={s.sheetSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function PosTotalHero({ label, amount, hint }: { label: string; amount: string; hint?: string }) {
  const s = usePosSheetStyles();
  return (
    <View style={s.totalHero}>
      <View style={s.totalHeroCopy}>
        <Text style={s.totalHeroLabel}>{label}</Text>
        {hint ? <Text style={s.totalHeroHint}>{hint}</Text> : null}
      </View>
      <Text style={s.totalHeroValue}>{amount}</Text>
    </View>
  );
}

type PaymentKey = string;

export function PosPaymentMethodGrid({
  value,
  options,
  onChange,
}: {
  value: PaymentKey;
  options: {
    key: PaymentKey;
    label: string;
    icon?: React.ComponentProps<typeof MaterialIcons>['name'];
    brandTile?: { backgroundColor: string; textColor: string; title: string };
  }[];
  onChange: (key: PaymentKey) => void;
}) {
  const c = useColors();
  const s = usePosSheetStyles();
  const { width } = useWindowDimensions();
  const compact = width < 600;

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>طريقة الدفع</Text>
      <View style={s.paymentRow}>
        {options.map((opt, index) => {
          const active = value === opt.key;
          const cardBasis = compact ? (index < 2 ? '47%' : '30%') : '30%';
          const fallbackIcons: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
            electronic_wallet: 'account-balance-wallet',
            instapay: 'bolt',
          };
          const icon = opt.icon ?? fallbackIcons[opt.key] ?? 'payments';
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[s.paymentCard, { flexBasis: cardBasis }, active && s.paymentCardActive]}
            >
              <View style={s.paymentCardTop}>
                <MaterialIcons name={icon} size={20} color={active ? c.accent : c.textMuted} />
                {active ? <MaterialIcons name="check-circle" size={17} color={c.accent} /> : null}
              </View>
              <Text style={[s.paymentCardLabel, active && s.paymentCardLabelActive]} numberOfLines={2}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PosOrderTypeSegment({
  needsDelivery,
  onChange,
}: {
  needsDelivery: boolean;
  onChange: (delivery: boolean) => void;
}) {
  const c = useColors();
  const s = usePosSheetStyles();

  const segments = [
    { key: false as const, label: 'تيك أواي', icon: 'shopping-bag' as const },
    { key: true as const, label: 'توصيل', icon: 'delivery-dining' as const },
  ];

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>نوع الطلب</Text>
      <View style={{ ...flexRow, gap: spacing.sm }}>
        {segments.map((seg) => {
          const active = needsDelivery === seg.key;
          return (
            <Pressable
              key={seg.label}
              onPress={() => onChange(seg.key)}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: active ? c.primary : c.border,
                backgroundColor: active ? c.primarySoftMuted : c.surface,
                ...flexRow,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
            >
              <MaterialIcons
                name={seg.icon}
                size={20}
                color={active ? c.primary : c.textMuted}
              />
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: typography.body,
                  color: active ? c.primary : c.text,
                }}
              >
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PosCollapsibleSection({
  label,
  summary,
  defaultOpen,
  children,
}: {
  label: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const c = useColors();
  const s = usePosSheetStyles();
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <View style={s.section}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}
        accessibilityRole="button"
      >
        <Text style={s.sectionLabel}>{label}</Text>
        <View style={{ ...flexRow, alignItems: 'center', gap: spacing.xs }}>
          {!open && summary ? (
            <Text style={{ fontSize: typography.small, fontFamily: fonts.bold, color: c.primary }}>{summary}</Text>
          ) : null}
          <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={22} color={c.textCaption} />
        </View>
      </Pressable>
      {open ? <View style={s.sectionCard}>{children}</View> : null}
    </View>
  );
}

export function PosSheetSection({ label, children }: { label: string; children: React.ReactNode }) {
  const s = usePosSheetStyles();
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{label}</Text>
      <View style={s.sectionCard}>{children}</View>
    </View>
  );
}
