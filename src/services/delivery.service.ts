/**
 * ============================================================================
 *  Delivery Service — handles LIVRAISON & LIGNELIVRAISON tables
 *  ============================================================================
 *  Delivery creation (linked to COMMANDE), status tracking, and history.
 * ============================================================================
 */
import { isMock, http } from "../lib/api";
import {
  livraisons,
  ligneLivraisons,
  counters,
  mockRequest,
  formatDate,
  ligneCommandes,
  commandes,
} from "../lib/mockData";
import type { Livraison, LigneLivraison } from "../lib/types";

export const deliveryService = {
  async createDelivery(idCommande: number, adresseLivraison: string): Promise<Livraison> {
    if (!isMock) return http.post<Livraison>("/livraisons", { idCommande, adresseLivraison });

    const idLivraison = counters.livraison++;
    const commande = commandes.find((c) => c.idCommande === idCommande);
    if (!commande) throw new Error("Commande introuvable");

    const livraison: Livraison = {
      idLivraison,
      idCommande,
      dateLivraisonPrevue: formatDate(new Date(Date.now() + 2 * 86400000)).slice(0, 10),
      dateLivraisonReelle: null,
      statutLivraison: "programmee",
      adresseLivraison,
      livreur: "À assigner",
      noteLivraison: "",
    };
    livraisons.push(livraison);

    // Copy order lines into delivery lines
    const lignes = ligneCommandes.filter((l) => l.idCommande === idCommande);
    for (const l of lignes) {
      const ll: LigneLivraison = {
        idLigneLivraison: counters.ligneLivraison++,
        idLivraison,
        idProduit: l.idProduit,
        quantiteProduit: l.quantiteProduit,
      };
      ligneLivraisons.push(ll);
    }

    return mockRequest(livraison);
  },

  async getByOrder(idCommande: number): Promise<Livraison | null> {
    if (!isMock) return http.get<Livraison>(`/livraisons/commande/${idCommande}`);
    const l = livraisons.find((x) => x.idCommande === idCommande);
    return mockRequest(l ?? null);
  },

  async getByClient(idClient: number): Promise<Livraison[]> {
    if (!isMock) return http.get<Livraison[]>(`/livraisons/client/${idClient}`);
    const result = livraisons.filter((l) => {
      const c = commandes.find((cmd) => cmd.idCommande === l.idCommande);
      return c?.idClient === idClient;
    });
    return mockRequest(result);
  },

  async getAll(): Promise<(Livraison & { reference?: string })[]> {
    if (!isMock) return http.get<(Livraison & { reference?: string })[]>("/livraisons");
    const result = livraisons.map((l) => {
      const c = commandes.find((cmd) => cmd.idCommande === l.idCommande);
      return { ...l, reference: c?.referenceCommande };
    });
    return mockRequest(result);
  },

  async updateStatus(
    idLivraison: number,
    statut: Livraison["statutLivraison"],
    note?: string
  ): Promise<Livraison> {
    if (!isMock) return http.patch<Livraison>(`/livraisons/${idLivraison}`, { statut, note });

    const l = livraisons.find((x) => x.idLivraison === idLivraison);
    if (!l) throw new Error("Livraison introuvable");
    l.statutLivraison = statut;
    if (note !== undefined) l.noteLivraison = note;
    if (statut === "livree") {
      l.dateLivraisonReelle = formatDate(new Date()).slice(0, 10);
      // Also update the commande status
      const c = commandes.find((cmd) => cmd.idCommande === l.idCommande);
      if (c) c.statutCommande = "livree";
    }
    return mockRequest(l);
  },
};
