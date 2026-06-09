import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ReportId } from '@/reports/types';

export type AuthStackParamList = {
  Login: undefined;
};

export type MainTabParamList = {
  DashboardTab: undefined;
  POSTab: NavigatorScreenParams<POSStackParamList> | undefined;
  ProductsTab: NavigatorScreenParams<ProductsStackParamList> | undefined;
  SalesTab: NavigatorScreenParams<SalesStackParamList> | undefined;
  MoreTab: NavigatorScreenParams<MoreStackParamList> | undefined;
};

export type POSStackParamList = {
  POSHome: undefined;
  DiningTableOrder: { tableId: string; tableName?: string } | undefined;
  WaiterPos: undefined;
};

export type ProductsStackParamList = {
  ProductsHome: { category_id?: number; scope?: 'raw_materials' } | undefined;
  ProductDetail: { id: number; name?: string; mode?: 'product' | 'raw_material' };
  ProductForm: { id?: number; mode?: 'product' | 'raw_material' };
  ProductFormRecipe: undefined;
  ProductFormModifiers: undefined;
  ProductInsights: { id: number; name?: string };
  Categories: undefined;
  CategoryForm: { id?: number };
  CategoriesReorder: undefined;
  ProductsReorder: undefined;
};

export type SalesStackParamList = {
  SalesHome: undefined;
  SaleDetail: { id: number; invoice?: string };
  PartialRefund: { saleId: number };
};

export type InventoryListPresetKey =
  | 'balances'
  | 'warehouses'
  | 'movements'
  | 'expiry'
  | 'reorderRules'
  | 'requisitions'
  | 'stockCounts';

export type MoreStackParamList = {
  MoreHome: undefined;
  Customers: undefined;
  CustomerDetail: { id: number; name?: string };
  Refunds: undefined;
  SalesByProduct: undefined;
  Layaway: undefined;
  Dining: undefined;
  DiningTableOrder: { tableId: string; tableName?: string };
  WaiterPos: undefined;
  DiningHallForm: { id?: string; name?: string };
  Kitchen: undefined;
  KitchenOrder: { id: number };
  KitchenTicketPreview: { id: number };
  KitchenStationsList: undefined;
  KitchenStationForm: { id?: string; name?: string };
  KitchenPrintJobs: undefined;
  Inventory: undefined;
  Warehouses: undefined;
  WarehouseDetail: { id: string; name?: string };
  WarehouseForm: { id?: string };
  InventoryList: { preset: InventoryListPresetKey; warehouse_id?: string; warehouse_name?: string; product_id?: string };
  StockBalanceDetail: { product_id: number; warehouse_id?: string; product_name?: string };
  InventoryMovementDetail: { movement: Record<string, unknown> };
  StockAdjustmentsList: undefined;
  StockAdjustmentDetail: { id: string };
  StockAdjustment: undefined;
  StockTransfersList: undefined;
  StockTransferDetail: { id: string };
  StockTransfer: undefined;
  StockCountsList: undefined;
  StockCountDetail: { id: string };
  StockCountCreate: undefined;
  ReorderRulesList: undefined;
  ReorderRuleForm: { id?: number };
  RequisitionsList: undefined;
  RequisitionDetail: { id: string };
  RequisitionCreate: undefined;
  Purchases: undefined;
  PurchaseDetail: { id: number };
  CreatePurchase: undefined;
  EditPurchase: { id: number };
  PurchaseReturnsList: undefined;
  PurchaseReturnDetail: { id: number };
  CreatePurchaseReturn: { purchaseId: number };
  Suppliers: undefined;
  SupplierDetail: { id: number | string; name?: string };
  SupplierReport: { id: number | string; name?: string };
  SupplierStatement: { id: number | string; name?: string };
  SupplierPayment: { supplierId: number; name?: string; purchaseId?: number };
  SupplierPayments: undefined;
  Vaults: undefined;
  VaultTransactions: undefined;
  VaultTransactionDetail: { id: string };
  ShiftManagement: undefined;
  Expenses: undefined;
  Coupons: undefined;
  CouponForm: { id?: string };
  Delivery: undefined;
  DeliveryDetail: { id: string };
  DriversList: undefined;
  DriverForm: { id?: string; name?: string };
  DeliveryZonesList: undefined;
  DeliveryZoneForm: { id?: string };
  DriverSettlements: undefined;
  DeliveryFinanceDashboard: undefined;
  DeliveryFinanceLiabilities: undefined;
  DeliveryFinanceSettlements: undefined;
  DeliveryFinanceAlerts: undefined;
  DeliveryFinanceDriverDetail: { driverId: string; name?: string };
  Promotions: undefined;
  PromotionForm: { id?: string };
  GiftCards: undefined;
  GiftCardDetail: { id: string };
  Users: undefined;
  PaymentsLedger: undefined;
  UserForm: { id?: number };
  Roles: undefined;
  BranchesList: undefined;
  BranchDetail: { id: string };
  BranchForm: { id?: string };
  BranchSettings: { id: string };
  BranchPosSettings: { id: string };
  BranchPrintHub: { id: string };
  BranchPrintSettings: { id: string };
  BranchKitchenPrinters: { branchId: string };
  BranchKitchenRouting: { branchId: string };
  TenantSettings: undefined;
  ActivityLogs: undefined;
  ActivityLogDetail: { id: number };
  BackupInfo: undefined;
  BarcodePrintInfo: undefined;
  Reports: undefined;
  ReportViewer: { reportId: ReportId; initialFilters?: Record<string, string | number | boolean | undefined> };
  RecipeReports: undefined;
  LegacyReports: undefined;
  Notifications: undefined;
  Settings: undefined;
  Profile: undefined;
  SyncStatus: undefined;
  PrinterProfiles: { branchId?: string } | undefined;
  PrinterProfileForm: { id?: string; branchId?: string; presetRole?: import('@/types/printing').PrinterRole };
  PrinterDiagnostics: { branchId?: string } | undefined;
  PrintQueue: undefined;
  KitchenRouting: { branchId?: string } | undefined;
  KitchenRoutingForm: { branchId?: string; id?: string } | undefined;
  ParityModule: {
    title: string;
    webRoute: string;
    endpoint?: string;
    method?: 'get';
    status: 'Complete' | 'Partial' | 'Disabled with reason' | 'Missing API';
    note?: string;
    searchParam?: 'search' | 'q';
    params?: Record<string, unknown>;
  };
};
