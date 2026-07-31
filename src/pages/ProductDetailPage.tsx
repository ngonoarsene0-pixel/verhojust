import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Minus,
  Plus,
  AlertTriangle,
  Check,
  Store,
} from "lucide-react";
import { productService } from "../services/product.service";
import type { ProduitWithType } from "../lib/types";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { formatPrice } from "../lib/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { notify } = useToast();

  const [produit, setProduit] = useState<ProduitWithType | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = await productService.getById(Number(id));
      setProduit(p);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-neutral-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-200 rounded w-3/4" />
            <div className="h-4 bg-neutral-200 rounded w-full" />
            <div className="h-4 bg-neutral-200 rounded w-1/2" />
            <div className="h-12 bg-neutral-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-500 mb-4">Produit introuvable</p>
        <Link to="/catalogue" className="btn-primary">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const stockStatus = productService.getStockStatus(produit);
  const stockConfig = {
    rupture: { label: "Rupture de stock", color: "text-red-600", bg: "bg-red-50", icon: AlertTriangle },
    alerte: { label: `Stock limité (${produit.quantiteStockProduit} restants)`, color: "text-accent-700", bg: "bg-accent-50", icon: AlertTriangle },
    en_stock: { label: "En stock", color: "text-emerald-600", bg: "bg-emerald-50", icon: Check },
  }[stockStatus];

  const handleAddToCart = async () => {
    if (stockStatus === "rupture") return;
    try {
      await addToCart(produit.idProduit, quantite);
      notify(`${quantite} × ${produit.nomProduit} ajouté au panier`);
    } catch {
      notify("Erreur lors de l'ajout au panier", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 shadow-md">
          <img
            src={produit.imageProduit}
            alt={produit.nomProduit}
            className="w-full h-full object-cover"
          />
          {produit.typeProduit && (
            <div className="absolute top-4 left-4">
              <span className="badge bg-white/90 backdrop-blur-sm text-neutral-700">
                <Store className="w-3 h-3" /> {produit.typeProduit.nomTypeProduit}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-3">
            {produit.nomProduit}
          </h1>
          <p className="text-neutral-600 leading-relaxed mb-6">
            {produit.descriptionProduit}
          </p>

          <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 mb-6 ${stockConfig.bg} ${stockConfig.color} w-fit`}>
            <stockConfig.icon className="w-4 h-4" />
            <span className="text-sm font-semibold">{stockConfig.label}</span>
          </div>

          <div className="mb-6">
            <p className="text-3xl font-display font-bold text-primary-700">
              {formatPrice(produit.prixProduit)}
            </p>
          </div>

          {/* Quantity selector */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantite(Math.max(1, quantite - 1))}
                className="p-3 hover:bg-neutral-100 transition-colors"
                disabled={stockStatus === "rupture"}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-6 py-3 text-sm font-semibold min-w-[3rem] text-center">
                {quantite}
              </span>
              <button
                onClick={() => setQuantite(Math.min(produit.quantiteStockProduit, quantite + 1))}
                className="p-3 hover:bg-neutral-100 transition-colors"
                disabled={stockStatus === "rupture" || quantite >= produit.quantiteStockProduit}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm text-neutral-500">
              Max: {produit.quantiteStockProduit} unités
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={stockStatus === "rupture"}
              className="btn-primary flex-1"
            >
              <ShoppingCart className="w-4 h-4" /> Ajouter au panier
            </button>
            <Link to="/catalogue" className="btn-secondary">
              Continuer mes achats
            </Link>
          </div>

          {/* Meta */}
          <div className="mt-8 pt-6 border-t border-neutral-200 space-y-2 text-sm text-neutral-500">
            <div className="flex justify-between">
              <span>Référence produit</span>
              <span className="font-mono font-medium text-neutral-700">
                #{produit.idProduit.toString().padStart(5, "0")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Seuil d'alerte stock</span>
              <span className="font-medium text-neutral-700">{produit.seuilAlertProduit} unités</span>
            </div>
            <div className="flex justify-between">
              <span>Ajouté le</span>
              <span className="font-medium text-neutral-700">
                {new Date(produit.dateAjoutProduit).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
