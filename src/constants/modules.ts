export type MobileModuleStatus = 'complete' | 'partial' | 'missing-api' | 'disabled';

export type ModuleDefinition = {
  key: string;
  label: string;
  route: string;
  permission?: string | string[];
  feature?: string;
  status: MobileModuleStatus;
  description: string;
};

export const moduleDefinitions: ModuleDefinition[] = [
  { key: 'customers', label: 'العملاء', route: 'Customers', permission: ['manage_customers', 'process_sales'], status: 'complete', description: 'قائمة وتفاصيل وإنشاء سريع.' },
  { key: 'refunds', label: 'المرتجعات', route: 'Refunds', permission: 'void_receipt', status: 'partial', description: 'قائمة وتفاصيل، والإنشاء عبر تفاصيل البيع عند وضوح البنود.' },
  { key: 'dining', label: 'القاعات والطاولات', route: 'Dining', permission: 'manage_dining', status: 'partial', description: 'قاعات وطاولات وطلب نشط وتسوية عند توفر الفرع.' },
  { key: 'kitchen', label: 'شاشة المطبخ', route: 'Kitchen', permission: ['view_kitchen', 'manage_kitchen'], status: 'complete', description: 'طلبات وفلاتر وتحديث حالة.' },
  { key: 'inventory', label: 'المخزون', route: 'Inventory', permission: 'manage_inventory', feature: 'inventory', status: 'complete', description: 'أرصدة وتنبيهات صلاحية ومخازن.' },
  { key: 'purchases', label: 'المشتريات', route: 'Purchases', permission: 'manage_purchases', feature: 'purchases', status: 'complete', description: 'فواتير شراء وتفاصيل ومرتجعات قراءة.' },
  { key: 'suppliers', label: 'الموردين', route: 'Suppliers', permission: 'manage_suppliers', status: 'complete', description: 'قائمة وتفاصيل وتقرير مورد.' },
  { key: 'vaults', label: 'الخزنة / الورديات', route: 'Vaults', permission: ['open_shift', 'process_sales', 'access_admin_routes'], status: 'partial', description: 'الوردية الحالية وقائمة الخزن بدون عمليات مالية خطرة.' },
  { key: 'expenses', label: 'المصروفات', route: 'Expenses', permission: ['process_sales', 'manage_expenses'], status: 'complete', description: 'قائمة وتفاصيل وإنشاء آمن عند توفر التصنيفات.' },
  { key: 'coupons', label: 'الكوبونات', route: 'Coupons', permission: 'manage_coupons', feature: 'coupons', status: 'complete', description: 'قائمة وتفاصيل وتحقق داخل POS.' },
  { key: 'promotions', label: 'العروض الترويجية', route: 'Promotions', permission: 'manage_coupons', status: 'complete', description: 'قائمة العروض الترويجية وتفاصيلها.' },
  { key: 'giftcards', label: 'بطاقات الهدايا', route: 'GiftCards', permission: 'manage_coupons', status: 'complete', description: 'إدارة بطاقات الهدايا.' },
  { key: 'users', label: 'المستخدمين', route: 'Users', permission: 'manage_users', status: 'complete', description: 'إدارة مستخدمي النظام والصلاحيات.' },
  { key: 'delivery', label: 'التوصيل', route: 'Delivery', permission: ['process_sales', 'manage_deliveries'], status: 'partial', description: 'طلبات التوصيل معروضة كمسار مستقل، وتفاصيل الربط المالي موثقة.' },
  { key: 'reports', label: 'التقارير', route: 'Reports', permission: 'view_reports', feature: 'reports', status: 'complete', description: 'بطاقات ملخصة للمبيعات والمخزون والمشتريات.' },
  { key: 'notifications', label: 'الإشعارات', route: 'Notifications', status: 'complete', description: 'قائمة وعدد غير مقروء وتعليم كمقروء.' },
  { key: 'settings', label: 'الإعدادات', route: 'Settings', permission: ['manage_users', 'manage_branches', 'manage_settings', 'access_admin_routes'], status: 'partial', description: 'ملف شخصي وفروع وتغيير كلمة المرور.' },
  { key: 'profile', label: 'الملف الشخصي', route: 'Profile', status: 'complete', description: 'بيانات المستخدم والخروج.' },
];
