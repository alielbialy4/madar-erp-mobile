# Priority Roadmap

Phased plan derived from module audits (`00`–`15`). **No implementation in this audit.**

---

## Phase 1 — Critical POS / Checkout / Printing / Offline

**Goals:** Safe cashier production path; fix broken report navigation; close payment gaps.

**Modules affected:**
- `src/navigation/MoreStack.tsx`, `types/navigation.ts`
- `src/screens/pos/*`, `store/posStore.ts`
- `src/services/offline/*`, `src/services/printing/*`
- `src/screens/reports/*`

**Gaps included:**
- ~~Register `ReportViewer` → `BaseReportScreen`, `LegacyReports` screen (P0)~~ **Done (Phase 2)**
- ~~POS held carts (P0)~~ **Done (2026-05-23)**
- ~~Loyalty redemption at checkout (P0)~~ **Done (2026-05-23)**
- ~~Gift card payment (P0)~~ **Done (2026-05-23)**
- Waiter POS or explicit defer + hide menu item (P0)
- Offline coupon validate + revalidate (P1)
- ~~Shift summary print (P1)~~ **Done (2026-05-23)**
- Sync conflict UI for failed offline orders (P1)

**Risk:** High — touches money and sync.

**Acceptance criteria:**
- All 22 report definitions open without navigation error
- POS completes sale with split, wallet, coupon (online), and queues offline sale with retry
- Held cart survives app restart
- Loyalty/gift card reflected in sale payload when enabled on branch
- Receipt print succeeds on at least one profile (BT or TCP)

---

## Phase 2 — Reports parity ✅ (2026-05-23)

**Goals:** Match web report filters, tables, export.

**Delivered:** See `docs/phase-2-reports-parity.md` — status **REPORTS READY WITH RISKS**.

**Remaining gaps:** Charts (Apex), native export/share, async product pickers. Saved reports list/run/delete and legacy comprehensive tab were closed in lockdown pass 2.

**Acceptance criteria:**
- ~~Each web sidebar report route opens on mobile~~ ✅
- Export on web ✅; native blocked with reason ✅
- Expiry `days_threshold` + warehouse filters ✅

---

## Phase 3 — Inventory / Purchases / Suppliers parity ✅ (2026-05-23)

**Goals:** Operational stock workflows without web fallback.

**Delivered:** See `docs/phase-3-inventory-purchases-suppliers.md` — status **PASS WITH RISKS**.

**Remaining gaps:** Full batch/expiry picker on adjustments/transfers; supplier mixed settlement; standalone return wizard; global supplier-payments list.

**Acceptance criteria:**
- ~~Complete stock count session on mobile posts to API~~ ✅
- ~~Purchase edit changes received quantities~~ ✅
- ~~Supplier payment recorded with vault~~ ✅ (from supplier detail; vault required)

---


## Phase 4 — Dining / Kitchen / Delivery parity ✅ (2026-05-23)

**Goals:** Restaurant and logistics staff can run day on tablet.

**Delivered:** See `docs/phase-4-dining-kitchen-delivery.md` — status **PASS WITH RISKS**.

**Remaining:** Full waiter modifiers; driver settlement create remains intentionally web-only; offline dining. Native kitchen ticket route was added in lockdown pass 2 and needs printer device QA.

**Acceptance criteria:**
- ~~Waiter can open table order and send to kitchen from one flow~~ ✅
- ~~KDS updates statuses; print job retry visible~~ ✅
- ~~Driver assignment changes delivery status~~ ✅

---

## Phase 5 — Admin / Settings / Users / Branches parity ✅ (2026-05-23)

**Goals:** Tenant admins manage users and branches without web.

**Modules:** `settings/*`, `branchesManage`, `activityLogs`, `tenant`, marketing CRUD

**Status:** PASS WITH RISKS — see `docs/phase-5-admin-settings-marketing.md`

**Remaining gaps:** Role definition edit (web/API missing for role CRUD), backup (web-only), promotion complex conditions. Tenant primary theme color edit was added in lockdown pass 2.

**Acceptance criteria:**
- ~~Create user with role on mobile~~ ✅ `UserForm`
- ~~Edit branch POS flags~~ ✅ `BranchDetail`
- ~~Coupon create with branch policy~~ ✅ `CouponForm`

---

## Phase 6 — UI/UX tablet and App Store readiness ✅ (2026-05-23)

**Goals:** Tablet layouts, RTL device QA, internal testing readiness.

**Status:** READY FOR INTERNAL TESTING — see `docs/phase-6-ui-ux-release-readiness.md`

**Remaining:** Store screenshots, Sentry, full chart parity, device-signed QA rows in checklist

**Acceptance criteria:**
- ~~iPad landscape POS usable without scrolling cart off-screen~~ ✅ Engineering
- RTL screenshot set for store listing — **device QA pending**
- `MOBILE_RUNTIME_QA_CHECKLIST.md` P0 — **engineering PASS; device NOT TESTED**

---

## Suggested first implementation slice

**Start Phase 1 item 1 only:** wire `ReportViewer` + `LegacyReports` in `MoreStack` (smallest change, unblocks 22 report routes and removes P0 NO-GO for managers).
