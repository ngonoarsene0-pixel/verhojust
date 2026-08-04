/*
# VERHOJUST ÉPICERIE — Seed data
Populates the database with the same initial data that was in the mock layer:
5 product types, 23 products, 2 clients (1 admin + 1 customer), 2 accounts,
and 5 product reviews. This ensures the app has content on first load.

1. Data inserted
- typeproduit: 5 categories (Piments & Poivres, Épices & Graines, Herbes Aromatiques, Mélanges & Spécialités, Légumes Secs)
- produit: 23 products across all categories, with prices in FCFA, stock levels, and Pexels image URLs
- client: 2 clients (admin + Aline Nkomo)
- compte: 2 accounts (admin@verhojust.cm / admin123, aline@example.com / client123)
- avis: 5 reviews on various products

2. Security
- No security changes — uses existing RLS policies from the schema migration.

3. Important Notes
- Uses ON CONFLICT DO NOTHING so re-running is safe (idempotent).
- Explicit IDs are set to match the mock data so existing references stay consistent.
*/

-- TYPEPRODUIT
INSERT INTO typeproduit (id_type_produit, nom_type_produit, description_type_produit) VALUES
  (1, 'Piments & Poivres', 'Piments secs, poivres de Penja et d''Afrique'),
  (2, 'Épices & Graines', 'Clou de girofle, ail, curcuma, gingembre, épices locales'),
  (3, 'Herbes Aromatiques', 'Romarin, coriandre, fenouil, anis, herbes de Provence'),
  (4, 'Mélanges & Spécialités', 'Mbongo, Ndjansan, mélanges traditionnels camerounais'),
  (5, 'Légumes Secs', 'Lentilles et légumineuses secs')
ON CONFLICT (id_type_produit) DO NOTHING;

