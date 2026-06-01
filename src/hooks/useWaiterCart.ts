import { useCallback, useState } from 'react';
import { cartLineKey, type CartLine } from '@/store/posStore';
import type { CartLineSelectedOption, Product } from '@/types/api';
import { unitMeta, unitSellingPrice } from '@/utils/posUnitPrice';

export function useWaiterCart() {
  const [cart, setCart] = useState<CartLine[]>([]);

  const addProduct = useCallback(
    (
      product: Product,
      selectedOptions?: CartLineSelectedOption[],
      variant?: { id: string; name?: string | null } | null,
      unitId?: number | null,
    ) => {
      const variantId = variant?.id ?? null;
      const uMeta = unitMeta(product, unitId);
      const resolvedUnitId = uMeta?.id ?? null;
      const newLineKey = cartLineKey({
        product_id: product.id,
        variant_id: variantId,
        unit_id: resolvedUnitId,
        selected_options: selectedOptions && selectedOptions.length > 0 ? selectedOptions : undefined,
      });

      setCart((current) => {
        const existing = current.find((line) => cartLineKey(line) === newLineKey);
        if (existing) {
          return current.map((line) =>
            cartLineKey(line) === newLineKey ? { ...line, quantity: line.quantity + 1 } : line,
          );
        }
        return [
          ...current,
          {
            product_id: product.id,
            product_name: product.name,
            quantity: 1,
            unit_price: unitSellingPrice(product, variantId, resolvedUnitId),
            discount: 0,
            unit_id: resolvedUnitId,
            variant_id: variantId,
            variant_name: variant?.name ?? null,
            selected_options: selectedOptions && selectedOptions.length > 0 ? selectedOptions : undefined,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((lineKey: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          cartLineKey(line) === lineKey ? { ...line, quantity: Math.max(0, line.quantity + delta) } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const removeLine = useCallback((lineKey: string) => {
    setCart((current) => current.filter((line) => cartLineKey(line) !== lineKey));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const setLineNotes = useCallback((lineKey: string, notes: string) => {
    setCart((current) =>
      current.map((line) => (cartLineKey(line) === lineKey ? { ...line, notes: notes || undefined } : line)),
    );
  }, []);

  return {
    cart,
    setCart,
    addProduct,
    updateQuantity,
    removeLine,
    clearCart,
    setLineNotes,
  };
}
