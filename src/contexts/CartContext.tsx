import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { CartItem } from "../lib/types";
import { cartService } from "../services/cart.service";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (idProduit: number, quantite?: number) => Promise<void>;
  updateQuantity: (idProduit: number, quantite: number) => Promise<void>;
  removeFromCart: (idProduit: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await cartService.getCart(user.client.idClient);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToCart = useCallback(
    async (idProduit: number, quantite = 1) => {
      if (!user) return;
      const data = await cartService.addToCart(user.client.idClient, idProduit, quantite);
      setItems(data);
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (idProduit: number, quantite: number) => {
      if (!user) return;
      const data = await cartService.updateQuantity(user.client.idClient, idProduit, quantite);
      setItems(data);
    },
    [user]
  );

  const removeFromCart = useCallback(
    async (idProduit: number) => {
      if (!user) return;
      const data = await cartService.removeFromCart(user.client.idClient, idProduit);
      setItems(data);
    },
    [user]
  );

  const clearCart = useCallback(async () => {
    if (!user) return;
    await cartService.clearCart(user.client.idClient);
    setItems([]);
  }, [user]);

  const totalItems = items.reduce((s, i) => s + i.quantiteProduit, 0);
  const totalAmount = items.reduce(
    (s, i) => s + i.produit.prixProduit * i.quantiteProduit,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        refresh,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalItems,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
