/**
 * ============================================================================
 *  Mock API Transport Layer (in-memory database)
 * ============================================================================
 *  Simulates the Express.js + MySQL backend so the entire app runs
 *  end-to-end without a server. When `USE_MOCK_API` is false, the service
 *  layer switches to real `fetch` calls against `API_BASE_URL`.
 *
 *  Each "table" is an array mirroring the MySQL schema. All service files
 *  call `mockRequest()` which simulates network latency.
 * ============================================================================
 */
import type {
  TypeProduit,
  Produit,
  Client,
  Compte,
  Panier,
  Regrouper,
  Commande,
  LigneCommande,
  Livraison,
  LigneLivraison,
  Vente,
  LigneVente,
} from "./types";

/* ------------------------------------------------------------------ */
/*  SEED DATA — TYPEPRODUIT                                            */
/* ------------------------------------------------------------------ */
export const typeProduits: TypeProduit[] = [
  { idTypeProduit: 1, nomTypeProduit: "Piments & Poivres", descriptionTypeProduit: "Piments secs, poivres de Penja et d'Afrique" },
  { idTypeProduit: 2, nomTypeProduit: "Épices & Graines", descriptionTypeProduit: "Clou de girofle, ail, curcuma, gingembre, épices locales" },
  { idTypeProduit: 3, nomTypeProduit: "Herbes Aromatiques", descriptionTypeProduit: "Romarin, coriandre, fenouil, anis, herbes de Provence" },
  { idTypeProduit: 4, nomTypeProduit: "Mélanges & Spécialités", descriptionTypeProduit: "Mbongo, Ndjansan, mélanges traditionnels camerounais" },
  { idTypeProduit: 5, nomTypeProduit: "Légumes Secs", descriptionTypeProduit: "Lentilles et légumineuses secs" },
];

