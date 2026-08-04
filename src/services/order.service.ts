import { supabase } from "../lib/supabase";
import type { CartItem, Commande, CommandeWithDetails, Vente } from "../lib/types";

export interface CreateOrderInput {
  idClient?: number;
  adresseLivraisonCommande: string;
  modePaiementCommande: "especes" | "mobile_money" | "carte";
  items: CartItem[];
  guestInfo?: {
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
  };
}

export const orderService = {
  async createOrder(input: CreateOrderInput): Promise<Commande> {
    let clientId = input.idClient;

    // Si le client n'est pas connecté ou si l'ID est 0/undefined, on crée un vrai profil client dans Supabase
    if ((!clientId || clientId === 0) && input.guestInfo) {
      const { data: newClient, error: clientError } = await supabase
        .from("client")
        .insert({
          nom_client: input.guestInfo.nom,
          prenom_client: input.guestInfo.prenom,
          email_client: input.guestInfo.email,
          telephone_client: input.guestInfo.telephone,
          adresse_client: input.adresseLivraisonCommande,
          ville_client: "Yaoundé",
        })
        .select("id_client")
        .single();

      if (clientError) throw clientError;
      clientId = newClient.id_client;
    }

    if (!clientId) {
      throw new Error("Impossible d'identifier ou de créer le client pour cette commande.");
    }

    // Calcul du sous-total des articles
    const sousTotal = input.items.reduce(
      (s, i) => s + i.produit.prixProduit * i.quantiteProduit,
      0
    );

    // Ajout des frais de livraison fixes (1000 FCFA)
    const fraisLivraison = 1000;
    const montantTotal = sousTotal + fraisLivraison;

    const ref = `VHJ-${Date.now().toString(36).toUpperCase()}`;

    const { data: commandeData, error: commandeError } = await supabase
      .from("commande")
      .insert({
        id_client: clientId,
        statut_commande: "en_attente",
        montant_total_commande: montantTotal,
        adresse_livraison_commande: input.adresseLivraisonCommande,
        mode_paiement_commande: input.modePaiementCommande,
        reference_commande: ref,
      })
      .select()
      .single();

    if (commandeError) throw commandeError;

    const commande: Commande = {
      idCommande: commandeData.id_commande,
      idClient: commandeData.id_client,
      dateCommande: commandeData.date_commande,
      statutCommande: commandeData.statut_commande,
      montantTotalCommande: commandeData.montant_total_commande,
      adresseLivraisonCommande: commandeData.adresse_livraison_commande,
      modePaiementCommande: commandeData.mode_paiement_commande,
      referenceCommande: commandeData.reference_commande,
    };

    for (const item of input.items) {
      const { error: ligneError } = await supabase.from("lignecommande").insert({
        id_commande: commande.idCommande,
        id_produit: item.produit.idProduit,
        quantite_produit: item.quantiteProduit,
        prix_unitaire: item.produit.prixProduit,
      });

      if (ligneError) throw ligneError;
    }

    return commande;
  },

  async finalizeSale(
    idCommande: number,
    modePaiement: "especes" | "mobile_money" | "carte"
  ): Promise<Vente> {
    const { data: commande, error: fetchError } = await supabase
      .from("commande")
      .select("*")
      .eq("id_commande", idCommande)
      .single();

    if (fetchError || !commande) throw new Error("Commande introuvable");

    const { data: venteData, error: venteError } = await supabase
      .from("vente")
      .insert({
        id_commande: idCommande,
        montant_total_vente: commande.montant_total_commande,
        mode_paiement_vente: modePaiement,
        statut_vente: "payee",
      })
      .select()
      .single();

    if (venteError) throw venteError;

    await supabase
      .from("commande")
      .update({ statut_commande: "confirmee" })
      .eq("id_commande", idCommande);

    return {
      idVente: venteData.id_vente,
      idCommande: venteData.id_commande,
      dateVente: venteData.date_vente,
      montantTotalVente: venteData.montant_total_vente,
      modePaiementVente: venteData.mode_paiement_vente,
      statutVente: venteData.statut_vente,
    };
  },

  async getClientOrders(idClient: number): Promise<CommandeWithDetails[]> {
    const { data: commandesData, error } = await supabase
      .from("commande")
      .select(`*, lignecommande(*, produit(*))`)
      .eq("id_client", idClient)
      .order("date_commande", { ascending: false });

    if (error) throw error;

    return (commandesData || []).map((c: any) => ({
      idCommande: c.id_commande,
      idClient: c.id_client,
      dateCommande: c.date_commande,
      statutCommande: c.statut_commande,
      montantTotalCommande: c.montant_total_commande,
      adresseLivraisonCommande: c.adresse_livraison_commande,
      modePaiementCommande: c.mode_paiement_commande,
      referenceCommande: c.reference_commande,
      lignes: (c.lignecommande || []).map((l: any) => ({
        idLigneCommande: l.id_ligne_commande,
        idCommande: l.id_commande,
        idProduit: l.id_produit,
        quantiteProduit: l.quantite_produit,
        prixUnitaire: l.prix_unitaire,
        produit: l.produit ? {
          idProduit: l.produit.id_produit,
          nomProduit: l.produit.nom_produit,
          descriptionProduit: l.produit.description_produit,
          prixProduit: l.produit.prix_produit,
          quantiteStockProduit: l.produit.quantite_stock_produit,
          imageProduit: l.produit.image_produit,
          idTypeProduit: l.produit.id_type_produit,
        } : undefined,
      })),
    }));
  },

  async getAllOrders(): Promise<CommandeWithDetails[]> {
    const { data: commandesData, error } = await supabase
      .from("commande")
      .select(`*, client(*), lignecommande(*, produit(*))`)
      .order("date_commande", { ascending: false });

    if (error) throw error;

    return (commandesData || []).map((c: any) => ({
      idCommande: c.id_commande,
      idClient: c.id_client,
      dateCommande: c.date_commande,
      statutCommande: c.statut_commande,
      montantTotalCommande: c.montant_total_commande,
      adresseLivraisonCommande: c.adresse_livraison_commande,
      modePaiementCommande: c.mode_paiement_commande,
      referenceCommande: c.reference_commande,
      client: c.client ? {
        idClient: c.client.id_client,
        nomClient: c.client.nom_client,
        prenomClient: c.client.prenom_client,
        telephoneClient: c.client.telephone_client,
        emailClient: c.client.email_client,
        adresseClient: c.client.adresse_client,
        villeClient: c.client.ville_client,
        dateInscription: c.client.date_inscription,
      } : undefined,
      lignes: (c.lignecommande || []).map((l: any) => ({
        idLigneCommande: l.id_ligne_commande,
        idCommande: l.id_commande,
        idProduit: l.id_produit,
        quantiteProduit: l.quantite_produit,
        prixUnitaire: l.prix_unitaire,
        produit: l.produit ? {
          idProduit: l.produit.id_produit,
          nomProduit: l.produit.nom_produit,
          descriptionProduit: l.produit.description_produit,
          prixProduit: l.produit.prix_produit,
          quantiteStockProduit: l.produit.quantite_stock_produit,
          imageProduit: l.produit.image_produit,
          idTypeProduit: l.produit.id_type_produit,
        } : undefined,
      })),
    }));
  },

  async updateOrderStatus(idCommande: number, statut: Commande["statutCommande"]): Promise<Commande> {
    const { data, error } = await supabase
      .from("commande")
      .update({ statut_commande: statut })
      .eq("id_commande", idCommande)
      .select()
      .single();

    if (error) throw error;

    return {
      idCommande: data.id_commande,
      idClient: data.id_client,
      dateCommande: data.date_commande,
      statutCommande: data.statut_commande,
      montantTotalCommande: data.montant_total_commande,
      adresseLivraisonCommande: data.adresse_livraison_commande,
      modePaiementCommande: data.mode_paiement_commande,
      referenceCommande: data.reference_commande,
    };
  },
};