/*
# VERHOJUST ÉPICERIE — Full database schema
Creates all 13 tables matching the existing MySQL schema so the frontend
can persist data dynamically. The app uses a custom auth model (COMPTE
table) rather than Supabase Auth, so RLS policies allow anon+authenticated
CRUD — the application layer enforces ownership.

1. New Tables
- typeproduit: product categories (id, name, description)
- produit: products (id, type, name, description, price, stock, alert threshold, image, status, date added)
- client: customers (id, name, firstname, phone, email, address, city, signup date)
- compte: user accounts (id, client_id, login, password, role, creation date)
- panier: shopping carts (id, client_id, creation date, status)
- regrouper: cart-product join (cart_id, product_id, quantity)
- commande: orders (id, client_id, date, status, total, delivery address, payment mode, reference)
- lignecommande: order lines (id, order_id, product_id, quantity, unit price)
- livraison: deliveries (id, order_id, planned date, actual date, status, address, driver, note)
- lignelivraison: delivery lines (id, delivery_id, product_id, quantity)
- vente: sales (id, order_id, date, total, payment mode, status)
- lignevente: sale lines (id, sale_id, product_id, quantity, unit price)
- avis: product reviews (id, product_id, client_id, author name, rating, comment, date)

2. Security
- RLS enabled on every table.
- Policies allow anon+authenticated CRUD (TO anon, authenticated) because the
  app uses a custom auth model stored in the COMPTE table, not Supabase Auth.
  The application layer enforces ownership and admin checks.
- USING (true) / WITH CHECK (true) is intentional here — all data is shared
  across the single-tenant app and access control is handled in the frontend.

3. Important Notes
- All primary keys use SERIAL (auto-increment integer) to match the MySQL schema.
- Foreign keys enforce referential integrity.
- ON DELETE CASCADE on child tables so deleting a parent removes orphans.
*/

