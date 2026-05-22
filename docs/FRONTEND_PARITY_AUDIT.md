# Madar ERP Mobile — Frontend Parity Audit

Audits feature parity between the Madar ERP web application (`front/`) and the mobile application.

---

## 1. Complete Modules

These modules have full mobile implementations with all critical CRUD operations and list/detail views:

### Dashboard
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| KPI metrics | ✅ | ✅ | Full |
| Revenue trend chart | ✅ | ✅ (simplified) | Near-full |
| Quick actions | ✅ | ✅ | Full |
| Role-based views (global/branch/cashier) | ✅ | ✅ | Full |
| Branch scope selector | ✅ | ✅ | Full |

### POS
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Product catalog with categories | ✅ | ✅ | Full |
| Cart management | ✅ | ✅ | Full |
| Modifier selection | ✅ | ✅ | Full |
| Checkout and payment | ✅ | ✅ | Full |
| Split payment | ✅ | ✅ | Full |
| Coupon redemption | ✅ | ✅ | Full |
| Gift card payment | ✅ | ✅ | Full |
| Discount application | ✅ | ✅ | Full |

### Products
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Product list with search/filters | ✅ | ✅ | Full |
| Product detail | ✅ | ✅ | Full |
| Create/edit product | ✅ | ✅ | Full |
| Category management | ✅ | ✅ | Full |
| Category/product reorder | ✅ | ✅ | Full |
| Product insights | ✅ | ✅ | Full |
| Barcode management | ✅ | ✅ | Full |
| Opening stock editor | ✅ | ✅ | Full |
| Option groups editor | ✅ | ✅ | Full |
| Units editor | ✅ | ✅ | Full |

### Sales
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Sales list with search | ✅ | ✅ | Full |
| Sale detail with line items | ✅ | ✅ | Full |
| Payment details | ✅ | ✅ | Full |
| Date range filters | ✅ | ✅ | Full |

### Customers
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Customer list with search | ✅ | ✅ | Full |
| Customer detail | ✅ | ✅ | Full |
| Quick create customer | ✅ | ✅ | Full |

### Inventory
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Stock balances | ✅ | ✅ | Full |
| Warehouses (CRUD) | ✅ | ✅ | Full |
| Stock movements | ✅ | ✅ | Full |
| Stock adjustments | ✅ | ✅ | Full |
| Stock transfers | ✅ | ✅ | Full |
| Expiry alerts | ✅ | ✅ | Full |

### Purchases
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Purchase list | ✅ | ✅ | Full |
| Purchase detail | ✅ | ✅ | Full |
| Create purchase | ✅ | ✅ | Full |
| Purchase returns (read) | ✅ | ✅ | Full |

### Suppliers
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Supplier list | ✅ | ✅ | Full |
| Supplier detail | ✅ | ✅ | Full |
| Supplier report | ✅ | ✅ | Full |

### Kitchen
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Kitchen order list | ✅ | ✅ | Full |
| Order status filters | ✅ | ✅ | Full |
| Update order status | ✅ | ✅ | Full |
| Kitchen order detail | ✅ | ✅ | Full |

### Expenses
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Expense list | ✅ | ✅ | Full |
| Create expense | ✅ | ✅ | Full |
| Expense detail | ✅ | ✅ | Full |

### Coupons
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Coupon list | ✅ | ✅ | Full |
| Coupon detail | ✅ | ✅ | Full |
| POS coupon validation | ✅ | ✅ | Full |

### Reports
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Sales summary | ✅ | ✅ | Full |
| Tax report | ✅ | ✅ | Full |
| Treasury report | ✅ | ✅ | Full |
| Expense report | ✅ | ✅ | Full |
| Inventory valuation | ✅ | ✅ | Full |
| Stock movements report | ✅ | ✅ | Full |
| Expiry report | ✅ | ✅ | Full |
| Customer aging | ✅ | ✅ | Full |
| Supplier aging | ✅ | ✅ | Full |
| Coupon report | ✅ | ✅ | Full |
| Dining report | ✅ | ✅ | Full |
| Delivery report | ✅ | ✅ | Full |
| Shift performance | ✅ | ✅ | Full |
| Refund report | ✅ | ✅ | Full |

### Promotions & Gift Cards
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| Promotion list | ✅ | ✅ | Full |
| Promotion detail | ✅ | ✅ | Full |
| Gift card list | ✅ | ✅ | Full |
| Gift card detail | ✅ | ✅ | Full |

### Users & Notifications
| Feature | Web | Mobile | Parity |
|---------|-----|--------|--------|
| User list | ✅ | ✅ | Full |
| Notification list | ✅ | ✅ | Full |
| Unread count | ✅ | ✅ | Full |
| Mark as read | ✅ | ✅ | Full |

---

## 2. Partial Modules

These modules have mobile implementations but with limited functionality:

### Dining
| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Dining halls list | ✅ | ✅ | Complete |
| Tables view | ✅ | ✅ | Complete |
| Active table order | ✅ | ✅ | Complete |
| Settle table | ✅ | ⚠️ | Partial — depends on branch context |
| Waiter POS | ✅ | ❌ | Web-only (uses `ParityModuleScreen`) |
| Create/edit halls | ✅ | ❌ | Web-only |

