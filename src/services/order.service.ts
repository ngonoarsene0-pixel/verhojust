/**
 * ============================================================================
 *  Order Service — handles COMMANDE, LIGNECOMMANDE, VENTE, LIGNEVENTE
 *  ============================================================================
 *  Order creation (COMMANDE + LIGNECOMMANDE) and sale finalization
 *  (VENTE + LIGNEVENTE). Also decrements product stock on order placement.
 * ============================================================================
 */
import { isMock, http } from "../lib/api";
import {
  commandes,
  ligneCommandes,
  ventes,
  ligneVentes,
  counters,
  mockRequest,
  formatDate,
  produits,
} from "../lib/mockData";
import type {
  Commande,
  LigneCommande,
  Vente,
  LigneVente,
  CartItem,
  CommandeWithDetails,
} from "../lib/types";

export interface CreateOrderInput {
  idClient: number;
  adresseLivraisonCommande: string;
  modePaiementCommande: "especes" | "mobile_money" | "carte";
  items: CartItem[];
}

export const orderService = {
  async createOrder(input: CreateOrderInput): Promise<Commande> {
    if (!isMock) return http.post<Commande>("/commandes", input);

    const idCommande = counters.commande++;
    const now = formatDate(new Date());
    const montantTotal = input.items.reduce(
      (s, i) => s + i.produit.prixProduit * i.quantiteProduit,
      0
    );
    const ref = `VHJ-${Date.now().toString(36).toUpperCase()}`;

    const commande: Commande = {
      idCommande,
      idClient: input.idClient,
      dateCommande: now,
      statutCommande: "en_attente",
      montantTotalCommande: montantTotal,
      adresseLivraisonCommande: input.adresseLivraisonCommande,
      modePaiementCommande: input.modePaiementCommande,
      referenceCommande: ref,
    };
    commandes.push(commande);

    for (const item of input.items) {
      const ligne: LigneCommande = {
        idLigneCommande: counters.ligneCommande++,
        idCommande,
        idProduit: item.produit.idProduit,
        quantiteProduit: item.quantiteProduit,
        prixUnitaire: item.produit.prixProduit,
      };
      ligneCommandes.push(ligne);

      // Decrement stock
      const p = produits.find((x) => x.idProduit === item.produit.idProduit);
      if (p) {
        p.quantiteStockProduit = Math.max(0, p.quantiteStockProduit - item.quantiteProduit);
      }
    }

    return mockRequest(commande);
  },

  async finalizeSale(
    idCommande: number,
    modePaiement: "especes" | "mobile_money" | "carte"
  ): Promise<Vente> {
    if (!isMock) return http.post<Vente>(`/ventes`, { idCommande, modePaiement });

    const commande = commandes.find((c) => c.idCommande === idCommande);
    if (!commande) throw new Error("Commande introuvable");

    const idVente = counters.vente++;
    const now = formatDate(new Date());

    const vente: Vente = {
      idVente,
      idCommande,
      dateVente: now,
      montantTotalVente: commande.montantTotalCommande,
      modePaiementVente: modePaiement,
      statutVente: "payee",
    };
    ventes.push(vente);

    // Copy order lines into sale lines
    const lignes = ligneCommandes.filter((l) => l.idCommande === idCommande);
    for (const l of lignes) {
      const lv: LigneVente = {
        idLigneVente: counters.ligneVente++,
        idVente,
        idProduit: l.idProduit,
        quantiteProduit: l.quantiteProduit,
        prixUnitaire: l.prixUnitaire,
      };
      ligneVentes.push(lv);
    }

    // Update order status
    commande.statutCommande = "confirmee";

    return mockRequest(vente);
  },

  async getClientOrders(idClient: number): Promise<CommandeWithDetails[]> {
    if (!isMock) return http.get<CommandeWithDetails[]>(`/commandes/client/${idClient}`);

    const result = commandes
      .filter((c) => c.idClient === idClient)
      .map((c) => {
        const lignes = ligneCommandes
          .filter((l) => l.idCommande === c.idCommande)
          .map((l) => ({
            ...l,
            produit: produits.find((p) => p.idProduit === l.idProduit),
          }));
        return { ...c, lignes } as CommandeWithDetails;
      })
      .sort((a, b) => b.dateCommande.localeCompare(a.dateCommande));

    return mockRequest(result);
  },

  async getAllOrders(): Promise<CommandeWithDetails[]> {
    if (!isMock) return http.get<CommandeWithDetails[]>("/commandes");

    const result = commandes
      .map((c) => {
        const lignes = ligneCommandes
          .filter((l) => l.idCommande === c.idCommande)
          .map((l) => ({
            ...l,
            produit: produits.find((p) => p.idProduit === l.idProduit),
          }));
        return { ...c, lignes } as CommandeWithDetails;
      })
      .sort((a, b) => b.dateCommande.localeCompare(a.dateCommande));

    return mockRequest(result);
  },

  async updateOrderStatus(idCommande: number, statut: Commande["statutCommande"]): Promise<Commande> {
    if (!isMock) return http.patch<Commande>(`/commandes/${idCommande}/status`, { statut });

    const c = commandes.find((x) => x.idCommande === idCommande);
    if (!c) throw new Error("Commande introuvable");
    c.statutCommande = statut;
    return mockRequest(c);
  },
};
