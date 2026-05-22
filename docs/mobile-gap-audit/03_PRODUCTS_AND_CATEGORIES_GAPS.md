# Products and Categories Gaps

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Product list | `/products` | `productsAPI.list` | Complete | `ProductsScreen` | — | P3 | Search/filters |
| Product filters | list page | query params | Partial | Basic search | Missing filter | P2 | Category, active, stock |
| Product create/edit | product form | `POST/PUT` multipart | Complete | `ProductFormScreen` | — | P3 | Barcodes, units, options |
| Product images | form | multipart | Complete | `ImagePickerField` | — | P3 | |
| Barcodes | form | — | Complete | `BarcodesEditor` | — | P3 | |
| Units | form | — | Complete | `UnitsEditor` | — | P3 | |
| Opening stock | form | — | Complete | `OpeningStockEditor` (create) | — | P3 | |
| track_inventory / track_expiry | form | — | Complete | switches in form | — | P3 | |
| Modifiers / option groups | form | — | Complete | `ProductOptionGroupsEditor` | — | P3 | |
| Product detail | `/products/:id` | `GET` | Complete | `ProductDetailScreen` | — | P3 | |
| Product insights | `/products/:id/insights` | reports/stats | Complete | `ProductInsightsScreen` | Partial | P2 | vs web charts depth |
| Stock view on product | detail tabs | inventory | Partial | Insights block | Weak UI/UX | P2 | |
| Batch/expiry on product | detail | batches | NEEDS VERIFICATION | — | Missing filter | P2 | |
| Categories list | `/categories` | `categoriesAPI` | Complete | `CategoriesScreen` | — | P3 | |
| Category CRUD | form | multipart | Complete | `CategoryFormScreen` | — | P3 | |
| Drag reorder products | web DnD | `sort` endpoint | Complete | `ProductsReorderScreen` | — | P3 | |
| Drag reorder categories | web DnD | sort | Complete | `CategoriesReorderScreen` | — | P3 | |
| Import/export/template | web tools | import API | Missing | — | Missing action | P2 | If web exposes |
| Barcode label print | `/barcode-print` | — | Missing | — | Missing screen | P2 | Web-only route |
| Product delete | list actions | `DELETE` | NEEDS VERIFICATION | — | Missing action | P2 | |
| Tablet master-detail | layout | — | Partial | Single column | Tablet issue | P2 | |
| RTL form layout | — | — | Partial | RTL constants used | RTL issue | P3 | |

## Files

- Web: `front/src/pages/Products/`, `front/src/Routes/products.tsx`, `front/src/api/products.ts`
- Mobile: `madar-erp-mobile/src/screens/products/`, `madar-erp-mobile/src/api/products.ts`
