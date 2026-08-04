/**
 * ============================================================================
 * Cart Service — handles PANIER & REGROUPER tables
 * ============================================================================
 * Cart management (add, update, remove, clear) persisted via PANIER and the
 * REGROUPER join table in Supabase.
 * ============================================================================
 */
import { supabase } from "../lib/supabase";
import type { CartItem } from "../lib/types";

export const cartService = {
  async getCart(idClient: number): Promise<CartItem[]> {
    let { data: panier, error: panierError } = await supabase
      .from("panier")
      .select("id_panier")
      .eq("id_client", idClient)
      .eq("statut_panier", "actif")
      .maybeSingle();

    if (panierError) throw panierError;

    if (!panier) {
      const { data: newPanier, error: createError } = await supabase
        .from("panier")
        .insert({ id_client: idClient, statut_panier: "actif" })
        .select("id_panier")
        .single();

      if (createError) throw createError;
      panier = newPanier;
    }

    const { data: lignes, error: lignesError } = await supabase
      .from("regrouper")
      .select("quantite_produit, produit(*, typeproduit(*))")
      .eq("id_panier", panier.id_panier);

    if (lignesError) throw lignesError;

    return (lignes || []).map((l: any) => ({
      quantiteProduit: l.quantite_produit,
      produit: {
        idProduit: l.produit.id_produit,
        nomProduit: l.produit.nom_produit,
        descriptionProduit: l.produit.description_produit,
        prixProduit: l.produit.prix_produit,
        quantiteStockProduit: l.produit.quantite_stock_produit,
        seuilAlertProduit: l.produit.seuil_alert_produit,
        imageProduit: l.produit.image_produit,
        idTypeProduit: l.produit.id_type_produit,
        dateAjoutProduit: l.produit.date_ajout_produit,
        typeProduit: l.produit.typeproduit ? {
          idTypeProduit: l.produit.typeproduit.id_type_produit,
          nomTypeProduit: l.produit.typeproduit.nom_type_produit,
          descriptionTypeProduit: l.produit.typeproduit.description_type_produit,
        } : undefined,
      },
    }));
  },

  async addToCart(
    idClient: number,
    idProduit: number,
    quantite: number
  ): Promise<CartItem[]> {
    let { data: panier, error: panierError } = await supabase
      .from("panier")
      .select("id_panier")
      .eq("id_client", idClient)
      .eq("statut_panier", "actif")
      .maybeSingle();

    if (panierError) throw panierError;

    if (!panier) {
      const { data: newPanier, error: createError } = await supabase
        .from("panier")
        .insert({ id_client: idClient, statut_panier: "actif" })
        .select("id_panier")
        .single();

      if (createError) throw createError;
      panier = newPanier;
    }

    const { data: existing, error: existingError } = await supabase
      .from("regrouper")
      .select("quantite_produit")
      .eq("id_panier", panier.id_panier)
      .eq("id_produit", idProduit)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      const { error: updateError } = await supabase
        .from("regrouper")
        .update({ quantite_produit: existing.quantite_produit + quantite })
        .eq("id_panier", panier.id_panier)
        .eq("id_produit", idProduit);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("regrouper")
        .insert({
          id_panier: panier.id_panier,
          id_produit: idProduit,
          quantite_produit: quantite,
        });

      if (insertError) throw insertError;
    }

    return this.getCart(idClient);
  },

  async updateQuantity(
    idClient: number,
    idProduit: number,
    quantite: number
  ): Promise<CartItem[]> {
    const { data: panier } = await supabase
      .from("panier")
      .select("id_panier")
      .eq("id_client", idClient)
      .eq("statut_panier", "actif")
      .maybeSingle();

    if (!panier) return [];

    if (quantite <= 0) {
      return this.removeFromCart(idClient, idProduit);
    }

    const { error } = await supabase
      .from("regrouper")
      .update({ quantite_produit: quantite })
      .eq("id_panier", panier.id_panier)
      .eq("id_produit", idProduit);

    if (error) throw error;

    return this.getCart(idClient);
  },

  async removeFromCart(idClient: number, idProduit: number): Promise<CartItem[]> {
    const { data: panier } = await supabase
      .from("panier")
      .select("id_panier")
      .eq("id_client", idClient)
      .eq("statut_panier", "actif")
      .maybeSingle();

    if (!panier) return [];

    const { error } = await supabase
      .from("regrouper")
      .delete()
      .eq("id_panier", panier.id_panier)
      .eq("id_produit", idProduit);

    if (error) throw error;

    return this.getCart(idClient);
  },

  async clearCart(idClient: number): Promise<void> {
    const { data: panier } = await supabase
      .from("panier")
      .select("id_panier")
      .eq("id_client", idClient)
      .eq("statut_panier", "actif")
      .maybeSingle();

    if (!panier) return;

    const { error } = await supabase
      .from("regrouper")
      .delete()
      .eq("id_panier", panier.id_panier);

    if (error) throw error;
  },

  async getCartTotal(items: CartItem[]): Promise<number> {
    return items.reduce((sum, i) => sum + i.produit.prixProduit * i.quantiteProduit, 0);
  },
};

export const GUEST_CLIENT_ID = 0;