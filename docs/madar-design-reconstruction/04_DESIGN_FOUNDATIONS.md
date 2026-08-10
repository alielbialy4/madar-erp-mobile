# 04 — Design Foundations

Token spec for implementation in `src/constants/*`.

---

## 1. Color tokens (`AppColors`)

Map art direction → runtime theme keys (keep key names for migration; change values & semantics).

### Surfaces
| Role | Light | Dark |
|------|-------|------|
| background (canvas) | `#F3F5F9` | `#080D18` |
| surface | `#FFFFFF` | `#101725` |
| surfaceHeader | `#FFFFFF` | `#0C121F` |
| surfaceMuted / elevated | `#F8F9FC` | `#172033` |
| surfaceElement / interactive | `#EEF1F6` | `#202A40` |
| surfaceHover | `#E8ECF3` | `#273352` |

### Ink & borders
| Role | Light | Dark |
|------|-------|------|
| text | `#111827` | `#F3F5F9` |
| textMuted | `#5B6578` | `#9AA6BC` |
| textCaption | `#8B93A7` | `#6B7790` |
| border | `#E2E6EF` | `#243049` |
| borderSubtle | `#EBEEF5` | `#1A2438` |
| borderStrong | `#C9D0DE` | `#334564` |

### Brand
| Role | Light | Dark |
|------|-------|------|
| accent / brandAccent / ring | `#3B5BDB` | `#7792FF` |
| primary (gravity CTA) | `#111827` | `#7792FF` |
| primaryPressed | `#2948C8` / deeper | `#93A8FF` |
| accentSoft | `#EEF2FC` | `rgba(119,146,255,0.14)` |

### Semantic
| Role | Light | Dark |
|------|-------|------|
| success | `#159A70` | `#2BB88A` |
| warning | `#C98719` | `#D9A03A` |
| danger | `#D54848` | `#E35D5D` |
| info | `#3478E5` | `#5B94F0` |
| refund (new use via danger/info maps where needed) | `#C83F61` | `#E05A7A` |

Soft wells: drastically quieter — prefer tiny left/top cue over full pastel fills.

### Payment methods
Neutral surfaces + cobalt selection. Method identity via icon + label, not purple wallpaper.

### Charts
Primary series: brand cobalt  
Positive / negative: semantic  
Secondary series: controlled navy/slate variants — max 5 deliberate data colors.

---

## 2. Typography

### Size scale
| Token | px |
|-------|---:|
| heroMetric | 40 |
| largeFinancial | 32 |
| financialValue | 22 |
| pageTitle | 22 |
| entityTitle | 18 |
| sectionTitle | 15 |
| rowPrimary | 15 |
| rowSecondary | 13 |
| body | 14 |
| controlLabel | 13 |
| metadata | 12 |
| caption | 11 |
| statusText | 11 |
| micro | 10 |

### Presets (textStyles)
`HeroMetric` · `LargeFinancialValue` · `FinancialValue` · `PageTitle` · `EntityTitle` · `SectionTitle` · `RowPrimary` · `RowSecondary` · `Metadata` · `Caption` · `StatusText` · `ControlLabel` · `Body`

Financial presets:
- `fontVariant: ['tabular-nums']` where available  
- LTR writing direction / `textLtr`  
- ExtraBold for hero/large; Bold for financialValue  
- Avoid wrapping on amounts

---

## 3. Spacing scale
`2 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48`  
Section rhythm: 20–24 default; dense lists 8–12 vertical.

Named:
- `space.xs=4` `sm=8` `md=12` `lg=16` `xl=20` `xxl=24` `xxxl=32` `huge=40` `massive=48`
- `sectionGap=24` (was 28 — tighten)
- `cardPadding=16` (was 20 — reduce card air)

## 4. Radius
| Token | Value |
|-------|------:|
| control | 8 |
| input | 10 |
| surface | 12 |
| sheet | 16 |
| badge | 6 |
| pill | 999 |

Map legacy `radius.card` → 12, `button` → 8, `input` → 10, remove xxxl bubble defaults from content cards.

## 5. Elevation tiers
0 content · 1 sticky header · 2 dock/nav · 3 sheet · 4 modal

## 6. Density row heights (targets)
| Row | Height |
|-----|-------:|
| DenseRow | 52 |
| StandardRow | 60 |
| FinancialRow | 56 |
| OperationalRow | 64 |
| EntityRow | 68 |

## 7. Control heights
Icon button 40 · Text field 44 · Primary button 48 · Compact chip 28 · Nav item 48

## 8. Iconography
Single family (existing AppIcon). Optical 20/22. No colored wells by default. Semantic icons only when status.
