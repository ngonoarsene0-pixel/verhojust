/**
 * ============================================================================
 *  Product Service — handles PRODUIT & TYPEPRODUIT tables
 *  ============================================================================
 *  Catalog browsing, search, category filtering, stock status, and admin CRUD.
 * ============================================================================
 */
import { isMock, http } from "../lib/api";
import {
  produits,
  typeProduits,
  counters,
  mockRequest,
  formatDate,
} from "../lib/mockData";
import type { Produit, TypeProduit, ProduitWithType } from "../lib/types";

export const productService = {
  async getAllTypes(): Promise<TypeProduit[]> {
    if (!isMock) return http.get<TypeProduit[]>("/types");
    return mockRequest([...typeProduits]);
  },

  async getAllProducts(): Promise<ProduitWithType[]> {
    if (!isMock) return http.get<ProduitWithType[]>("/produits");
    return mockRequest(
      produits.map((p) => ({
        ...p,
        typeProduit: typeProduits.find((t) => t.idTypeProduit === p.idTypeProduit),
      }))
    );
  },

  async getById(id: number): Promise<ProduitWithType | null> {
    if (!isMock) return http.get<ProduitWithType>(`/produits/${id}`);
    const p = produits.find((x) => x.idProduit === id);
    if (!p) return null;
    return mockRequest({
      ...p,
      typeProduit: typeProduits.find((t) => t.idTypeProduit === p.idTypeProduit),
    });
  },

  async getByType(idTypeProduit: number): Promise<ProduitWithType[]> {
    if (!isMock) return http.get<ProduitWithType[]>(`/produits?type=${idTypeProduit}`);
    return mockRequest(
      produits
        .filter((p) => p.idTypeProduit === idTypeProduit)
        .map((p) => ({
          ...p,
          typeProduit: typeProduits.find((t) => t.idTypeProduit === p.idTypeProduit),
        }))
    );
  },

  async search(query: string): Promise<ProduitWithType[]> {
    if (!isMock) return http.get<ProduitWithType[]>(`/produits?q=${encodeURIComponent(query)}`);
    const q = query.toLowerCase();
    return mockRequest(
      produits
        .filter(
          (p) =>
            p.nomProduit.toLowerCase().includes(q) ||
            p.descriptionProduit.toLowerCase().includes(q)
        )
        .map((p) => ({
          ...p,
          typeProduit: typeProduits.find((t) => t.idTypeProduit === p.idTypeProduit),
        }))
    );
  },

  getStockStatus(p: Produit): "rupture" | "alerte" | "en_stock" {
    if (p.quantiteStockProduit === 0) return "rupture";
    if (p.quantiteStockProduit <= p.seuilAlertProduit) return "alerte";
    return "en_stock";
  },

  /* ----------------------------- ADMIN CRUD ----------------------------- */
  async createProduct(data: Omit<Produit, "idProduit" | "dateAjoutProduit">): Promise<Produit> {
    if (!isMock) return http.post<Produit>("/produits", data);
    const p: Produit = {
      ...data,
      idProduit: counters.produit++,
      dateAjoutProduit: formatDate(new Date()).slice(0, 10),
    };
    produits.push(p);
    return mockRequest(p);
  },

  async updateProduct(id: number, data: Partial<Produit>): Promise<Produit> {
    if (!isMock) return http.put<Produit>(`/produits/${id}`, data);
    const idx = produits.findIndex((p) => p.idProduit === id);
    if (idx === -1) throw new Error("Produit introuvable");
    produits[idx] = { ...produits[idx], ...data, idProduit: id };
    return mockRequest(produits[idx]);
  },

  async deleteProduct(id: number): Promise<void> {
    if (!isMock) return http.delete<void>(`/produits/${id}`);
    const idx = produits.findIndex((p) => p.idProduit === id);
    if (idx !== -1) produits.splice(idx, 1);
    return mockRequest(undefined);
  },

  async getLowStockProducts(): Promise<ProduitWithType[]> {
    if (!isMock) return http.get<ProduitWithType[]>("/produits?lowstock=1");
    return mockRequest(
      produits
        .filter((p) => p.quantiteStockProduit <= p.seuilAlertProduit)
        .map((p) => ({
          ...p,
          typeProduit: typeProduits.find((t) => t.idTypeProduit === p.idTypeProduit),
        }))
    );
  },
};
