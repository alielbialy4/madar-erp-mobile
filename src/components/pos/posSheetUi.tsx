import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export function usePosSheetStyles() {
  const c = useColors();
  return useMemo(() => createPosSheetStyles(c), [c]);
}

function createPosSheetStyles(c: AppColors) {
  const cardShadow = Platform.select({
    ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
    root: { gap: spacing.lg, paddingBottom: spacing.md },
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
      borderRadius: radius.xxxl,
      backgroundColor: c.primary,
      padding: spacing.lg,
      gap: spacing.xs,
      alignItems: 'center',
    },
    totalHeroLabel: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: `${c.primaryForeground}CC`,
      writingDirection: 'rtl',
    },
    totalHeroValue: {
      fontSize: 32,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.primaryForeground,
      writingDirection: 'rtl',
    },
    totalHeroHint: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: `${c.primaryForeground}AA`,
      writingDirection: 'rtl',
    },
    section: { gap: spacing.sm },
    sectionLabel: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.textCaption,
      letterSpacing: 0.4,
    },
    sectionCard: {
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.sm,
      ...cardShadow,
    },
    lineCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
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
      writingDirection: 'ltr',
      textAlign: 'left',
    },
    summaryRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { ...textStart, fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted },
    summaryValue: { fontSize: typography.small, fontFamily: fonts.bold, color: c.text, writingDirection: 'rtl' },
    summaryDiscount: { color: c.danger },
    divider: { height: 1, backgroundColor: c.borderSubtle, marginVertical: spacing.xs },
    paymentRow: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm, alignItems: 'stretch' },
    paymentCard: {
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 100,
      maxWidth: 140,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 56,
    },
    paymentCardActive: {
      borderWidth: 2,
      borderColor: c.primary,
      backgroundColor: c.softPrimary,
      ...Platform.select({
        ios: { shadowColor: c.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 6 },
        android: { elevation: 4 },
        default: {},
      }),
    },
    paymentCardLabel: {
      fontSize: typography.tiny,
      lineHeight: 14,
      fontFamily: fonts.bold,
      color: c.text,
      writingDirection: 'rtl',
      textAlign: 'center',
      width: '100%',
    },
    paymentCardLabelActive: { color: c.primary },
    walletBanner: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softInfo,
      borderWidth: 1,
      borderColor: c.softInfoBorder,
    },
    walletText: { ...textStart, flex: 1, fontSize: typography.small, fontFamily: fonts.bold, color: c.info },
    errorBanner: {
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softDanger,
      borderWidth: 1,
      borderColor: c.softDangerBorder,
      gap: spacing.xs,
    },
    errorText: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.danger },
    warningBanner: {
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.softWarning,
      gap: spacing.xs,
    },
    warningText: { ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.warning },
    splitMeter: {
      ...flexRow,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    meterBox: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing.sm },
    meterValue: { fontSize: typography.cardTitle, fontFamily: fonts.extraBold, color: c.text, writingDirection: 'rtl' },
    meterLabel: { fontSize: 10, fontFamily: fonts.medium, color: c.textMuted, writingDirection: 'rtl' },
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
      <Text style={s.totalHeroLabel}>{label}</Text>
      <Text style={s.totalHeroValue}>{amount}</Text>
      {hint ? <Text style={s.totalHeroHint}>{hint}</Text> : null}
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
  const cardBasis = width >= 768 ? '30%' : '47%';

  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>طريقة الدفع</Text>
      <View style={s.paymentRow}>
        {options.map((opt) => {
          const active = value === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange(opt.key)}
              style={[s.paymentCard, { flexBasis: cardBasis }, active && s.paymentCardActive]}
            >
              {opt.brandTile ? (
                <View
                  style={{
                    width: 96,
                    height: 28,
                    borderRadius: 6,
                    backgroundColor: opt.brandTile.backgroundColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <Text
                    style={{
                      color: opt.brandTile.textColor,
                      fontSize: 9,
                      fontWeight: '800',
                      textAlign: 'center',
                      lineHeight: 11,
                    }}
                  >
                    {opt.brandTile.title}
                  </Text>
                </View>
              ) : opt.icon ? (
                <MaterialIcons name={opt.icon} size={22} color={active ? c.primary : c.textMuted} />
              ) : null}
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
                minHeight: 52,
                borderRadius: radius.xl,
                borderWidth: active ? 2 : 1,
                borderColor: active ? c.primary : c.border,
                backgroundColor: active ? c.primary : c.surface,
                ...flexRow,
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.xs,
              }}
            >
              <MaterialIcons
                name={seg.icon}
                size={20}
                color={active ? c.primaryForeground : c.textMuted}
              />
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: typography.body,
                  color: active ? c.primaryForeground : c.text,
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
