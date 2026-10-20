import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { formatPrice } from "../lib/format";
import { BUSINESS } from "../lib/db";

interface CartPageProps {
  currentLang?: "FR" | "EN";
}

export default function CartPage({ currentLang = "FR" }: CartPageProps) {
  const { items, loading, refresh, updateQuantity, removeFromCart, clearCart, totalAmount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/4" />
          <div className="h-32 bg-neutral-200 rounded-2xl" />
          <div className="h-32 bg-neutral-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-10 h-10 text-neutral-300" />
        </div>
        <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
          {currentLang === "FR" ? "Votre panier est vide" : "Your cart is empty"}
        </h2>
        <p className="text-neutral-500 mb-6">
          {currentLang === "FR"
            ? "Parcourez notre catalogue et ajoutez vos produits préférés."
            : "Browse our catalog and add your favorite products."}
        </p>
        <Link to="/catalogue" className="btn-primary">
          {currentLang === "FR" ? "Explorer le catalogue" : "Browse catalog"} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const deliveryFee = totalAmount >= BUSINESS.freeDeliveryThreshold ? 0 : BUSINESS.deliveryFee;
  const grandTotal = totalAmount + deliveryFee;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900">
          {currentLang === "FR" ? "Mon Panier" : "My Cart"}
        </h1>
        <button
          onClick={() => clearCart()}
          className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
        >
          <Trash2 className="w-4 h-4" /> {currentLang === "FR" ? "Vider le panier" : "Clear cart"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Liste des articles */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const isKilo = item.typeAchat === "kilo";
            const price = isKilo
              ? (item.produit.prixKiloProduit || 0)
              : (item.produit.prixBoiteProduit || 0);

            const unitLabel = isKilo
              ? (currentLang === "FR" ? "kg" : "kg")
              : (currentLang === "FR" ? "boîte" : "box");

            const badgeLabel = isKilo
              ? "Kg"
              : (currentLang === "FR" ? "Boîte" : "Box");

            return (
              <div
                key={`${item.produit.idProduit}-${item.typeAchat || "boite"}`}
                className="card p-4 flex gap-4 items-center"
              >
                <Link
                  to={`/produit/${item.produit.idProduit}`}
                  className="shrink-0"
                >
                  <img
                    src={item.produit.imageProduit}
                    alt={item.produit.nomProduit}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/produit/${item.produit.idProduit}`}
                      className="font-semibold text-sm text-neutral-900 hover:text-primary-700 line-clamp-1"
                    >
                      {item.produit.nomProduit}
                    </Link>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      isKilo ? "bg-amber-100 text-amber-800" : "bg-primary-100 text-primary-800"
                    }`}>
                      {badgeLabel}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-500 mb-2">
                    {formatPrice(price)} / {unitLabel}
                  </p>

                  <div className="flex items-center gap-2">
                    {/* Contrôle de Quantité : Boutons + Input Numérique Direct */}
                    <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
                      <button
                        onClick={() => {
                          const newQty = item.quantiteProduit - 1;
                          if (newQty <= 0) {
                            removeFromCart(item.produit.idProduit, item.typeAchat);
                          } else {
                            updateQuantity(item.produit.idProduit, newQty, item.typeAchat);
                          }
                        }}
                        className="p-1.5 hover:bg-neutral-100 transition-colors text-neutral-700"
                        title="Diminuer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="1"
                        max={item.produit.quantiteStockProduit}
                        value={item.quantiteProduit}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val) || val <= 0) {
                            removeFromCart(item.produit.idProduit, item.typeAchat);
                          } else if (val > item.produit.quantiteStockProduit) {
                            updateQuantity(item.produit.idProduit, item.produit.quantiteStockProduit, item.typeAchat);
                          } else {
                            updateQuantity(item.produit.idProduit, val, item.typeAchat);
                          }
                        }}
                        className="w-12 text-center font-bold text-sm py-1 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-neutral-900"
                      />

                      <button
                        onClick={() =>
                          updateQuantity(item.produit.idProduit, item.quantiteProduit + 1, item.typeAchat)
                        }
                        disabled={item.quantiteProduit >= item.produit.quantiteStockProduit}
                        className="p-1.5 hover:bg-neutral-100 transition-colors disabled:opacity-40 text-neutral-700"
                        title="Augmenter"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-medium text-neutral-500 mr-2">
                      {unitLabel}
                    </span>

                    {/* Bouton pour tout effacer / supprimer la ligne */}
                    <button
                      onClick={() => removeFromCart(item.produit.idProduit, item.typeAchat)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={currentLang === "FR" ? "Supprimer du panier" : "Remove item"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-display font-bold text-lg text-primary-700">
                    {formatPrice(price * item.quantiteProduit)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Récapitulatif du total */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-neutral-900 mb-4">
              {currentLang === "FR" ? "Récapitulatif" : "Summary"}
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>
                  {currentLang === "FR"
                    ? `Sous-total (${items.length} article(s))`
                    : `Subtotal (${items.length} item(s))`}
                </span>
                <span className="font-semibold text-neutral-900">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>{currentLang === "FR" ? "Frais de livraison" : "Delivery fee"}</span>
                <span className="font-semibold text-neutral-900">
                  {deliveryFee === 0
                    ? currentLang === "FR" ? "Gratuit" : "Free"
                    : formatPrice(deliveryFee)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-neutral-400 bg-neutral-50 rounded-lg p-2">
                  {currentLang === "FR"
                    ? `Ajoutez ${formatPrice(BUSINESS.freeDeliveryThreshold - totalAmount)} pour la livraison gratuite`
                    : `Add ${formatPrice(BUSINESS.freeDeliveryThreshold - totalAmount)} for free delivery`}
                </p>
              )}
              <div className="border-t border-neutral-200 pt-3 flex justify-between">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-display font-bold text-xl text-primary-700">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              className="btn-primary w-full mt-6"
            >
              {currentLang === "FR" ? "Passer commande" : "Checkout"} <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/catalogue" className="btn-ghost w-full mt-2 justify-center">
              {currentLang === "FR" ? "Continuer mes achats" : "Continue shopping"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}