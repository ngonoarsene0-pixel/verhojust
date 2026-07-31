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

export default function CartPage() {
  const { items, loading, refresh, updateQuantity, removeFromCart, totalAmount } = useCart();
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
          Votre panier est vide
        </h2>
        <p className="text-neutral-500 mb-6">
          Parcourez notre catalogue et ajoutez vos produits préférés.
        </p>
        <Link to="/catalogue" className="btn-primary">
          Explorer le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const deliveryFee = totalAmount >= BUSINESS.freeDeliveryThreshold ? 0 : BUSINESS.deliveryFee;
  const grandTotal = totalAmount + deliveryFee;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-neutral-900 mb-8">
        Mon Panier
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.produit.idProduit}
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
                <Link
                  to={`/produit/${item.produit.idProduit}`}
                  className="font-semibold text-sm text-neutral-900 hover:text-primary-700 line-clamp-1"
                >
                  {item.produit.nomProduit}
                </Link>
                <p className="text-sm text-neutral-500 mb-2">
                  {formatPrice(item.produit.prixProduit)} / unité
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-neutral-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() =>
                        updateQuantity(item.produit.idProduit, item.quantiteProduit - 1)
                      }
                      className="p-1.5 hover:bg-neutral-100 transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">
                      {item.quantiteProduit}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.produit.idProduit, item.quantiteProduit + 1)
                      }
                      disabled={item.quantiteProduit >= item.produit.quantiteStockProduit}
                      className="p-1.5 hover:bg-neutral-100 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.produit.idProduit)}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-lg text-primary-700">
                  {formatPrice(item.produit.prixProduit * item.quantiteProduit)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h3 className="font-display font-bold text-lg text-neutral-900 mb-4">
              Récapitulatif
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Sous-total ({items.length} article(s))</span>
                <span className="font-semibold text-neutral-900">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Frais de livraison</span>
                <span className="font-semibold text-neutral-900">
                  {deliveryFee === 0 ? "Gratuit" : formatPrice(deliveryFee)}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-neutral-400 bg-neutral-50 rounded-lg p-2">
                  Ajoutez {formatPrice(BUSINESS.freeDeliveryThreshold - totalAmount)} pour
                  la livraison gratuite
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
              Passer commande <ArrowRight className="w-4 h-4" />
            </button>
            <Link to="/catalogue" className="btn-ghost w-full mt-2 justify-center">
              Continuer mes achats
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