/* ------------------------------------------------------------------ */
/*  SEED DATA — PRODUIT                                                */
/* ------------------------------------------------------------------ */
const img = (id: string) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=600`;

export const produits: Produit[] = [
  // --- Piments & Poivres ---
  { idProduit: 1, idTypeProduit: 1, nomProduit: "Piment Sec", descriptionProduit: "Piment fort séché, idéal pour relever tous vos plats. Arôme intense et chaleur persistante.", prixProduit: 1000, quantiteStockProduit: 80, seuilAlertProduit: 15, imageProduit: img("1340116"), statutProduit: "actif", dateAjoutProduit: "2025-01-10" },
  { idProduit: 2, idTypeProduit: 1, nomProduit: "Poivre Blanc de Penja", descriptionProduit: "Poivre blanc de Penja, appellation d'origine du Cameroun. Saveur douce et boisée, prisé mondialement.", prixProduit: 5000, quantiteStockProduit: 45, seuilAlertProduit: 10, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-01-12" },
  { idProduit: 3, idTypeProduit: 1, nomProduit: "Rondelle", descriptionProduit: "Rondelle de piment séché, prête à l'emploi pour sauces et bouillons.", prixProduit: 1200, quantiteStockProduit: 60, seuilAlertProduit: 12, imageProduit: img("1340116"), statutProduit: "actif", dateAjoutProduit: "2025-01-14" },
  { idProduit: 4, idTypeProduit: 1, nomProduit: "Poivre Long Africain", descriptionProduit: "Poivre long d'Afrique, saveur piquante et légèrement sucrée. Rare et traditionnel.", prixProduit: 3500, quantiteStockProduit: 30, seuilAlertProduit: 8, imageProduit: img("4198933"), statutProduit: "actif", dateAjoutProduit: "2025-01-15" },
  { idProduit: 5, idTypeProduit: 1, nomProduit: "Poivre Noir de Penja", descriptionProduit: "Poivre noir de Penja, grains entiers séchés au soleil. Arôme puissant et corsé.", prixProduit: 4500, quantiteStockProduit: 50, seuilAlertProduit: 10, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-01-16" },
  { idProduit: 6, idTypeProduit: 1, nomProduit: "Poivre Noir du Village (Sop)", descriptionProduit: "Poivre noir du village Sop, variété locale traditionnelle. Goût authentique du terroir.", prixProduit: 3000, quantiteStockProduit: 35, seuilAlertProduit: 8, imageProduit: img("4198933"), statutProduit: "actif", dateAjoutProduit: "2025-01-17" },

  // --- Épices & Graines ---
  { idProduit: 7, idTypeProduit: 2, nomProduit: "Pèbè", descriptionProduit: "Pèbè (graine de paradis), épice traditionnelle camerounaise au goût unique. Pour sauces et ragoûts.", prixProduit: 2500, quantiteStockProduit: 40, seuilAlertProduit: 10, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-01-18" },
  { idProduit: 8, idTypeProduit: 2, nomProduit: "Clou de Girofle", descriptionProduit: "Clous de girofle entiers, arôme chaud et épicé. Pour bouillons, thé et desserts.", prixProduit: 2000, quantiteStockProduit: 70, seuilAlertProduit: 15, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-19" },
  { idProduit: 9, idTypeProduit: 2, nomProduit: "Ail Sec", descriptionProduit: "Ail séché, gousses entières. Saveur concentrée pour toutes vos préparations culinaires.", prixProduit: 1500, quantiteStockProduit: 100, seuilAlertProduit: 20, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-20" },
  { idProduit: 10, idTypeProduit: 2, nomProduit: "Curcuma (Tumeric)", descriptionProduit: "Curcuma en poudre, couleur dorée et bienfaits anti-inflammatoires. Pour curry et plats colorés.", prixProduit: 1800, quantiteStockProduit: 65, seuilAlertProduit: 12, imageProduit: img("4198933"), statutProduit: "actif", dateAjoutProduit: "2025-01-21" },
  { idProduit: 11, idTypeProduit: 2, nomProduit: "Gingembre Sec", descriptionProduit: "Gingembre séché, racine entière. Pour infusions, plats épicés et bienfaits digestifs.", prixProduit: 1600, quantiteStockProduit: 55, seuilAlertProduit: 12, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-22" },
  { idProduit: 12, idTypeProduit: 2, nomProduit: "Nep-Nep", descriptionProduit: "Nep-Nep (graine de ricin), épice traditionnelle africaine. Pour épaissir sauces et ragoûts.", prixProduit: 2200, quantiteStockProduit: 25, seuilAlertProduit: 8, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-01-23" },

  // --- Herbes Aromatiques ---
  { idProduit: 13, idTypeProduit: 3, nomProduit: "Anis Vert", descriptionProduit: "Graines d'anis vert séchées, parfum doux et rafraîchissant. Pour infusions et pâtisseries.", prixProduit: 1800, quantiteStockProduit: 40, seuilAlertProduit: 10, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-24" },
  { idProduit: 14, idTypeProduit: 3, nomProduit: "Fenouil", descriptionProduit: "Graines de fenouil séchées, saveur anisée. Pour cuisine méditerranéenne et tisanes.", prixProduit: 1700, quantiteStockProduit: 35, seuilAlertProduit: 8, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-25" },
  { idProduit: 15, idTypeProduit: 3, nomProduit: "Coriandre", descriptionProduit: "Graines de coriandre séchées, agrume et chaud. Pour currys, pickles et marinades.", prixProduit: 1500, quantiteStockProduit: 50, seuilAlertProduit: 10, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-26" },
  { idProduit: 16, idTypeProduit: 3, nomProduit: "Romarin", descriptionProduit: "Romarin séché, herbe aromatique pour viandes rôties, pommes de terre et marinades.", prixProduit: 1400, quantiteStockProduit: 45, seuilAlertProduit: 10, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-27" },
  { idProduit: 17, idTypeProduit: 3, nomProduit: "4 Côtés", descriptionProduit: "4 Côtés (quatre épices), mélange de poivre, clou, cannelle et muscade. Pour plats mijotés.", prixProduit: 2000, quantiteStockProduit: 30, seuilAlertProduit: 8, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-01-28" },
  { idProduit: 18, idTypeProduit: 3, nomProduit: "Herbe de Provence", descriptionProduit: "Mélange d'herbes de Provence: thym, romarin, origan, sarriette. Pour cuisine méditerranéenne.", prixProduit: 1600, quantiteStockProduit: 40, seuilAlertProduit: 10, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-01-29" },

  // --- Mélanges & Spécialités ---
  { idProduit: 19, idTypeProduit: 4, nomProduit: "Bisson", descriptionProduit: "Bisson, épice traditionnelle camerounaise pour la préparation du ndolè et autres plats locaux.", prixProduit: 2500, quantiteStockProduit: 28, seuilAlertProduit: 8, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-01-30" },
  { idProduit: 20, idTypeProduit: 4, nomProduit: "Mbongo", descriptionProduit: "Mbongo, mélange d'épices traditionnel du Cameroun. Pour le célèbre mbongo tchobi.", prixProduit: 3000, quantiteStockProduit: 22, seuilAlertProduit: 6, imageProduit: img("4198933"), statutProduit: "actif", dateAjoutProduit: "2025-02-01" },
  { idProduit: 21, idTypeProduit: 4, nomProduit: "Mbongo sans queue", descriptionProduit: "Mbongo sans queue, variante du mbongo traditionnel, sans queue de poisson. Goût authentique.", prixProduit: 2800, quantiteStockProduit: 20, seuilAlertProduit: 6, imageProduit: img("4198933"), statutProduit: "actif", dateAjoutProduit: "2025-02-02" },
  { idProduit: 22, idTypeProduit: 4, nomProduit: "Ndjansan", descriptionProduit: "Ndjansan (graine de njangsa), épice locale pour épaissir et parfumer sauces traditionnelles.", prixProduit: 2500, quantiteStockProduit: 25, seuilAlertProduit: 8, imageProduit: img("4198928"), statutProduit: "actif", dateAjoutProduit: "2025-02-03" },

  // --- Légumes Secs ---
  { idProduit: 23, idTypeProduit: 5, nomProduit: "Lentille", descriptionProduit: "Lentilles sèches, riches en protéines et fibres. Pour soupes, salades et plats végétariens.", prixProduit: 2000, quantiteStockProduit: 60, seuilAlertProduit: 15, imageProduit: img("4198015"), statutProduit: "actif", dateAjoutProduit: "2025-02-04" },
];

/* ------------------------------------------------------------------ */
/*  SEED DATA — CLIENT & COMPTE                                        */
/* ------------------------------------------------------------------ */
export const clients: Client[] = [
  { idClient: 1, nomClient: "Admin", prenomClient: "Verhojust", telephoneClient: "+237600000000", emailClient: "admin@verhojust.cm", adresseClient: "Mfoundi Mall", villeClient: "Yaoundé", dateInscription: "2025-01-01" },
  { idClient: 2, nomClient: "Nkomo", prenomClient: "Aline", telephoneClient: "+237699112233", emailClient: "aline@example.com", adresseClient: "Quartier Bastos", villeClient: "Yaoundé", dateInscription: "2025-02-01" },
];

export const comptes: Compte[] = [
  { idCompte: 1, idClient: 1, loginCompte: "admin@verhojust.cm", motDePasseCompte: "admin123", roleCompte: "admin", dateCreationCompte: "2025-01-01" },
  { idCompte: 2, idClient: 2, loginCompte: "aline@example.com", motDePasseCompte: "client123", roleCompte: "client", dateCreationCompte: "2025-02-01" },
];

/* ------------------------------------------------------------------ */
/*  RUNTIME TABLES                                                     */
/* ------------------------------------------------------------------ */
export const paniers: Panier[] = [
  { idPanier: 1, idClient: 2, dateCreationPanier: "2025-02-01", statutPanier: "actif" },
];
export const regrouper: Regrouper[] = [];
export const commandes: Commande[] = [];
export const ligneCommandes: LigneCommande[] = [];
export const livraisons: Livraison[] = [];
export const ligneLivraisons: LigneLivraison[] = [];
export const ventes: Vente[] = [];
export const ligneVentes: LigneVente[] = [];

/* ------------------------------------------------------------------ */
/*  AUTO-INCREMENT COUNTERS                                            */
/* ------------------------------------------------------------------ */
export const counters = {
  typeProduit: 6,
  produit: 24,
  client: 3,
  compte: 3,
  panier: 2,
  commande: 1,
  ligneCommande: 1,
  livraison: 1,
  ligneLivraison: 1,
  vente: 1,
  ligneVente: 1,
};

/* ------------------------------------------------------------------ */
/*  SIMULATED NETWORK REQUEST                                          */
/* ------------------------------------------------------------------ */
export function mockRequest<T>(data: T, delay = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

export function nextId(key: keyof typeof counters): number {
  return counters[key]++;
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace("T", " ");
}