# 05 — Component Architecture

Design-system success = **adoption**, not file count.

---

## Primitives to keep & harden

| Component | Role | Change |
|-----------|------|--------|
| AppText | Themed text | Add new presets; push financial hierarchy |
| AppButton | Actions | Mature radius; ink/cobalt variants; less pill |
| AppInput / AppSearchField | Fields | Shared grammar height/radius |
| AppBottomSheet | Overlays | Sheet radius 16; calm chrome |
| AppDivider | Structure | Prefer over borders |
| AppBadge / AppChip | Status / filters only | No decorative chips as buttons |
| AppSegmentedControl | High-freq filters | Compact |
| AppEmptyState / AppErrorState | States | Efficient copy, no giant art |
| AppIcon | Single family | No random wells |

## New / elevated structural primitives

| Primitive | Purpose |
|-----------|---------|
| `MadarCanvas` | Page background contract |
| `MadarSection` | Title + optional action + children without card |
| `MadarSurface` | Subtle grouped mass |
| `FinancialValue` | Currency + amount + size level |
| `DenseRow` | High-density list row |
| `FinancialRow` | Amount-trailing financial list row |
| `EntityRow` | Party/product index row |
| `OperationalRow` | Status/time/ops row (delivery/KDS/sales) |
| `MetricBlock` | Level A–D KPI without pastel fills |
| `FilterGrammar` | Trigger + chips + sheet + active summary |
| `DocumentHeader` | Transaction document identity |
| `QuickActionBar` | Compact entity actions |
| `AttentionBand` | Exceptions strip for command centers |

Implement as thin wrappers in `src/components/madar/` first, migrate consumers.

## Archetype layouts (layout package)

| Layout | Path intent |
|--------|-------------|
| CommandCenterLayout | Dashboard/Shift/KDS |
| ResourceIndexLayout | Lists |
| EntityDetailLayout | Parties/products/accounts |
| TransactionDocumentLayout | Sale/Purchase/Expense docs |
| EditorLayout | Forms (enhance FormScreenLayout) |
| DataAnalysisLayout | Reports |

Reuse `AppScreen`, `ListScreenLayout`, `DetailScreenLayout` where possible; change composition, not dump rewrites.

## Row API (canonical)

```
DenseRow
  leading?: ReactNode
  primary: string
  secondary?: string
  meta?: string
  status?: ReactNode
  trailing?: ReactNode   // often FinancialValue
  onPress?: () => void
```

## Deprecation path

| Legacy | Action |
|--------|--------|
| AppDomainCard for list rows | → Dense/Entity/Financial rows |
| AppStatCard / MetricCard pastel | → MetricBlock levels |
| ModuleCard / ActionCard rainbow | → Neutral surface + typography |
| GradientMesh in ERP content | Remove from operational screens |
| Soft tinted payment cards | Neutral + selection ring |

---

## Adoption tracking (update as we migrate)

| Primitive | Consumers | Legacy alt remaining |
|-----------|----------:|---------------------:|
| FinancialValue | 0 | many raw Text amounts |
| DenseRow | 0 | AppListCard / DomainCard |
| MetricBlock | 0 | MetricCard / AppStatCard / DashboardKpiCard |
| MadarSection | 0 | Card wrappers |

Target Wave 10: major modules on new primitives; legacy count ↓ ≥50%.
