import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MoreScreen } from '@/screens/settings/MoreScreen';
import { CustomersScreen } from '@/screens/customers/CustomersScreen';
import { CustomerDetailScreen } from '@/screens/customers/CustomerDetailScreen';
import { RefundsScreen } from '@/screens/refunds/RefundsScreen';
import { DiningScreen } from '@/screens/dining/DiningScreen';
import { TableOrderScreen } from '@/screens/dining/TableOrderScreen';
import { KitchenScreen } from '@/screens/kitchen/KitchenScreen';
import { KitchenOrderScreen } from '@/screens/kitchen/KitchenOrderScreen';
import { InventoryScreen } from '@/screens/inventory/InventoryScreen';
import { StockAdjustmentScreen } from '@/screens/inventory/StockAdjustmentScreen';
import { StockTransferScreen } from '@/screens/inventory/StockTransferScreen';
import { PurchasesScreen } from '@/screens/purchases/PurchasesScreen';
import { PurchaseDetailScreen } from '@/screens/purchases/PurchaseDetailScreen';
import { CreatePurchaseScreen } from '@/screens/purchases/CreatePurchaseScreen';
import { CreatePurchaseReturnScreen } from '@/screens/purchases/CreatePurchaseReturnScreen';
import { SuppliersScreen } from '@/screens/suppliers/SuppliersScreen';
import { SupplierDetailScreen } from '@/screens/suppliers/SupplierDetailScreen';
import { VaultsScreen } from '@/screens/vaults/VaultsScreen';
import { ShiftScreen } from '@/screens/vaults/ShiftScreen';
import { ExpensesScreen } from '@/screens/expenses/ExpensesScreen';
import { CouponsScreen } from '@/screens/coupons/CouponsScreen';
import { ReportsScreen } from '@/screens/reports/ReportsScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { ProfileScreen } from '@/screens/settings/ProfileScreen';
import { DeliveryScreen } from '@/screens/delivery/DeliveryScreen';
import { PromotionsScreen } from '@/screens/settings/PromotionsScreen';
import { GiftCardsScreen } from '@/screens/settings/GiftCardsScreen';
import { UsersScreen } from '@/screens/settings/UsersScreen';
import { SyncStatusScreen } from '@/screens/settings/SyncStatusScreen';
import { ParityModuleScreen } from '@/screens/shared/ParityModuleScreen';
import type { MoreStackParamList } from '@/types/navigation';
import { rtlStackScreenOptions } from './rtlScreenOptions';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={rtlStackScreenOptions}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Customers" component={CustomersScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
      <Stack.Screen name="Refunds" component={RefundsScreen} />
      <Stack.Screen name="Dining" component={DiningScreen} />
      <Stack.Screen name="DiningTableOrder" component={TableOrderScreen} />
      <Stack.Screen name="Kitchen" component={KitchenScreen} />
      <Stack.Screen name="KitchenOrder" component={KitchenOrderScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="StockAdjustment" component={StockAdjustmentScreen} />
      <Stack.Screen name="StockTransfer" component={StockTransferScreen} />
      <Stack.Screen name="Purchases" component={PurchasesScreen} />
      <Stack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} />
      <Stack.Screen name="CreatePurchase" component={CreatePurchaseScreen} />
      <Stack.Screen name="CreatePurchaseReturn" component={CreatePurchaseReturnScreen} />
      <Stack.Screen name="Suppliers" component={SuppliersScreen} />
      <Stack.Screen name="SupplierDetail" component={SupplierDetailScreen} />
      <Stack.Screen name="Vaults" component={VaultsScreen} />
      <Stack.Screen name="ShiftManagement" component={ShiftScreen} />
      <Stack.Screen name="Expenses" component={ExpensesScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="Delivery" component={DeliveryScreen} />
      <Stack.Screen name="Promotions" component={PromotionsScreen} />
      <Stack.Screen name="GiftCards" component={GiftCardsScreen} />
      <Stack.Screen name="Users" component={UsersScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="SyncStatus" component={SyncStatusScreen} />
      <Stack.Screen name="ParityModule" component={ParityModuleScreen} />
    </Stack.Navigator>
  );
}