### Refunds
| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Refund list | ✅ | ✅ | Complete |
| Refund detail | ✅ | ✅ | Complete |
| Partial refund | ✅ | ✅ | Complete — from sale detail |
| Full refund | ✅ | ⚠️ | Available when line items are clear |

### Vaults & Shifts
| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Current shift view | ✅ | ✅ | Complete |
| Vault list | ✅ | ✅ | Complete |
| Open/close shift | ✅ | ❌ | Web-only (high-risk financial operation) |
| Vault deposit/withdraw | ✅ | ❌ | Web-only (high-risk financial operation) |
| Vault transactions (read) | ✅ | ⚠️ | Read-only via ParityModuleScreen |

### Delivery
| Feature | Web | Mobile | Status |
|---------|-----|--------|--------|
| Delivery order list | ✅ | ✅ | Complete |
| Delivery detail | ✅ | ✅ | Complete |
| Driver management | ✅ | ❌ | Web-only |
| Delivery zones | ✅ | ❌ | Web-only |
| Driver settlements | ✅ | ❌ | Web-only |
| Delivery finance | ✅ | ❌ | Web-only |

---

## 3. Read-Only Parity Modules

These web features are accessible on mobile via `ParityModuleScreen` as read-only views or with a disabled message explaining why the feature is web-only:

| Web Route | Mobile Access | Data Source | Note |
|-----------|--------------|-------------|------|
| `/waiter` | ParityModule | `/dining-halls` | Halls data as read reference |
| `/sales/products` | ParityModule | `/reports/sales/summary` | Summary from reports endpoint |
| `/sales/layaway` | ParityModule | `/layaway` | List readable; payments deferred |
| `/inventory/reorder-rules` | ParityModule | `/inventory/reorder-rules` | Read-only |
| `/inventory/requisitions` | ParityModule | `/inventory/requisitions` | Read-only |
| `/inventory/stock-counts` | ParityModule | `/inventory/stock-counts` | Read-only |
| `/supplier-payments` | ParityModule | `/supplier-payments` | Read-only |
| `/drivers` | ParityModule | `/drivers` | Read-only |
| `/delivery-zones` | ParityModule | `/delivery-zones` | Read-only |
| `/driver-settlements` | ParityModule | `/driver-settlements` | Read-only |
| `/delivery-finance/*` | ParityModule | Various delivery endpoints | Read-only |
| `/kitchen/print-jobs` | ParityModule | `/kitchen/print-jobs` | Read-only |
| `/kitchen/stations` | ParityModule | `/kitchen/stations` | Read-only |
| `/vaults/transactions` | ParityModule | `/vaults/transactions` | Read-only |
| `/branches` | ParityModule | `/branches` | Read-only |
| `/payments` | ParityModule | `/payments` | Read-only |
| `/backup` | ParityModule | None | Disabled — admin-only, web-only |
| `/activity-logs` | ParityModule | `/activity-logs` | Read-only |
| Various `/reports/*` sub-routes | ParityModule | Various report endpoints | Read-only |

---

## 4. Design Parity

### Shared Patterns
- Same color token system (dark navy #0C1222, accent #3366FF)
- Same module definitions and permissions
- Same sidebar menu structure via `buildSidebarMenu.ts`
- Same icon mapping via `sidebarIcons.ts`
- Same API endpoints via shared API contract

### Mobile-Unique Features
- Floating bottom navigation with POS center orb
- Pull-to-refresh on all data screens
- Offline support with sync service
- Skeleton loading animations
- Spring-based press animations
- Tablet-responsive grid layouts
- Command palette for quick navigation

### Web-Unique Features
- Advanced report builders with date pickers and charts
- Full CRUD for branches and settings
- Backup management
- Financial operations (shift open/close, vault deposit/withdraw)
- Driver and delivery zone management
- Waiter POS experience
- Kitchen station and printer management
- Stock count creation/posting

---

## 5. API Parity

The mobile app uses 30 API modules (`src/api/`) covering all endpoints needed for implemented features:

| API Module | Endpoints |
|------------|-----------|
| `auth.ts` | Login, logout, refresh |
| `dashboard.ts` | KPI data, metrics |
| `pos.ts` | Cart operations, checkout |
| `products.ts` | CRUD, search |
| `categories.ts` | CRUD, reorder |
| `sales.ts` | List, detail |
| `customers.ts` | List, detail, create |
| `inventory.ts` | Balances, movements, adjustments, transfers |
| `purchases.ts` | List, detail, create, returns |
| `suppliers.ts` | List, detail |
| `kitchen.ts` | Orders, status updates |
| `expenses.ts` | List, create |
| `coupons.ts` | List, validate |
| `promotions.ts` | List, detail |
| `reports.ts` | Various report endpoints |
| `dining.ts` | Halls, tables, orders |
| `refunds.ts` | List, create partial |
| `delivery.ts` | Orders |
| `vaults.ts` | List, shifts |
| `shifts.ts` | Shift data |
| `settings.ts` | Profile, branch |
| `notifications.ts` | List, read status |
| `branches.ts` | List, switch |
| `giftCards.ts` | List, detail |
| `supplierPayments.ts` | List |
| `cashMovements.ts` | List |
| `wallet.ts` | Balance |
| `formData.ts` | Form helpers |
| `client.ts` | HTTP client configuration |