-- PRODUIT
INSERT INTO produit (id_produit, id_type_produit, nom_produit, description_produit, prix_produit, quantite_stock_produit, seuil_alert_produit, image_produit, statut_produit, date_ajout_produit) VALUES
  (1, 1, 'Piment Sec', 'Piment fort séché, idéal pour relever tous vos plats. Arôme intense et chaleur persistante.', 1000, 80, 15, 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-10'),
  (2, 1, 'Poivre Blanc de Penja', 'Poivre blanc de Penja, appellation d''origine du Cameroun. Saveur douce et boisée, prisé mondialement.', 5000, 45, 10, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-12'),
  (3, 1, 'Rondelle', 'Rondelle de piment séché, prête à l''emploi pour sauces et bouillons.', 1200, 60, 12, 'https://images.pexels.com/photos/1340116/pexels-photo-1340116.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-14'),
  (4, 1, 'Poivre Long Africain', 'Poivre long d''Afrique, saveur piquante et légèrement sucrée. Rare et traditionnel.', 3500, 30, 8, 'https://images.pexels.com/photos/4198933/pexels-photo-4198933.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-15'),
  (5, 1, 'Poivre Noir de Penja', 'Poivre noir de Penja, grains entiers séchés au soleil. Arôme puissant et corsé.', 4500, 50, 10, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-16'),
  (6, 1, 'Poivre Noir du Village (Sop)', 'Poivre noir du village Sop, variété locale traditionnelle. Goût authentique du terroir.', 3000, 35, 8, 'https://images.pexels.com/photos/4198933/pexels-photo-4198933.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-17'),
  (7, 2, 'Pèbè', 'Pèbè (graine de paradis), épice traditionnelle camerounaise au goût unique. Pour sauces et ragoûts.', 2500, 40, 10, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-18'),
  (8, 2, 'Clou de Girofle', 'Clous de girofle entiers, arôme chaud et épicé. Pour bouillons, thé et desserts.', 2000, 70, 15, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-19'),
  (9, 2, 'Ail Sec', 'Ail séché, gousses entières. Saveur concentrée pour toutes vos préparations culinaires.', 1500, 100, 20, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-20'),
  (10, 2, 'Curcuma (Tumeric)', 'Curcuma en poudre, couleur dorée et bienfaits anti-inflammatoires. Pour curry et plats colorés.', 1800, 65, 12, 'https://images.pexels.com/photos/4198933/pexels-photo-4198933.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-21'),
  (11, 2, 'Gingembre Sec', 'Gingembre séché, racine entière. Pour infusions, plats épicés et bienfaits digestifs.', 1600, 55, 12, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-22'),
  (12, 2, 'Nep-Nep', 'Nep-Nep (graine de ricin), épice traditionnelle africaine. Pour épaissir sauces et ragoûts.', 2200, 25, 8, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-23'),
  (13, 3, 'Anis Vert', 'Graines d''anis vert séchées, parfum doux et rafraîchissant. Pour infusions et pâtisseries.', 1800, 40, 10, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-24'),
  (14, 3, 'Fenouil', 'Graines de fenouil séchées, saveur anisée. Pour cuisine méditerranéenne et tisanes.', 1700, 35, 8, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-25'),
  (15, 3, 'Coriandre', 'Graines de coriandre séchées, agrume et chaud. Pour currys, pickles et marinades.', 1500, 50, 10, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-26'),
  (16, 3, 'Romarin', 'Romarin séché, herbe aromatique pour viandes rôties, pommes de terre et marinades.', 1400, 45, 10, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-27'),
  (17, 3, '4 Côtés', '4 Côtés (quatre épices), mélange de poivre, clou, cannelle et muscade. Pour plats mijotés.', 2000, 30, 8, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-28'),
  (18, 3, 'Herbe de Provence', 'Mélange d''herbes de Provence: thym, romarin, origan, sarriette. Pour cuisine méditerranéenne.', 1600, 40, 10, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-29'),
  (19, 4, 'Bisson', 'Bisson, épice traditionnelle camerounaise pour la préparation du ndolè et autres plats locaux.', 2500, 28, 8, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-01-30'),
  (20, 4, 'Mbongo', 'Mbongo, mélange d''épices traditionnel du Cameroun. Pour le célèbre mbongo tchobi.', 3000, 22, 6, 'https://images.pexels.com/photos/4198933/pexels-photo-4198933.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-02-01'),
  (21, 4, 'Mbongo sans queue', 'Mbongo sans queue, variante du mbongo traditionnel, sans queue de poisson. Goût authentique.', 2800, 20, 6, 'https://images.pexels.com/photos/4198933/pexels-photo-4198933.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-02-02'),
  (22, 4, 'Ndjansan', 'Ndjansan (graine de njangsa), épice locale pour épaissir et parfumer sauces traditionnelles.', 2500, 25, 8, 'https://images.pexels.com/photos/4198928/pexels-photo-4198928.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-02-03'),
  (23, 5, 'Lentille', 'Lentilles sèches, riches en protéines et fibres. Pour soupes, salades et plats végétariens.', 2000, 60, 15, 'https://images.pexels.com/photos/4198015/pexels-photo-4198015.jpeg?auto=compress&cs=tinysrgb&w=600', 'actif', '2025-02-04')
ON CONFLICT (id_produit) DO NOTHING;

-- Reset sequences to avoid collisions with explicit IDs
SELECT setval('typeproduit_id_type_produit_seq', (SELECT MAX(id_type_produit) FROM typeproduit));
SELECT setval('produit_id_produit_seq', (SELECT MAX(id_produit) FROM produit));

-- CLIENT
INSERT INTO client (id_client, nom_client, prenom_client, telephone_client, email_client, adresse_client, ville_client, date_inscription) VALUES
  (1, 'Admin', 'Verhojust', '+237600000000', 'admin@verhojust.cm', 'Mfoundi Mall', 'Yaoundé', '2025-01-01'),
  (2, 'Nkomo', 'Aline', '+237699112233', 'aline@example.com', 'Quartier Bastos', 'Yaoundé', '2025-02-01')
ON CONFLICT (id_client) DO NOTHING;
SELECT setval('client_id_client_seq', (SELECT MAX(id_client) FROM client));

-- COMPTE
INSERT INTO compte (id_compte, id_client, login_compte, mot_de_passe_compte, role_compte, date_creation_compte) VALUES
  (1, 1, 'admin@verhojust.cm', 'admin123', 'admin', '2025-01-01'),
  (2, 2, 'aline@example.com', 'client123', 'client', '2025-02-01')
ON CONFLICT (id_compte) DO NOTHING;
SELECT setval('compte_id_compte_seq', (SELECT MAX(id_compte) FROM compte));

-- AVIS
INSERT INTO avis (id_avis, id_produit, id_client, nom_auteur, note_avis, commentaire_avis, date_avis) VALUES
  (1, 2, 2, 'Aline N.', 5, 'Poivre exceptionnel, saveur unique. Je recommande vivement!', '2025-02-10'),
  (2, 2, NULL, 'Client', 4, 'Très bon poivre, livraison rapide à Douala.', '2025-02-15'),
  (3, 8, 2, 'Aline N.', 5, 'Clous de girofle parfumés, parfaits pour le thé.', '2025-02-20'),
  (4, 1, NULL, 'Marc', 4, 'Piment fort de qualité, bien séché.', '2025-03-01'),
  (5, 20, NULL, 'Sandra', 5, 'Le mbongo a transformé mon plat! Goût authentique.', '2025-03-05')
ON CONFLICT (id_avis) DO NOTHING;
SELECT setval('avis_id_avis_seq', (SELECT MAX(id_avis) FROM avis));
