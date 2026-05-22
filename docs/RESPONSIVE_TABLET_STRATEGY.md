# Madar ERP Mobile — Responsive & Tablet Strategy

---

## 1. Breakpoint System

Defined in `src/constants/responsive.ts`:

| Breakpoint | Width Range | Columns | Grid Gap | Card Padding |
|-----------|-------------|---------|----------|--------------|
| `phone` | < 600px | 1 | 12px | 16px |
| `largePhone` | 600–899px | 2 | 14px | 18px |
| `tablet` | 900–1199px | 3 | 16px | 20px |
| `largeTablet` | >= 1200px | 4 | 18px | 24px |

The breakpoint is determined by `getBreakpoint(width)` which reads from `Dimensions.get('window')` or `useWindowDimensions()`.

### DEVICE Constants

```ts
DEVICE = {
  width, height,
  isTablet: width >= 900,
  isPhone: width < 900,
  isLargePhone: width >= 600 && width < 900,
  isSmallPhone: width < 380,
  isLandscape: width > height,
  isIOS, isAndroid, isWeb,
}
```

---

## 2. Phone Strategy (< 900px)

### Navigation
- **Floating bottom navigation bar** (`PremiumBottomNav.tsx`) — 72px height
- 5 tabs: Dashboard, Products, POS (center orb), Sales, More
- POS tab is elevated 18px above the bar as a prominent orb
- Drawer accessible via hamburger icon in `AppHeader`

### Layout
- Single-column layouts for most screens
- 2-column grid for product cards on large phones (600–899px)
- Compact cards with 16px padding on phone, 18px on large phone

### Modals & Sheets
- Bottom sheets for all modal interactions (`AppBottomSheet.tsx`)
- Full-screen forms for create/edit operations

### Cards
- `AppCard` with surface background, border, and `shadows.card`
- Vertical stacking for list items

---

## 3. Tablet Strategy (>= 900px)

### Navigation
- **Bottom navigation bar is hidden** (`TAB_BAR_DOCK_HEIGHT = 0` when `SCREEN_WIDTH >= 900`)
- **Persistent sidebar drawer** (`Sidebar.tsx`) acts as the primary navigation
- Drawer width: 280px (`responsive.sideNavWidth`)
- Searchable menu with section grouping
- Command palette available via search trigger

### Layout
- Multi-column grid layouts (3 columns on tablet, 4 on large tablet)
- Wider cards with 20px padding on tablet, 24px on large tablet
- Larger grid gaps (16px tablet, 18px large tablet)

### POS on Tablet
- **Catalog + Cart side by side** — already implemented in `POSScreen.tsx`
- `PosCatalogPanel.tsx` on the left (or start side in RTL)
- `PosOrderPanel.tsx` on the right (or end side in RTL)
- Minimum split width: 900px (`responsive.tabletMinSplit`)

### Dashboard on Tablet
- Multi-column KPI card grid
- 3-4 metric cards per row instead of 2
- Wider revenue trend chart
- More quick actions visible without scrolling

### Products on Tablet
- Grid view with 3-4 columns instead of 2
- More products visible without scrolling
- Filter panel can occupy a side column

### Inventory on Tablet
- Multi-column warehouse cards
- Stock movement list with more data visible
- Detail screens with side-by-side info blocks

---

## 4. Hook API

### `useResponsive()`

Located at `src/hooks/useResponsiveColumns.ts`:

```ts
const {
  width, height,       // Current window dimensions
  breakpoint,           // 'phone' | 'largePhone' | 'tablet' | 'largeTablet'
  isTablet,             // width >= 900
  isPhone,              // width < 900
  isLargePhone,         // 600 <= width < 900
  isLandscape,          // width > height
  columns,              // 1 | 2 | 3 | 4
  gridColumns,          // 2 | 2 | 3 | 4 (minimum 2 for grid views)
} = useResponsive();
```

### `useResponsiveColumns(phone, largePhone, tablet)`

Returns the number of columns for the current breakpoint with custom overrides:

```ts
const cols = useResponsiveColumns(1, 2, 3);
// phone: 1, largePhone: 2, tablet: 3, largeTablet: 4
```

---

## 5. Tab Bar Behavior

Defined in `src/constants/tabBar.ts`:

| Property | Phone | Tablet |
|----------|-------|--------|
| `TAB_BAR_DOCK_HEIGHT` | 72px | 0px (hidden) |
| `TAB_BAR_HORIZONTAL_MARGIN` | 16px | 0px |
| `TAB_BAR_FLOAT_GAP` | 8px | 8px |
| `TAB_BAR_POS_LIFT` | 18px | 18px |
| `BOTTOM_NAV_HEIGHT` | 98px | 26px |

On tablet, `TAB_BAR_DOCK_HEIGHT = 0` means the bottom nav bar is not rendered. The `BOTTOM_NAV_HEIGHT` is still non-zero (26px) to account for safe area insets in screen content padding.

---

## 6. Implementation Pattern

### Responsive Grid

```tsx
import { useResponsive } from '@/hooks/useResponsiveColumns';

function ProductGrid({ products }) {
  const { columns, isTablet } = useResponsive();
  
  return (
    <FlatList
      data={products}
      numColumns={columns}
      key={columns} // Force re-render on column change
      renderItem={({ item }) => <ProductCard product={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Conditional Tablet Layout

```tsx
const { isTablet } = useResponsive();

return isTablet ? (
  <View style={{ flexDirection: 'row' }}>
    <CatalogPanel style={{ flex: 1 }} />
    <OrderPanel style={{ flex: 1 }} />
  </View>
) : (
  <View style={{ flex: 1 }}>
    {showCatalog ? <CatalogPanel /> : <OrderPanel />}
  </View>
);
```

### Responsive Constants

```ts
import { responsive } from '@/constants/responsive';

const cardPadding = responsive.cardPadding[breakpoint]; // 16 | 18 | 20 | 24
const gridGap = responsive.gridGap[breakpoint];         // 12 | 14 | 16 | 18
```

---

## 7. Tested Viewports

| Device | Width | Breakpoint | Bottom Nav | Columns |
|--------|-------|-----------|------------|---------|
| iPhone SE | 375px | phone | Visible | 1 |
| iPhone 15 | 393px | phone | Visible | 1 |
| iPhone 15 Plus | 430px | phone | Visible | 1 |
| iPhone 15 Pro Max (landscape) | 932px | tablet | Hidden | 3 |
| iPad mini | 744px | largePhone | Visible | 2 |
| iPad (portrait) | 820px | largePhone | Visible | 2 |
| iPad (landscape) | 1180px | tablet | Hidden | 3 |
| iPad Pro 12.9" | 1024px | tablet | Hidden | 3 |
| iPad Pro 12.9" (landscape) | 1366px | largeTablet | Hidden | 4 |
| Android phone | 360–412px | phone | Visible | 1 |
| Android tablet | 900px+ | tablet | Hidden | 3 |

---

## 8. App Configuration

`app.json` sets `ios.supportsTablet: true` to ensure the app runs natively on iPad with correct scaling, rather than as a scaled-up iPhone app.
