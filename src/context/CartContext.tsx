"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { formatPrice } from "@/lib/money";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  category?: string;
  quantity: number;
}

export type AddToCartInput = Omit<CartItem, "quantity">;

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: AddToCartInput, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = "coach_coke_cart";

interface LegacyCartItem {
  id: string;
  name: string;
  price: string | number;
  image: string;
  category?: string;
  quantity: number;
}

function normalizeItem(raw: LegacyCartItem): CartItem {
  if (typeof raw.price === "number") {
    return {
      id: raw.id,
      name: raw.name,
      price: raw.price,
      priceLabel: formatPrice(raw.price),
      image: raw.image,
      category: raw.category,
      quantity: raw.quantity,
    };
  }
  // Legacy carts stored a formatted "$450.00" string — parse it once.
  const parsed = parseFloat(raw.price.replace(/[^0-9.]/g, "")) || 0;
  return {
    id: raw.id,
    name: raw.name,
    price: parsed,
    priceLabel: raw.price,
    image: raw.image,
    category: raw.category,
    quantity: raw.quantity,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount (deferred to avoid a synchronous
  // setState within the effect triggering cascading re-renders)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as LegacyCartItem[];
        if (Array.isArray(parsed)) {
          const timer = window.setTimeout(() => {
            setCart(parsed.map(normalizeItem));
          }, 0);
          return () => window.clearTimeout(timer);
        }
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    }
  }, []);

  // Save cart to localStorage on updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [cart]);

  const addToCart = (product: AddToCartInput, quantity: number = 1) => {
    const safeQty = Math.max(1, Math.floor(quantity) || 1);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + safeQty } : item
        );
      }
      return [...prev, { ...product, quantity: safeQty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}