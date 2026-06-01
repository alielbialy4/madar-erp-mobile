import { useCallback, useEffect, useState } from 'react';
import { categoriesAPI } from '@/api/categories';
import { customersAPI } from '@/api/customers';
import { inventoryAPI } from '@/api/inventory';
import { productsAPI } from '@/api/products';
import { shiftsAPI } from '@/api/shifts';
import { suppliersAPI } from '@/api/suppliers';
import { extractArray } from '@/utils/data';
import type { ReportFilterKey } from '@/reports/types';

export type FilterOption = { id: string; label: string };

export function useReportFilterOptions(activeKeys: ReportFilterKey[]) {
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [warehouses, setWarehouses] = useState<FilterOption[]>([]);
  const [customers, setCustomers] = useState<FilterOption[]>([]);
  const [suppliers, setSuppliers] = useState<FilterOption[]>([]);
  const [cashiers, setCashiers] = useState<FilterOption[]>([]);
  const [products, setProducts] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(false);

  const needs = useCallback(
    (key: ReportFilterKey) => activeKeys.includes(key),
    [activeKeys],
  );

  useEffect(() => {
    let cancelled = false;
    const tasks: Promise<void>[] = [];

    if (needs('category')) {
      tasks.push(
        categoriesAPI.getAll({ per_page: 500 }).then((res) => {
          if (cancelled) return;
          const list = extractArray<{ id: number; name: string }>(res);
          setCategories(list.map((c) => ({ id: String(c.id), label: String(c.name) })));
        }),
      );
    }
    if (needs('warehouse')) {
      tasks.push(
        inventoryAPI.warehouses().then((res) => {
          if (cancelled) return;
          const list = extractArray<{ id: string | number; name: string }>(res);
          setWarehouses(list.map((w) => ({ id: String(w.id), label: String(w.name) })));
        }),
      );
    }
    if (needs('customer')) {
      tasks.push(
        customersAPI.getAll({ per_page: 200 }).then((res) => {
          if (cancelled) return;
          const list = extractArray<{ id: number | string; name: string }>(res);
          setCustomers(list.map((c) => ({ id: String(c.id), label: String(c.name) })));
        }),
      );
    }
    if (needs('supplier')) {
      tasks.push(
        suppliersAPI.getAll({ per_page: 200 }).then((res) => {
          if (cancelled) return;
          const list = extractArray<{ id: number | string; name: string }>(res);
          setSuppliers(list.map((s) => ({ id: String(s.id), label: String(s.name) })));
        }),
      );
    }
    if (needs('cashier')) {
      tasks.push(
        shiftsAPI.filterUsers().then((res) => {
          if (cancelled) return;
          const list = extractArray<{ id: number | string; name: string }>(res);
          setCashiers(list.map((u) => ({ id: String(u.id), label: String(u.name ?? u.id) })));
        }),
      );
    }
    if (needs('product')) {
      tasks.push(
        productsAPI.getAll({ per_page: 100 }).then((res) => {
          if (cancelled) return;
          const list = extractArray<{ id: number; name: string }>(res);
          setProducts(list.map((p) => ({ id: String(p.id), label: String(p.name) })));
        }),
      );
    }

    if (!tasks.length) return;
    setLoading(true);
    void Promise.all(tasks.map((t) => t.catch(() => undefined))).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [needs]);

  const searchProducts = useCallback(async (query: string) => {
    const res = await productsAPI.search(query.trim(), { context: 'all' });
    const list = extractArray<{ id: number; name: string; barcode?: string }>(res);
    return list.map((p) => ({
      id: String(p.id),
      label: p.barcode ? `${p.name} — ${p.barcode}` : p.name,
    }));
  }, []);

  return { categories, warehouses, customers, suppliers, cashiers, products, loading, searchProducts };
}
