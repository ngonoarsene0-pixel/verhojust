/**
 * ============================================================================
 * Database Schema Types — mapped 1:1 to the MySQL tables
 * ============================================================================
 * CLIENT, COMPTE, COMMANDE, LIGNECOMMANDE, LIVRAISON, LIGNELIVRAISON,
 * PANIER, REGROUPER, PRODUIT, TYPEPRODUIT, VENTE, LIGNEVENTE
 * ============================================================================
 */

/* ----------------------------- TYPEPRODUIT ----------------------------- */
export interface TypeProduit {
  idTypeProduit: number;
  nomTypeProduit: string;
  descriptionTypeProduit?: string;
}

/* ------------------------------- PRODUIT ------------------------------- */
export interface Produit {
  idProduit: number;
  idTypeProduit: number;
  nomProduit: string;
  descriptionProduit: string;
  prixProduit: number;
  quantiteStockProduit: number;
  seuilAlertProduit: number;
  imageProduit: string;
  statutProduit?: "actif" | "inactif";
  dateAjoutProduit: string;
}

/* -------------------------------- CLIENT ------------------------------- */
export interface Client {
  idClient: number;
  nomClient: string;
  prenomClient: string;
  telephoneClient: string;
  emailClient: string;
  adresseClient: string;
  villeClient: string;
  dateInscription: string;
}

/* --------------------------------- COMPTE ------------------------------ */
export interface Compte {
  idCompte: number;
  idClient: number;
  loginCompte: string;
  motDePasseCompte: string;
  roleCompte: "admin" | "client";
  dateCreationCompte: string;
}

/* -------------------------------- PANIER ------------------------------- */
export interface Panier {
  idPanier: number;
  idClient: number;
  dateCreationPanier: string;
  statutPanier: "actif" | "commande" | "abandonne";
}

/* ------------------------------- REGROUPER ----------------------------- */
/** Join table PANIER ↔ PRODUIT (cart line items) */
export interface Regrouper {
  idPanier: number;
  idProduit: number;
  quantiteProduit: number;
}

/* ------------------------------- COMMANDE ------------------------------ */
export interface Commande {
  idCommande: number;
  idClient: number;
  dateCommande: string;
  statutCommande: "en_attente" | "confirmee" | "preparation" | "expediee" | "livree" | "annulee";
  montantTotalCommande: number;
  adresseLivraisonCommande: string;
  modePaiementCommande: "especes" | "mobile_money" | "carte";
  referenceCommande: string;
}

/* ---------------------------- LIGNECOMMANDE ---------------------------- */
export interface LigneCommande {
  idLigneCommande: number;
  idCommande: number;
  idProduit: number;
  quantiteProduit: number;
  prixUnitaire: number;
}

/* ------------------------------- LIVRAISON ----------------------------- */
export interface Livraison {
  idLivraison: number;
  idCommande: number;
  dateLivraisonPrevue: string;
  dateLivraisonReelle: string | null;
  statutLivraison: "en_preparation" | "en_cours" | "livree" | "echouee" | "programmee";
  adresseLivraison: string;
  livreur: string;
  noteLivraison: string;
}

/* --------------------------- LIGNELIVRAISON ---------------------------- */
export interface LigneLivraison {
  idLigneLivraison: number;
  idLivraison: number;
  idProduit: number;
  quantiteProduit: number;
}

/* --------------------------------- VENTE ------------------------------- */
export interface Vente {
  idVente: number;
  idCommande: number;
  dateVente: string;
  montantTotalVente: number;
  modePaiementVente: "especes" | "mobile_money" | "carte";
  statutVente: "payee" | "en_attente_paiement" | "remboursee";
}

/* ------------------------------ LIGNEVENTE ----------------------------- */
export interface LigneVente {
  idLigneVente: number;
  idVente: number;
  idProduit: number;
  quantiteProduit: number;
  prixUnitaire: number;
}

/* ----------------------------- VIEW MODELS ----------------------------- */
export interface ProduitWithType extends Produit {
  typeProduit?: TypeProduit;
}

export interface CartItem {
  produit: Produit;
  quantiteProduit: number;
}

export interface CommandeWithDetails extends Commande {
  client?: Client;
  lignes?: (LigneCommande & { produit?: Produit })[];
  livraison?: Livraison;
  vente?: Vente;
}

/* -------------------------------- AVIS -------------------------------- */
export interface Avis {
  idAvis: number;
  idProduit: number;
  idClient: number | null;
  nomAuteur: string;
  noteAvis: number;
  commentaireAvis: string;
  dateAvis: string;
}

export interface AuthUser {
  compte: Compte;
  client: Client;
}