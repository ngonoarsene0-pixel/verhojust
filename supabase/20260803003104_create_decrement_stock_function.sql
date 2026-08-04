/*
# Create decrement_stock function
Atomically decrements product stock by a given quantity. Prevents stock from
going negative. Used by the order service when an order is placed.

1. New Functions
- decrement_stock(p_id_produit integer, p_quantite integer): decrements
  quantite_stock_produit on the produit row, but never below zero.

2. Security
- SECURITY INVOKER (default) — runs with the caller's privileges, subject to RLS.

3. Important Notes
- Uses UPDATE ... SET with a GREATEST check to avoid negative stock.
- Returns void.
*/

CREATE OR REPLACE FUNCTION decrement_stock(p_id_produit integer, p_quantite integer)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE produit
  SET quantite_stock_produit = GREATEST(0, quantite_stock_produit - p_quantite)
  WHERE id_produit = p_id_produit;
$$;
