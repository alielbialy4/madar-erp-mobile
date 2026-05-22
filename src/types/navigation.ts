import type { NavigatorScreenParams } from '@react-navigation/native';

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
};

export type ProductsStackParamList = {
  ProductsHome: undefined;
  ProductDetail: { id: number; name?: string };
  Categories: undefined;
};

export type SalesStackParamList = {
  SalesHome: undefined;
  SaleDetail: { id: number; invoice?: string };
  PartialRefund: { saleId: number };
};

export type MoreStackParamList = {
  MoreHome: undefined;
  Customers: undefined;
  CustomerDetail: { id: number; name?: string };
  Refunds: undefined;
  Dining: undefined;
  DiningTableOrder: { tableId: string; tableName?: string };
  Kitchen: undefined;
  KitchenOrder: { id: number };
  Inventory: undefined;
  StockAdjustment: undefined;
  StockTransfer: undefined;
  Purchases: undefined;
  PurchaseDetail: { id: number };
  CreatePurchase: undefined;
  CreatePurchaseReturn: { purchaseId: number };
  Suppliers: undefined;
  SupplierDetail: { id: number | string; name?: string };
  Vaults: undefined;
  ShiftManagement: undefined;
  Expenses: undefined;
  Coupons: undefined;
  Delivery: undefined;
  Promotions: undefined;
  GiftCards: undefined;
  Users: undefined;
  Reports: undefined;
  Notifications: undefined;
  Settings: undefined;
  Profile: undefined;
  SyncStatus: undefined;
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
