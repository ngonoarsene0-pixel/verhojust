/**
 * ============================================================================
 *  Cart Service — handles PANIER & REGROUPER tables
 *  ============================================================================
 *  Cart management (add, update, remove, clear) persisted via PANIER and the
 *  REGROUPER join table. In mock mode, cart state is mirrored to localStorage
 *  so it survives reloads.
 * ============================================================================
 */
import { isMock, http } from "../lib/api";
import {
  paniers,
  counters,
  mockRequest,
  formatDate,
} from "../lib/mockData";
import { produits } from "../lib/mockData";
import type { Panier, CartItem } from "../lib/types";

const CART_KEY = "verhojust_cart";

interface CartState {
  idPanier: number | null;
  items: { idProduit: number; quantiteProduit: number }[];
}

function loadCart(): CartState {
  const raw = localStorage.getItem(CART_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as CartState;
    } catch {
      /* fall through */
    }
  }
  return { idPanier: null, items: [] };
}

function saveCart(state: CartState): void {
  localStorage.setItem(CART_KEY, JSON.stringify(state));
}

export const cartService = {
  async getCart(idClient: number): Promise<CartItem[]> {
    if (!isMock) return http.get<CartItem[]>(`/panier/${idClient}`);

    const state = loadCart();
    if (state.items.length === 0) return mockRequest([]);
    const items: CartItem[] = state.items
      .map((ri) => {
        const produit = produits.find((p) => p.idProduit === ri.idProduit);
        return produit ? { produit, quantiteProduit: ri.quantiteProduit } : null;
      })
      .filter(Boolean) as CartItem[];
    return mockRequest(items);
  },

  async addToCart(
    idClient: number,
    idProduit: number,
    quantite: number
  ): Promise<CartItem[]> {
    if (!isMock)
      return http.post<CartItem[]>(`/panier/${idClient}/add`, { idProduit, quantite });

    const state = loadCart();
    if (!state.idPanier) {
      state.idPanier = counters.panier++;
      const panier: Panier = {
        idPanier: state.idPanier,
        idClient,
        dateCreationPanier: formatDate(new Date()).slice(0, 10),
        statutPanier: "actif",
      };
      paniers.push(panier);
    }
    const existing = state.items.find((i) => i.idProduit === idProduit);
    if (existing) {
      existing.quantiteProduit += quantite;
    } else {
      state.items.push({ idProduit, quantiteProduit: quantite });
    }
    saveCart(state);
    return this.getCart(idClient);
  },

  async updateQuantity(
    idClient: number,
    idProduit: number,
    quantite: number
  ): Promise<CartItem[]> {
    if (!isMock)
      return http.put<CartItem[]>(`/panier/${idClient}/update`, { idProduit, quantite });

    const state = loadCart();
    const item = state.items.find((i) => i.idProduit === idProduit);
    if (item) {
      if (quantite <= 0) {
        state.items = state.items.filter((i) => i.idProduit !== idProduit);
      } else {
        item.quantiteProduit = quantite;
      }
      saveCart(state);
    }
    return this.getCart(idClient);
  },

  async removeFromCart(idClient: number, idProduit: number): Promise<CartItem[]> {
    if (!isMock)
      return http.delete<CartItem[]>(`/panier/${idClient}/remove/${idProduit}`);

    const state = loadCart();
    state.items = state.items.filter((i) => i.idProduit !== idProduit);
    saveCart(state);
    return this.getCart(idClient);
  },

  async clearCart(idClient: number): Promise<void> {
    if (!isMock) return http.delete<void>(`/panier/${idClient}/clear`);

    const state = loadCart();
    state.items = [];
    saveCart(state);
    return mockRequest(undefined);
  },

  async getCartTotal(items: CartItem[]): Promise<number> {
    return items.reduce((sum, i) => sum + i.produit.prixProduit * i.quantiteProduit, 0);
  },
};

export const GUEST_CLIENT_ID = 0;
