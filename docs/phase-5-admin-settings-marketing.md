# Phase 5 — Admin / Settings / Marketing Parity

**Date:** 2026-05-23  
**Scope:** `madar-erp-mobile/` only  
**Status:** **PASS WITH RISKS**

## Summary

Admin, settings, and marketing modules now use dedicated screens with permission checks and Arabic 403 messages via `normalizeApiError`. Weak `ParityModule` routes for branches, activity logs, and backup are replaced or explicitly blocked.

## Delivered

### Settings & admin

| Feature | Route | Notes |
|---------|-------|-------|
| Profile / password | `Settings` | Separate success/error messages per section |
| Tenant info | `TenantSettings` | Read-only; branch POS settings via `BranchDetail` |
| Branches | `BranchesList`, `BranchDetail` | Tax, POS flags, receipt footer (`patchSettings`) |
| Users | `Users`, `UserForm` | Create/edit/delete + `syncUserRoles` |
| Roles | `Roles` | Read-only list; assign on user form |
| Activity logs | `ActivityLogs`, `ActivityLogDetail` | Search + action/model filters |
| Backup | `BackupInfo` | Web-only with exact Arabic reason |

### Marketing

| Feature | Route | Notes |
|---------|-------|-------|
| Coupons CRUD | `Coupons`, `CouponForm` | Branch id field; report link |
| Promotions CRUD | `Promotions`, `PromotionForm` | Simplified conditions (min cart) |
| Gift cards | `GiftCards`, `GiftCardDetail` | Create, cancel, statistics |

### API modules

`activityLogs`, `tenant`, `branchesManage`; extended `promotions`, `giftCards`.

## Known risks

1. Promotion form does not edit complex conditions (products/categories) like web.
2. User create uses `settingsAPI` (`/mcp/users`) not multipart `employees` endpoint.
3. Role definition edit remains web-only.
4. Gift card POS redeem depends on Phase 1 POS wiring (`giftCardsAPI.check/redeem`).
5. Offline coupon validation not fully ported to mobile catalog cache.

## Verification

```bash
cd madar-erp-mobile
npm run typecheck
npm run lint
npx expo export --platform web
```
