import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ProductFormState } from '@/hooks/useProductForm';

export type ProductFormSectionKey =
  | 'basics'
  | 'pricing'
  | 'inventory'
  | 'advanced'
  | 'rawDetails'
  | 'recipe'
  | 'modifiers'
  | 'extra';

export type ProductFormValidationError = {
  message: string;
  sectionKey: ProductFormSectionKey;
};

type ContextValue = {
  form: ProductFormState | null;
  registerForm: (id: symbol, form: ProductFormState) => void;
  unregisterForm: (id: symbol) => void;
};

const ProductFormContext = createContext<ContextValue | null>(null);

export function ProductFormProvider({ children }: { children: React.ReactNode }) {
  const orderRef = useRef<symbol[]>([]);
  const formsRef = useRef<Map<symbol, ProductFormState>>(new Map());
  const [, bump] = useState(0);

  const registerForm = useCallback((id: symbol, form: ProductFormState) => {
    if (!formsRef.current.has(id)) orderRef.current.push(id);
    formsRef.current.set(id, form);
    bump((n) => n + 1);
  }, []);

  const unregisterForm = useCallback((id: symbol) => {
    formsRef.current.delete(id);
    orderRef.current = orderRef.current.filter((x) => x !== id);
    bump((n) => n + 1);
  }, []);

  const activeId = orderRef.current[orderRef.current.length - 1];
  const form = activeId != null ? (formsRef.current.get(activeId) ?? null) : null;

  const value = useMemo(() => ({ form, registerForm, unregisterForm }), [form, registerForm, unregisterForm]);

  return <ProductFormContext.Provider value={value}>{children}</ProductFormContext.Provider>;
}

export function useProductFormContext(): ProductFormState {
  const ctx = useContext(ProductFormContext);
  if (!ctx?.form) {
    throw new Error('لا يوجد نموذج منتج نشط — افتح نموذج المنتج أولاً');
  }
  return ctx.form;
}

export function useOptionalProductFormContext(): ProductFormState | null {
  return useContext(ProductFormContext)?.form ?? null;
}

export function useRegisterProductForm(form: ProductFormState) {
  const ctx = useContext(ProductFormContext);
  const idRef = useRef(Symbol('product-form'));

  React.useEffect(() => {
    if (!ctx) return;
    const id = idRef.current;
    return () => ctx.unregisterForm(id);
  }, [ctx]);

  React.useEffect(() => {
    if (!ctx) return;
    ctx.registerForm(idRef.current, form);
  });
}
