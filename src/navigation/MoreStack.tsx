import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '@/screens/settings/MoreScreen';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { CustomerDetailScreen } from '@/screens/customers/CustomerDetailScreen';
import { RefundsScreen } from '@/screens/refunds/RefundsScreen';
import { SalesByProductScreen } from '@/screens/sales/SalesByProductScreen';
import { LayawayScreen } from '@/screens/sales/LayawayScreen';
import { DiningScreen } from '@/screens/dining/DiningScreen';
import { TableOrderScreen } from '@/screens/dining/TableOrderScreen';
import { WaiterPosScreen } from '@/screens/dining/WaiterPosScreen';
import { DiningHallFormScreen } from '@/screens/dining/DiningHallFormScreen';
import { KitchenScreen } from '@/screens/kitchen/KitchenScreen';
import { KitchenOrderScreen } from '@/screens/kitchen/KitchenOrderScreen';
import { KitchenTicketPreviewScreen } from '@/screens/kitchen/KitchenTicketPreviewScreen';
import { KitchenStationsListScreen } from '@/screens/kitchen/KitchenStationsListScreen';
import { KitchenStationFormScreen } from '@/screens/kitchen/KitchenStationFormScreen';
import { KitchenPrintJobsScreen } from '@/screens/kitchen/KitchenPrintJobsScreen';
import { InventoryScreen } from '@/screens/inventory/InventoryScreen';
import { InventoryProductsScreen } from '@/screens/inventory/InventoryProductsScreen';
import { InventoryListScreen } from '@/screens/inventory/InventoryListScreen';
import { WarehousesScreen } from '@/screens/inventory/WarehousesScreen';
import { WarehouseDetailScreen } from '@/screens/inventory/WarehouseDetailScreen';
import { WarehouseFormScreen } from '@/screens/inventory/WarehouseFormScreen';
import { StockAdjustmentScreen } from '@/screens/inventory/StockAdjustmentScreen';
import { StockAdjustmentsListScreen } from '@/screens/inventory/StockAdjustmentsListScreen';
import { StockAdjustmentDetailScreen } from '@/screens/inventory/StockAdjustmentDetailScreen';
import { StockTransferScreen } from '@/screens/inventory/StockTransferScreen';
import { StockTransfersListScreen } from '@/screens/inventory/StockTransfersListScreen';
import { StockTransferDetailScreen } from '@/screens/inventory/StockTransferDetailScreen';
import { StockCountsListScreen } from '@/screens/inventory/StockCountsListScreen';
import { StockCountCreateScreen } from '@/screens/inventory/StockCountCreateScreen';
import { StockCountDetailScreen } from '@/screens/inventory/StockCountDetailScreen';
import { ReorderRulesListScreen } from '@/screens/inventory/ReorderRulesListScreen';
import { ReorderRuleFormScreen } from '@/screens/inventory/ReorderRuleFormScreen';
import { RequisitionsListScreen } from '@/screens/inventory/RequisitionsListScreen';
import { RequisitionCreateScreen } from '@/screens/inventory/RequisitionCreateScreen';
import { RequisitionDetailScreen } from '@/screens/inventory/RequisitionDetailScreen';
import { StockBalanceDetailScreen } from '@/screens/inventory/StockBalanceDetailScreen';
import { InventoryMovementDetailScreen } from '@/screens/inventory/InventoryMovementDetailScreen';
import { PurchasesScreen } from '@/screens/purchases/PurchasesScreen';
import { PurchaseDetailScreen } from '@/screens/purchases/PurchaseDetailScreen';
import { EditPurchaseScreen } from '@/screens/purchases/EditPurchaseScreen';
import { CreatePurchaseScreen } from '@/screens/purchases/CreatePurchaseScreen';
import { CreatePurchaseReturnScreen } from '@/screens/purchases/CreatePurchaseReturnScreen';
import { PurchaseReturnsListScreen } from '@/screens/purchases/PurchaseReturnsListScreen';
import { PurchaseReturnDetailScreen } from '@/screens/purchases/PurchaseReturnDetailScreen';
import { SuppliersScreen } from '@/screens/suppliers/SuppliersScreen';
import { SupplierDetailScreen } from '@/screens/suppliers/SupplierDetailScreen';
import { SupplierReportScreen } from '@/screens/suppliers/SupplierReportScreen';
import { SupplierStatementScreen } from '@/screens/suppliers/SupplierStatementScreen';
import { SupplierPaymentsScreen } from '@/screens/suppliers/SupplierPaymentsScreen';
import { VaultsScreen } from '@/screens/vaults/VaultsScreen';
import { VaultTransactionsScreen } from '@/screens/vaults/VaultTransactionsScreen';
import { VaultTransactionDetailScreen } from '@/screens/vaults/VaultTransactionDetailScreen';
import { ShiftScreen } from '@/screens/vaults/ShiftScreen';
import { ExpensesScreen } from '@/screens/expenses/ExpensesScreen';
import { ExpenseCreateScreen } from '@/screens/expenses/ExpenseCreateScreen';
import { ExpenseDetailScreen } from '@/screens/expenses/ExpenseDetailScreen';
import { ExpenseCategoriesScreen } from '@/screens/expenses/ExpenseCategoriesScreen';
import { RecurringExpensesScreen } from '@/screens/expenses/RecurringExpensesScreen';
import { BudgetsScreen } from '@/screens/settings/BudgetsScreen';
import { BudgetFormScreen } from '@/screens/settings/BudgetFormScreen';
import { CouponsScreen } from '@/screens/coupons/CouponsScreen';
import { CouponFormScreen } from '@/screens/coupons/CouponFormScreen';
import { ReportsScreen } from '@/screens/reports/ReportsScreen';
import { ReportViewerScreen } from '@/screens/reports/ReportViewerScreen';
import { RecipeReportsScreen } from '@/screens/reports/RecipeReportsScreen';
import { RawMaterialsReportScreen } from '@/screens/reports/tabbed/RawMaterialsReportScreen';
import { LegacyReportsScreen } from '@/screens/reports/LegacyReportsScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ProfileScreen } from '@/screens/settings/ProfileScreen';
import { DeliveryScreen } from '@/screens/delivery/DeliveryScreen';
import { DeliveryDetailScreen } from '@/screens/delivery/DeliveryDetailScreen';
import { DriversListScreen } from '@/screens/delivery/DriversListScreen';
import { DriverFormScreen } from '@/screens/delivery/DriverFormScreen';
import { DeliveryZonesListScreen } from '@/screens/delivery/DeliveryZonesListScreen';
import { DeliveryZoneFormScreen } from '@/screens/delivery/DeliveryZoneFormScreen';
import { DriverSettlementsScreen } from '@/screens/delivery/DriverSettlementsScreen';
import { DeliveryFinanceDashboardScreen } from '@/screens/delivery/DeliveryFinanceDashboardScreen';
import { DeliveryFinanceLiabilitiesScreen } from '@/screens/delivery/DeliveryFinanceLiabilitiesScreen';
import { DeliveryFinanceSettlementsScreen } from '@/screens/delivery/DeliveryFinanceSettlementsScreen';
import { DeliveryFinanceAlertsScreen } from '@/screens/delivery/DeliveryFinanceAlertsScreen';
import { DeliveryFinanceDriverDetailScreen } from '@/screens/delivery/DeliveryFinanceDriverDetailScreen';
import { PromotionsScreen } from '@/screens/settings/PromotionsScreen';
import { PromotionFormScreen } from '@/screens/settings/PromotionFormScreen';
import { GiftCardsScreen } from '@/screens/settings/GiftCardsScreen';
import { GiftCardDetailScreen } from '@/screens/settings/GiftCardDetailScreen';
import { UsersScreen } from '@/screens/settings/UsersScreen';
import { UserFormScreen } from '@/screens/settings/UserFormScreen';
import { RolesScreen } from '@/screens/settings/RolesScreen';
import { PaymentsLedgerScreen } from '@/screens/settings/PaymentsLedgerScreen';
import { FinancialAccountsScreen } from '@/screens/settings/FinancialAccountsScreen';
import { FinancialAccountDetailScreen } from '@/screens/settings/FinancialAccountDetailScreen';
import { BranchesListScreen } from '@/screens/settings/BranchesListScreen';
import { BranchDetailScreen } from '@/screens/settings/BranchDetailScreen';
import { BranchFormScreen } from '@/screens/settings/branches/BranchFormScreen';
import { BranchSettingsScreen } from '@/screens/settings/branches/BranchSettingsScreen';
import { BranchPosSettingsScreen } from '@/screens/settings/branches/BranchPosSettingsScreen';
import { BranchPrintHubScreen } from '@/screens/settings/branches/BranchPrintHubScreen';
import { BranchPrintSettingsScreen } from '@/screens/settings/branches/BranchPrintSettingsScreen';
import { BranchKitchenPrintersScreen } from '@/screens/settings/branches/BranchKitchenPrintersScreen';
import { BranchKitchenRoutingScreen } from '@/screens/settings/branches/BranchKitchenRoutingScreen';
import { TenantSettingsScreen } from '@/screens/settings/TenantSettingsScreen';
import { ActivityLogsScreen } from '@/screens/settings/ActivityLogsScreen';
import { ActivityLogDetailScreen } from '@/screens/settings/ActivityLogDetailScreen';
import { BackupInfoScreen } from '@/screens/settings/BackupInfoScreen';
import { SyncStatusScreen } from '@/screens/settings/SyncStatusScreen';
import { PrinterProfilesScreen } from '@/screens/settings/PrinterProfilesScreen';
import { PrinterProfileFormScreen } from '@/screens/settings/PrinterProfileFormScreen';
import { PrinterDiagnosticsScreen } from '@/screens/settings/PrinterDiagnosticsScreen';
import { PrintQueueScreen } from '@/screens/settings/PrintQueueScreen';
import { KitchenRoutingScreen } from '@/screens/settings/KitchenRoutingScreen';
import { KitchenRoutingFormScreen } from '@/screens/settings/KitchenRoutingFormScreen';
import { BarcodePrintInfoScreen } from '@/screens/products/BarcodePrintInfoScreen';
import type { MoreStackParamList } from '@/types/navigation';
import { rtlStackScreenOptions } from './rtlScreenOptions';
import { GuardedParityModuleScreen, guardMoreScreen } from './moreStackGuards';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={rtlStackScreenOptions}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen name="Refunds" component={RefundsScreen} />
      <Stack.Screen name="SalesByProduct" component={SalesByProductScreen} />
      <Stack.Screen name="Layaway" component={LayawayScreen} />
      <Stack.Screen name="Dining" component={guardMoreScreen('Dining', DiningScreen)} />
      <Stack.Screen name="DiningTableOrder" component={guardMoreScreen('DiningTableOrder', TableOrderScreen)} />
      <Stack.Screen name="WaiterPos" component={guardMoreScreen('WaiterPos', WaiterPosScreen)} />
      <Stack.Screen name="DiningHallForm" component={guardMoreScreen('DiningHallForm', DiningHallFormScreen)} />
      <Stack.Screen name="Kitchen" component={guardMoreScreen('Kitchen', KitchenScreen)} />
      <Stack.Screen name="KitchenOrder" component={guardMoreScreen('KitchenOrder', KitchenOrderScreen)} />
      <Stack.Screen name="KitchenTicketPreview" component={guardMoreScreen('KitchenTicketPreview', KitchenTicketPreviewScreen)} />
      <Stack.Screen name="KitchenStationsList" component={guardMoreScreen('KitchenStationsList', KitchenStationsListScreen)} />
      <Stack.Screen name="KitchenStationForm" component={guardMoreScreen('KitchenStationForm', KitchenStationFormScreen)} />
      <Stack.Screen name="KitchenPrintJobs" component={guardMoreScreen('KitchenPrintJobs', KitchenPrintJobsScreen)} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="InventoryProducts" component={InventoryProductsScreen} />
      <Stack.Screen name="InventoryList" component={InventoryListScreen} />
      <Stack.Screen name="StockBalanceDetail" component={StockBalanceDetailScreen} />
      <Stack.Screen name="InventoryMovementDetail" component={InventoryMovementDetailScreen} />
      <Stack.Screen name="StockAdjustmentsList" component={StockAdjustmentsListScreen} />
      <Stack.Screen name="StockAdjustmentDetail" component={StockAdjustmentDetailScreen} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
      <Stack.Screen name="StockTransfersList" component={StockTransfersListScreen} />
      <Stack.Screen name="StockTransferDetail" component={StockTransferDetailScreen} />
      <Stack.Screen name="StockTransfer" component={StockTransferScreen} />
      <Stack.Screen name="StockCountsList" component={StockCountsListScreen} />
      <Stack.Screen name="StockCountCreate" component={StockCountCreateScreen} />
      <Stack.Screen name="StockCountDetail" component={StockCountDetailScreen} />
      <Stack.Screen name="ReorderRulesList" component={ReorderRulesListScreen} />
      <Stack.Screen name="ReorderRuleForm" component={ReorderRuleFormScreen} />
      <Stack.Screen name="RequisitionsList" component={RequisitionsListScreen} />
      <Stack.Screen name="RequisitionCreate" component={RequisitionCreateScreen} />
      <Stack.Screen name="RequisitionDetail" component={RequisitionDetailScreen} />
      <Stack.Screen name="Warehouses" component={WarehousesScreen} />
      <Stack.Screen name="WarehouseDetail" component={WarehouseDetailScreen} />
      <Stack.Screen name="WarehouseForm" component={WarehouseFormScreen} />
      <Stack.Screen name="Purchases" component={PurchasesScreen} />
      <Stack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} />
      <Stack.Screen name="EditPurchase" component={EditPurchaseScreen} />
      <Stack.Screen name="CreatePurchase" component={CreatePurchaseScreen} />
      <Stack.Screen name="PurchaseReturnsList" component={PurchaseReturnsListScreen} />
      <Stack.Screen name="PurchaseReturnDetail" component={PurchaseReturnDetailScreen} />
      <Stack.Screen name="CreatePurchaseReturn" component={CreatePurchaseReturnScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
      <Stack.Screen name="SupplierReport" component={SupplierReportScreen} />
      <Stack.Screen name="SupplierStatement" component={SupplierStatementScreen} />
      <Stack.Screen name="SupplierPayments" component={SupplierPaymentsScreen} />
      <Stack.Screen name="Vaults" component={VaultsScreen} />
      <Stack.Screen name="VaultTransactions" component={VaultTransactionsScreen} />
      <Stack.Screen name="VaultTransactionDetail" component={VaultTransactionDetailScreen} />
      <Stack.Screen name="ShiftManagement" component={ShiftScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="ExpenseCreate" component={ExpenseCreateScreen} />
      <Stack.Screen name="ExpenseDetail" component={ExpenseDetailScreen} />
      <Stack.Screen name="ExpenseCategories" component={ExpenseCategoriesScreen} />
      <Stack.Screen name="RecurringExpenses" component={RecurringExpensesScreen} />
      <Stack.Screen name="Budgets" component={BudgetsScreen} />
      <Stack.Screen name="BudgetForm" component={BudgetFormScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="CouponForm" component={CouponFormScreen} />
      <Stack.Screen name="Delivery" component={DeliveryScreen} />
      <Stack.Screen name="DeliveryDetail" component={DeliveryDetailScreen} />
      <Stack.Screen name="DriversList" component={DriversListScreen} />
      <Stack.Screen name="DriverForm" component={DriverFormScreen} />
      <Stack.Screen name="DeliveryZonesList" component={DeliveryZonesListScreen} />
      <Stack.Screen name="DeliveryZoneForm" component={DeliveryZoneFormScreen} />
      <Stack.Screen name="DriverSettlements" component={DriverSettlementsScreen} />
      <Stack.Screen name="DeliveryFinanceDashboard" component={DeliveryFinanceDashboardScreen} />
      <Stack.Screen name="DeliveryFinanceLiabilities" component={DeliveryFinanceLiabilitiesScreen} />
      <Stack.Screen name="DeliveryFinanceSettlements" component={DeliveryFinanceSettlementsScreen} />
      <Stack.Screen name="DeliveryFinanceAlerts" component={DeliveryFinanceAlertsScreen} />
      <Stack.Screen name="DeliveryFinanceDriverDetail" component={DeliveryFinanceDriverDetailScreen} />
      <Stack.Screen name="Promotions" component={PromotionsScreen} />
      <Stack.Screen name="PromotionForm" component={PromotionFormScreen} />
      <Stack.Screen name="GiftCards" component={GiftCardsScreen} />
      <Stack.Screen name="GiftCardDetail" component={GiftCardDetailScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="UserForm" component={UserFormScreen} />
      <Stack.Screen name="Roles" component={RolesScreen} />
      <Stack.Screen name="PaymentsLedger" component={PaymentsLedgerScreen} />
      <Stack.Screen name="FinancialAccounts" component={FinancialAccountsScreen} />
      <Stack.Screen name="FinancialAccountDetail" component={FinancialAccountDetailScreen} />
      <Stack.Screen name="BranchesList" component={guardMoreScreen('BranchesList', BranchesListScreen)} />
      <Stack.Screen name="BranchDetail" component={guardMoreScreen('BranchDetail', BranchDetailScreen)} />
      <Stack.Screen name="BranchForm" component={guardMoreScreen('BranchForm', BranchFormScreen)} />
      <Stack.Screen name="BranchSettings" component={guardMoreScreen('BranchSettings', BranchSettingsScreen)} />
      <Stack.Screen name="BranchPosSettings" component={guardMoreScreen('BranchPosSettings', BranchPosSettingsScreen)} />
      <Stack.Screen name="BranchPrintHub" component={guardMoreScreen('BranchPrintHub', BranchPrintHubScreen)} />
      <Stack.Screen name="BranchPrintSettings" component={guardMoreScreen('BranchPrintSettings', BranchPrintSettingsScreen)} />
      <Stack.Screen name="BranchKitchenPrinters" component={guardMoreScreen('BranchKitchenPrinters', BranchKitchenPrintersScreen)} />
      <Stack.Screen name="BranchKitchenRouting" component={guardMoreScreen('BranchKitchenRouting', BranchKitchenRoutingScreen)} />
      <Stack.Screen name="TenantSettings" component={guardMoreScreen('TenantSettings', TenantSettingsScreen)} />
      <Stack.Screen name="ActivityLogs" component={ActivityLogsScreen} />
      <Stack.Screen name="ActivityLogDetail" component={ActivityLogDetailScreen} />
      <Stack.Screen name="BackupInfo" component={guardMoreScreen('BackupInfo', BackupInfoScreen)} />
      <Stack.Screen name="BarcodePrintInfo" component={guardMoreScreen('BarcodePrintInfo', BarcodePrintInfoScreen)} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ReportViewer" component={ReportViewerScreen} />
      <Stack.Screen name="RawMaterialsReport" component={RawMaterialsReportScreen} />
      <Stack.Screen name="RecipeReports" component={RecipeReportsScreen} />
      <Stack.Screen name="LegacyReports" component={LegacyReportsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
      <Stack.Screen name="PrinterProfiles" component={PrinterProfilesScreen} />
      <Stack.Screen name="PrinterProfileForm" component={PrinterProfileFormScreen} />
      <Stack.Screen name="PrinterDiagnostics" component={PrinterDiagnosticsScreen} />
      <Stack.Screen name="PrintQueue" component={PrintQueueScreen} />
      <Stack.Screen name="KitchenRouting" component={guardMoreScreen('KitchenRouting', KitchenRoutingScreen)} />
      <Stack.Screen name="KitchenRoutingForm" component={guardMoreScreen('KitchenRoutingForm', KitchenRoutingFormScreen)} />
      <Stack.Screen name="ParityModule" component={GuardedParityModuleScreen} />
    </Stack.Navigator>
  );
}