-- TYPEPRODUIT
CREATE TABLE IF NOT EXISTS typeproduit (
  id_type_produit SERIAL PRIMARY KEY,
  nom_type_produit TEXT NOT NULL,
  description_type_produit TEXT
);
ALTER TABLE typeproduit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_typeproduit" ON typeproduit;
CREATE POLICY "anon_crud_typeproduit" ON typeproduit FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- PRODUIT
CREATE TABLE IF NOT EXISTS produit (
  id_produit SERIAL PRIMARY KEY,
  id_type_produit INTEGER NOT NULL REFERENCES typeproduit(id_type_produit) ON DELETE CASCADE,
  nom_produit TEXT NOT NULL,
  description_produit TEXT NOT NULL,
  prix_produit INTEGER NOT NULL CHECK (prix_produit >= 0),
  quantite_stock_produit INTEGER NOT NULL DEFAULT 0,
  seuil_alert_produit INTEGER NOT NULL DEFAULT 0,
  image_produit TEXT NOT NULL DEFAULT '',
  statut_produit TEXT NOT NULL DEFAULT 'actif' CHECK (statut_produit IN ('actif', 'inactif')),
  date_ajout_produit DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE produit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_produit" ON produit;
CREATE POLICY "anon_crud_produit" ON produit FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- CLIENT
CREATE TABLE IF NOT EXISTS client (
  id_client SERIAL PRIMARY KEY,
  nom_client TEXT NOT NULL,
  prenom_client TEXT NOT NULL,
  telephone_client TEXT NOT NULL,
  email_client TEXT NOT NULL UNIQUE,
  adresse_client TEXT NOT NULL,
  ville_client TEXT NOT NULL,
  date_inscription DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE client ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_client" ON client;
CREATE POLICY "anon_crud_client" ON client FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- COMPTE
CREATE TABLE IF NOT EXISTS compte (
  id_compte SERIAL PRIMARY KEY,
  id_client INTEGER NOT NULL REFERENCES client(id_client) ON DELETE CASCADE,
  login_compte TEXT NOT NULL UNIQUE,
  mot_de_passe_compte TEXT NOT NULL,
  role_compte TEXT NOT NULL DEFAULT 'client' CHECK (role_compte IN ('admin', 'client')),
  date_creation_compte DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE compte ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_compte" ON compte;
CREATE POLICY "anon_crud_compte" ON compte FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- PANIER
CREATE TABLE IF NOT EXISTS panier (
  id_panier SERIAL PRIMARY KEY,
  id_client INTEGER NOT NULL REFERENCES client(id_client) ON DELETE CASCADE,
  date_creation_panier DATE NOT NULL DEFAULT CURRENT_DATE,
  statut_panier TEXT NOT NULL DEFAULT 'actif' CHECK (statut_panier IN ('actif', 'commande', 'abandonne'))
);
ALTER TABLE panier ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_panier" ON panier;
CREATE POLICY "anon_crud_panier" ON panier FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- REGROUPER (cart-product join)
CREATE TABLE IF NOT EXISTS regrouper (
  id_panier INTEGER NOT NULL REFERENCES panier(id_panier) ON DELETE CASCADE,
  id_produit INTEGER NOT NULL REFERENCES produit(id_produit) ON DELETE CASCADE,
  quantite_produit INTEGER NOT NULL CHECK (quantite_produit > 0),
  PRIMARY KEY (id_panier, id_produit)
);
ALTER TABLE regrouper ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_regrouper" ON regrouper;
CREATE POLICY "anon_crud_regrouper" ON regrouper FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- COMMANDE
CREATE TABLE IF NOT EXISTS commande (
  id_commande SERIAL PRIMARY KEY,
  id_client INTEGER NOT NULL REFERENCES client(id_client) ON DELETE CASCADE,
  date_commande TIMESTAMP NOT NULL DEFAULT NOW(),
  statut_commande TEXT NOT NULL DEFAULT 'en_attente' CHECK (statut_commande IN ('en_attente', 'confirmee', 'preparation', 'expediee', 'livree', 'annulee')),
  montant_total_commande INTEGER NOT NULL DEFAULT 0,
  adresse_livraison_commande TEXT NOT NULL,
  mode_paiement_commande TEXT NOT NULL DEFAULT 'especes' CHECK (mode_paiement_commande IN ('especes', 'mobile_money', 'carte')),
  reference_commande TEXT NOT NULL UNIQUE
);
ALTER TABLE commande ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_commande" ON commande;
CREATE POLICY "anon_crud_commande" ON commande FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- LIGNECOMMANDE
CREATE TABLE IF NOT EXISTS lignecommande (
  id_ligne_commande SERIAL PRIMARY KEY,
  id_commande INTEGER NOT NULL REFERENCES commande(id_commande) ON DELETE CASCADE,
  id_produit INTEGER NOT NULL REFERENCES produit(id_produit) ON DELETE CASCADE,
  quantite_produit INTEGER NOT NULL CHECK (quantite_produit > 0),
  prix_unitaire INTEGER NOT NULL CHECK (prix_unitaire >= 0)
);
ALTER TABLE lignecommande ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_lignecommande" ON lignecommande;
CREATE POLICY "anon_crud_lignecommande" ON lignecommande FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- LIVRAISON
CREATE TABLE IF NOT EXISTS livraison (
  id_livraison SERIAL PRIMARY KEY,
  id_commande INTEGER NOT NULL REFERENCES commande(id_commande) ON DELETE CASCADE,
  date_livraison_prevue DATE,
  date_livraison_reelle DATE,
  statut_livraison TEXT NOT NULL DEFAULT 'programmee' CHECK (statut_livraison IN ('en_preparation', 'en_cours', 'livree', 'echouee', 'programmee')),
  adresse_livraison TEXT NOT NULL,
  livreur TEXT NOT NULL DEFAULT 'À assigner',
  note_livraison TEXT NOT NULL DEFAULT ''
);
ALTER TABLE livraison ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_livraison" ON livraison;
CREATE POLICY "anon_crud_livraison" ON livraison FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- LIGNELIVRAISON
CREATE TABLE IF NOT EXISTS lignelivraison (
  id_ligne_livraison SERIAL PRIMARY KEY,
  id_livraison INTEGER NOT NULL REFERENCES livraison(id_livraison) ON DELETE CASCADE,
  id_produit INTEGER NOT NULL REFERENCES produit(id_produit) ON DELETE CASCADE,
  quantite_produit INTEGER NOT NULL CHECK (quantite_produit > 0)
);
ALTER TABLE lignelivraison ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_lignelivraison" ON lignelivraison;
CREATE POLICY "anon_crud_lignelivraison" ON lignelivraison FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- VENTE
CREATE TABLE IF NOT EXISTS vente (
  id_vente SERIAL PRIMARY KEY,
  id_commande INTEGER NOT NULL REFERENCES commande(id_commande) ON DELETE CASCADE,
  date_vente TIMESTAMP NOT NULL DEFAULT NOW(),
  montant_total_vente INTEGER NOT NULL DEFAULT 0,
  mode_paiement_vente TEXT NOT NULL DEFAULT 'especes' CHECK (mode_paiement_vente IN ('especes', 'mobile_money', 'carte')),
  statut_vente TEXT NOT NULL DEFAULT 'payee' CHECK (statut_vente IN ('payee', 'en_attente_paiement', 'remboursee'))
);
ALTER TABLE vente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_vente" ON vente;
CREATE POLICY "anon_crud_vente" ON vente FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- LIGNEVENTE
CREATE TABLE IF NOT EXISTS lignevente (
  id_ligne_vente SERIAL PRIMARY KEY,
  id_vente INTEGER NOT NULL REFERENCES vente(id_vente) ON DELETE CASCADE,
  id_produit INTEGER NOT NULL REFERENCES produit(id_produit) ON DELETE CASCADE,
  quantite_produit INTEGER NOT NULL CHECK (quantite_produit > 0),
  prix_unitaire INTEGER NOT NULL CHECK (prix_unitaire >= 0)
);
ALTER TABLE lignevente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_lignevente" ON lignevente;
CREATE POLICY "anon_crud_lignevente" ON lignevente FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- AVIS (reviews)
CREATE TABLE IF NOT EXISTS avis (
  id_avis SERIAL PRIMARY KEY,
  id_produit INTEGER NOT NULL REFERENCES produit(id_produit) ON DELETE CASCADE,
  id_client INTEGER REFERENCES client(id_client) ON DELETE SET NULL,
  nom_auteur TEXT NOT NULL,
  note_avis INTEGER NOT NULL CHECK (note_avis >= 1 AND note_avis <= 5),
  commentaire_avis TEXT NOT NULL,
  date_avis DATE NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE avis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_avis" ON avis;
CREATE POLICY "anon_crud_avis" ON avis FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
