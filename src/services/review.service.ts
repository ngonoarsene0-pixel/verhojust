/**
 * ============================================================================
 *  Review Service — handles AVIS table (Supabase)
 * ============================================================================
 *  Product reviews: fetch by product, create new review, compute average.
 * ============================================================================
 */
import { supabase } from "../lib/supabase";
import type { Avis } from "../lib/types";

interface AvisRow {
  id_avis: number;
  id_produit: number;
  id_client: number | null;
  nom_auteur: string;
  note_avis: number;
  commentaire_avis: string;
  date_avis: string;
}

function mapAvis(row: AvisRow): Avis {
  return {
    idAvis: row.id_avis,
    idProduit: row.id_produit,
    idClient: row.id_client,
    nomAuteur: row.nom_auteur,
    noteAvis: row.note_avis,
    commentaireAvis: row.commentaire_avis,
    dateAvis: row.date_avis,
  };
}

export const reviewService = {
  async getByProduct(idProduit: number): Promise<Avis[]> {
    const { data, error } = await supabase
      .from("avis")
      .select("*")
      .eq("id_produit", idProduit)
      .order("date_avis", { ascending: false });
    if (error) throw new Error(error.message);
    return (data as AvisRow[]).map(mapAvis);
  },

  async create(data: Omit<Avis, "idAvis" | "dateAvis">): Promise<Avis> {
    const { data: row, error } = await supabase
      .from("avis")
      .insert({
        id_produit: data.idProduit,
        id_client: data.idClient,
        nom_auteur: data.nomAuteur,
        note_avis: data.noteAvis,
        commentaire_avis: data.commentaireAvis,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapAvis(row as AvisRow);
  },

  getAverage(reviews: Avis[]): number {
    if (reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.noteAvis, 0) / reviews.length;
  },
};
