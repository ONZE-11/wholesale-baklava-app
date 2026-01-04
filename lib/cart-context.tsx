"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// ---------------- CartItem interface ----------------
export interface CartItem {
  // id: string
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl: string;
  min_order_quantity: number;
}

// ---------------- Context type ----------------
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

// ---------------- Create context ----------------
const CartContext = createContext<CartContextType | undefined>(undefined);

// ---------------- Provider ----------------
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) setItems(JSON.parse(savedCart));
    } catch {
      localStorage.removeItem("cart");
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length === 0) {
      localStorage.removeItem("cart");
    } else {
      localStorage.setItem("cart", JSON.stringify(items));
    }
  }, [items]);

  // ---------------- Add item ----------------
  const addItem = (item: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (i) => i.productId === item.productId
      );

      if (existingItem) {
        // اگر محصول موجود است، مقدار واقعی کاربر را اضافه کن (بدون محدودیت min_order_quantity)
        const newQuantity = existingItem.quantity + item.quantity;
        return prevItems.map((i) =>
          i.productId === item.productId ? { ...i, quantity: newQuantity } : i
        );
      }

      // محصول جدید: اگر کمتر از حداقل است، حداقل را قرار بده
      const quantity =
        item.quantity < item.min_order_quantity
          ? item.min_order_quantity
          : item.quantity;

      return [...prevItems, { ...item, quantity }];
    });
  };

  // ---------------- Update quantity ----------------
  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prevItems) =>
      prevItems.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(quantity, i.min_order_quantity) }
          : i
      )
    );
  };

  // ---------------- Remove item ----------------
  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.productId !== productId));
  };

  // ---------------- Clear cart ----------------
  const clearCart = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem("cart");
    } catch {}
  }, []);

  // ---------------- Totals ----------------
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ---------------- Hook ----------------
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
