/**
 * ============================================================================
 * Product Service — handles PRODUIT & TYPEPRODUIT tables
 * ============================================================================
 * Catalog browsing, search, category filtering, stock status, and admin CRUD.
 * ============================================================================
 */
import { supabase } from "../lib/supabase";
import type { Produit, TypeProduit, ProduitWithType } from "../lib/types";

export const productService = {
  async getAllTypes(): Promise<TypeProduit[]> {
    const { data, error } = await supabase.from("typeproduit").select("*");
    if (error) throw error;

    return (data || []).map((t: any) => ({
      idTypeProduit: t.id_type_produit,
      nomTypeProduit: t.nom_type_produit,
      descriptionTypeProduit: t.description_type_produit,
    }));
  },

  async getAllProducts(): Promise<ProduitWithType[]> {
    const { data, error } = await supabase
      .from("produit")
      .select(`*, typeproduit(*)`);
    if (error) throw error;

    return (data || []).map((p: any) => ({
      idProduit: p.id_produit,
      nomProduit: p.nom_produit,
      descriptionProduit: p.description_produit,
      prixProduit: p.prix_produit,
      quantiteStockProduit: p.quantite_stock_produit,
      seuilAlertProduit: p.seuil_alert_produit,
      imageProduit: p.image_produit,
      idTypeProduit: p.id_type_produit,
      dateAjoutProduit: p.date_ajout_produit,
      typeProduit: p.typeproduit ? {
        idTypeProduit: p.typeproduit.id_type_produit,
        nomTypeProduit: p.typeproduit.nom_type_produit,
        descriptionTypeProduit: p.typeproduit.description_type_produit,
      } : undefined,
    }));
  },

  async getById(id: number): Promise<ProduitWithType | null> {
    const { data, error } = await supabase
      .from("produit")
      .select(`*, typeproduit(*)`)
      .eq("id_produit", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      idProduit: data.id_produit,
      nomProduit: data.nom_produit,
      descriptionProduit: data.description_produit,
      prixProduit: data.prix_produit,
      quantiteStockProduit: data.quantite_stock_produit,
      seuilAlertProduit: data.seuil_alert_produit,
      imageProduit: data.image_produit,
      idTypeProduit: data.id_type_produit,
      dateAjoutProduit: data.date_ajout_produit,
      typeProduit: data.typeproduit ? {
        idTypeProduit: data.typeproduit.id_type_produit,
        nomTypeProduit: data.typeproduit.nom_type_produit,
        descriptionTypeProduit: data.typeproduit.description_type_produit,
      } : undefined,
    };
  },

  async getByType(idTypeProduit: number): Promise<ProduitWithType[]> {
    const { data, error } = await supabase
      .from("produit")
      .select(`*, typeproduit(*)`)
      .eq("id_type_produit", idTypeProduit);

    if (error) throw error;

    return (data || []).map((p: any) => ({
      idProduit: p.id_produit,
      nomProduit: p.nom_produit,
      descriptionProduit: p.description_produit,
      prixProduit: p.prix_produit,
      quantiteStockProduit: p.quantite_stock_produit,
      seuilAlertProduit: p.seuil_alert_produit,
      imageProduit: p.image_produit,
      idTypeProduit: p.id_type_produit,
      dateAjoutProduit: p.date_ajout_produit,
      typeProduit: p.typeproduit ? {
        idTypeProduit: p.typeproduit.id_type_produit,
        nomTypeProduit: p.typeproduit.nom_type_produit,
        descriptionTypeProduit: p.typeproduit.description_type_produit,
      } : undefined,
    }));
  },

  async search(query: string): Promise<ProduitWithType[]> {
    const { data, error } = await supabase
      .from("produit")
      .select(`*, typeproduit(*)`)
      .or(`nom_produit.ilike.%${query}%,description_produit.ilike.%${query}%`);

    if (error) throw error;

    return (data || []).map((p: any) => ({
      idProduit: p.id_produit,
      nomProduit: p.nom_produit,
      descriptionProduit: p.description_produit,
      prixProduit: p.prix_produit,
      quantiteStockProduit: p.quantite_stock_produit,
      seuilAlertProduit: p.seuil_alert_produit,
      imageProduit: p.image_produit,
      idTypeProduit: p.id_type_produit,
      dateAjoutProduit: p.date_ajout_produit,
      typeProduit: p.typeproduit ? {
        idTypeProduit: p.typeproduit.id_type_produit,
        nomTypeProduit: p.typeproduit.nom_type_produit,
        descriptionTypeProduit: p.typeproduit.description_type_produit,
      } : undefined,
    }));
  },

  getStockStatus(p: Produit): "rupture" | "alerte" | "en_stock" {
    if (p.quantiteStockProduit === 0) return "rupture";
    if (p.quantiteStockProduit <= p.seuilAlertProduit) return "alerte";
    return "en_stock";
  },

  /* ----------------------------- ADMIN CRUD ----------------------------- */
  async createProduct(data: Omit<Produit, "idProduit" | "dateAjoutProduit">): Promise<Produit> {
    const { data: inserted, error } = await supabase
      .from("produit")
      .insert({
        nom_produit: data.nomProduit,
        description_produit: data.descriptionProduit,
        prix_produit: data.prixProduit,
        quantite_stock_produit: data.quantiteStockProduit,
        seuil_alert_produit: data.seuilAlertProduit,
        image_produit: data.imageProduit,
        id_type_produit: data.idTypeProduit,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      idProduit: inserted.id_produit,
      nomProduit: inserted.nom_produit,
      descriptionProduit: inserted.description_produit,
      prixProduit: inserted.prix_produit,
      quantiteStockProduit: inserted.quantite_stock_produit,
      seuilAlertProduit: inserted.seuil_alert_produit,
      imageProduit: inserted.image_produit,
      idTypeProduit: inserted.id_type_produit,
      dateAjoutProduit: inserted.date_ajout_produit,
    };
  },

  async updateProduct(id: number, data: Partial<Produit>): Promise<Produit> {
    const updatePayload: any = {};
    if (data.nomProduit !== undefined) updatePayload.nom_produit = data.nomProduit;
    if (data.descriptionProduit !== undefined) updatePayload.description_produit = data.descriptionProduit;
    if (data.prixProduit !== undefined) updatePayload.prix_produit = data.prixProduit;
    if (data.quantiteStockProduit !== undefined) updatePayload.quantite_stock_produit = data.quantiteStockProduit;
    if (data.seuilAlertProduit !== undefined) updatePayload.seuil_alert_produit = data.seuilAlertProduit;
    if (data.imageProduit !== undefined) updatePayload.image_produit = data.imageProduit;
    if (data.idTypeProduit !== undefined) updatePayload.id_type_produit = data.idTypeProduit;

    const { data: updated, error } = await supabase
      .from("produit")
      .update(updatePayload)
      .eq("id_produit", id)
      .select()
      .single();

    if (error) throw error;

    return {
      idProduit: updated.id_produit,
      nomProduit: updated.nom_produit,
      descriptionProduit: updated.description_produit,
      prixProduit: updated.prix_produit,
      quantiteStockProduit: updated.quantite_stock_produit,
      seuilAlertProduit: updated.seuil_alert_produit,
      imageProduit: updated.image_produit,
      idTypeProduit: updated.id_type_produit,
      dateAjoutProduit: updated.date_ajout_produit,
    };
  },

  async deleteProduct(id: number): Promise<void> {
    const { error } = await supabase.from("produit").delete().eq("id_produit", id);
    if (error) throw error;
  },

  async getLowStockProducts(): Promise<ProduitWithType[]> {
    const { data, error } = await supabase
      .from("produit")
      .select(`*, typeproduit(*)`);

    if (error) throw error;

    return (data || [])
      .filter((p: any) => p.quantite_stock_produit <= p.seuil_alert_produit)
      .map((p: any) => ({
        idProduit: p.id_produit,
        nomProduit: p.nom_produit,
        descriptionProduit: p.description_produit,
        prixProduit: p.prix_produit,
        quantiteStockProduit: p.quantite_stock_produit,
        seuilAlertProduit: p.seuil_alert_produit,
        imageProduit: p.image_produit,
        idTypeProduit: p.id_type_produit,
        dateAjoutProduit: p.date_ajout_produit,
        typeProduit: p.typeproduit ? {
          idTypeProduit: p.typeproduit.id_type_produit,
          nomTypeProduit: p.typeproduit.nom_type_produit,
          descriptionTypeProduit: p.typeproduit.description_type_produit,
        } : undefined,
      }));
  },
};