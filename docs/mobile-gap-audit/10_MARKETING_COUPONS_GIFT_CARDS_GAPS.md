# Marketing, Coupons, and Gift Cards Gaps

## Coupons

| Web Feature | Web API | Mobile Status | Mobile Route | Notes |
|-------------|---------|---------------|--------------|-------|
| Coupon list | `couponsAPI` | Complete | `Coupons` | |
| Create / edit | POST/PUT | Complete | `CouponForm` | Branch policy field |
| POS validation | validate | Complete | POS online | Offline cache partial |
| Coupon reports | reports | Complete | `ReportViewer` marketing-coupons | |

## Promotions

| Web Feature | Web API | Mobile Status | Mobile Route | Notes |
|-------------|---------|---------------|--------------|-------|
| Promotion list | `promotionsAPI` | Complete | `Promotions` | |
| Create / edit | POST/PUT | Complete | `PromotionForm` | Min-cart condition only |
| POS auto-apply | preview | Partial | POS | Full engine not ported |

## Gift cards

| Web Feature | Web API | Mobile Status | Mobile Route | Notes |
|-------------|---------|---------------|--------------|-------|
| List | `giftCardsAPI` | Complete | `GiftCards` | Statistics cards |
| Create / cancel | POST | Complete | `GiftCards` / `GiftCardDetail` | |
| POS redeem | check/redeem | Partial | POS API exists | Phase 1 connection |
| Report | reports | Complete | `ReportViewer` gift-cards | |
