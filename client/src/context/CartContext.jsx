import React, { createContext, useContext, useEffect, useState } from 'react';
import { packImages } from '../data/productMedia.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sbh-cart') || '[]');
      return Array.isArray(stored) ? stored : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sbh-cart', JSON.stringify(items));
    } catch {
      /* The cart remains usable for this browser session. */
    }
  }, [items]);

  function add(product, variant, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.sku === variant[1]);
      if (existing)
        return current.map((item) =>
          item.sku === variant[1]
            ? { ...item, qty: Math.min(99, item.qty + quantity) }
            : item
        );
      return [
        ...current,
        {
          slug: product.slug,
          name: product.name,
          label: variant[0],
          sku: variant[1],
          price: variant[3],
          mrp: variant[2],
          qty: Math.min(99, quantity),
          image: packImages[product.slug] || product.image,
        },
      ];
    });
  }

  function change(sku, quantity) {
    setItems((current) =>
      current.map((item) =>
        item.sku === sku
          ? { ...item, qty: Math.max(1, Math.min(99, quantity)) }
          : item
      )
    );
  }

  function remove(sku) {
    setItems((current) => current.filter((item) => item.sku !== sku));
  }

  const value = {
    items,
    add,
    change,
    remove,
    clear: () => setItems([]),
    count: items.reduce((sum, item) => sum + item.qty, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.qty, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider.');
  return context;
}
