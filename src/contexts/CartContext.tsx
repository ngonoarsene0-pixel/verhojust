import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { CartItem } from "../lib/types";
import { cartService, GUEST_CLIENT_ID } from "../services/cart.service";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  items: CartItem[];
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (idProduit: number, quantite?: number, typeAchat?: string) => Promise<void>;
  updateQuantity: (idProduit: number, quantite: number, typeAchat?: string) => Promise<void>;
  removeFromCart: (idProduit: number, typeAchat?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const clientId = user?.client.idClient ?? GUEST_CLIENT_ID;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await cartService.getCart(clientId);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Chargement automatique du panier au démarrage ou lors du changement de client
  useEffect(() => {
    refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (idProduit: number, quantite = 1, typeAchat: string = "kilo") => {
      const data = await cartService.addToCart(clientId, idProduit, quantite, typeAchat);
      setItems(data);
    },
    [clientId]
  );

  const updateQuantity = useCallback(
    async (idProduit: number, quantite: number, typeAchat: string = "kilo") => {
      const data = await cartService.updateQuantity(clientId, idProduit, quantite, typeAchat);
      setItems(data);
    },
    [clientId]
  );

  const removeFromCart = useCallback(
    async (idProduit: number, typeAchat?: string) => {
      const data = await cartService.removeFromCart(clientId, idProduit, typeAchat);
      setItems(data);
    },
    [clientId]
  );

  const clearCart = useCallback(async () => {
    await cartService.clearCart(clientId);
    setItems([]);
  }, [clientId]);

  const totalItems = items.reduce((s, i) => s + i.quantiteProduit, 0);
  
  // Calcul dynamique basé sur le type d'achat (Détail vs Kilo) sans erreur
  const totalAmount = items.reduce((s, i) => {
    const prixUnitaire = i.typeAchat === "kilo" 
      ? (i.produit.prixKiloProduit || 0) 
      : (i.produit.prixBoiteProduit || 0);
    return s + prixUnitaire * i.quantiteProduit;
  }, 0);

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