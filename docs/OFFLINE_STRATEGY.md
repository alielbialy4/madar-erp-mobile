# Offline Strategy

Offline support is intentionally narrow and honest.

## Supported

- POS catalog cache from the latest successful catalog pull.
- Offline banner whenever NetInfo reports no reachable internet.
- POS orders can be queued only when a branch is selected.
- Queued orders show pending count in POS and Sync Status.
- Auto-sync on reconnect is registered in `RootNavigator` and is guarded by token plus active branch.
- Manual sync is available in `SyncStatusScreen`.
- Failed queued orders show count, can be retried explicitly, and can be cleared only after confirmation.
- Backend sync errors are stored on the failed pending order and summarized in Sync Status.

## Not Claimed As Server Success

Offline POS checkout returns: `تم حفظ الطلب في قائمة الانتظار. لم يتم تأكيد البيع من الخادم بعد.`

The cart is cleared only after the order is stored locally, and the pending count is refreshed. The app never labels that state as a completed sale.

## Blocked Offline

- Refunds.
- Purchase create/return.
- Supplier settlement/payment.
- Vault deposit/withdraw.
- Shift open/close.
- Stock adjustment/transfer.
- Dining table settlement/release/merge/transfer.
- Expense create.

These require online backend validation, permissions, branch/shift/vault state, and server-side audit logs.

## Retry Flow

1. Open `المزيد` → `حالة المزامنة`.
2. Check pending and failed counts.
3. Tap `إعادة محاولة الفاشلة` to mark failed orders pending and sync immediately.
4. Tap `حذف الطلبات الفاشلة` only after confirmation when the user chooses to discard failed local orders.

## Known Limitation

Full offline table settlement is disabled. Table settlement changes dining state and creates financial records, so it remains online-only until the backend exposes an idempotent offline settlement contract.
