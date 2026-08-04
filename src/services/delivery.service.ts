/**
 * ============================================================================
 * Delivery Service — handles LIVRAISON & LIGNELIVRAISON tables
 * ============================================================================
 * Delivery creation (linked to COMMANDE), status tracking, and history.
 * ============================================================================
 */
import { supabase } from "../lib/supabase";
import type { Livraison, LigneLivraison } from "../lib/types";

export const deliveryService = {
  async createDelivery(idCommande: number, adresseLivraison: string): Promise<Livraison> {
    const datePrevue = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("livraison")
      .insert({
        id_commande: idCommande,
        adresse_livraison: adresseLivraison,
        statut_livraison: "programmee",
        date_livraison_prevue: datePrevue,
        livreur: "À assigner",
        note_livraison: "",
      })
      .select()
      .single();

    if (error) throw error;

    // Récupérer les lignes de la commande pour alimenter l'historique si nécessaire
    const { data: lignesCommande } = await supabase
      .from("lignecommande")
      .select("*")
      .eq("id_commande", idCommande);

    if (lignesCommande) {
      for (const l of lignesCommande) {
        await supabase.from("lignelivraison").insert({
          id_livraison: data.id_livraison,
          id_produit: l.id_produit,
          quantite_produit: l.quantite_produit,
        });
      }
    }

    return {
      idLivraison: data.id_livraison,
      idCommande: data.id_commande,
      dateLivraisonPrevue: data.date_livraison_prevue,
      dateLivraisonReelle: data.date_livraison_reelle,
      statutLivraison: data.statut_livraison,
      adresseLivraison: data.adresse_livraison,
      livreur: data.livreur,
      noteLivraison: data.note_livraison,
    };
  },

  async getByOrder(idCommande: number): Promise<Livraison | null> {
    const { data, error } = await supabase
      .from("livraison")
      .select("*")
      .eq("id_commande", idCommande)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      idLivraison: data.id_livraison,
      idCommande: data.id_commande,
      dateLivraisonPrevue: data.date_livraison_prevue,
      dateLivraisonReelle: data.date_livraison_reelle,
      statutLivraison: data.statut_livraison,
      adresseLivraison: data.adresse_livraison,
      livreur: data.livreur,
      noteLivraison: data.note_livraison,
    };
  },

  async getByClient(idClient: number): Promise<Livraison[]> {
    const { data, error } = await supabase
      .from("livraison")
      .select(`*, commande!inner(id_client)`)
      .eq("commande.id_client", idClient);

    if (error) throw error;

    return (data || []).map((l: any) => ({
      idLivraison: l.id_livraison,
      idCommande: l.id_commande,
      dateLivraisonPrevue: l.date_livraison_prevue,
      dateLivraisonReelle: l.date_livraison_reelle,
      statutLivraison: l.statut_livraison,
      adresseLivraison: l.adresse_livraison,
      livreur: l.livreur,
      noteLivraison: l.note_livraison,
    }));
  },

  async getAll(): Promise<(Livraison & { reference?: string })[]> {
    const { data, error } = await supabase
      .from("livraison")
      .select(`*, commande(reference_commande)`);

    if (error) throw error;

    return (data || []).map((l: any) => ({
      idLivraison: l.id_livraison,
      idCommande: l.id_commande,
      dateLivraisonPrevue: l.date_livraison_prevue,
      dateLivraisonReelle: l.date_livraison_reelle,
      statutLivraison: l.statut_livraison,
      adresseLivraison: l.adresse_livraison,
      livreur: l.livreur,
      noteLivraison: l.note_livraison,
      reference: l.commande?.reference_commande,
    }));
  },

  async updateStatus(
    idLivraison: number,
    statut: Livraison["statutLivraison"],
    note?: string
  ): Promise<Livraison> {
    const updateData: any = { statut_livraison: statut };
    if (note !== undefined) updateData.note_livraison = note;
    if (statut === "livree") {
      updateData.date_livraison_reelle = new Date().toISOString().slice(0, 10);
    }

    const { data, error } = await supabase
      .from("livraison")
      .update(updateData)
      .eq("id_livraison", idLivraison)
      .select()
      .single();

    if (error) throw error;

    if (statut === "livree" && data) {
      await supabase
        .from("commande")
        .update({ statut_commande: "livree" })
        .eq("id_commande", data.id_commande);
    }

    return {
      idLivraison: data.id_livraison,
      idCommande: data.id_commande,
      dateLivraisonPrevue: data.date_livraison_prevue,
      dateLivraisonReelle: data.date_livraison_reelle,
      statutLivraison: data.statut_livraison,
      adresseLivraison: data.adresse_livraison,
      livreur: data.livreur,
      noteLivraison: data.note_livraison,
    };
  },
};