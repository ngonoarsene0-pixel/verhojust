import { Link } from "react-router-dom";
import { ShoppingCart, AlertTriangle, X } from "lucide-react";
import type { ProduitWithType } from "../lib/types";
import { productService } from "../services/product.service";
import { reviewService } from "../services/review.service";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { formatPrice } from "../lib/format";
import StarRating from "./StarRating";
import { useEffect, useState } from "react";

export default function ProductCard({ produit }: { produit: ProduitWithType }) {
  const { addToCart } = useCart();
  const { notify } = useToast();
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    (async () => {
      const reviews = await reviewService.getByProduct(produit.idProduit);
      setAvgRating(reviewService.getAverage(reviews));
      setReviewCount(reviews.length);
    })();
  }, [produit.idProduit]);

  const stockStatus = productService.getStockStatus(produit);
  const stockConfig = {
    rupture: { label: "Rupture de stock", className: "bg-red-100 text-red-700" },
    alerte: { label: "Stock limité", className: "bg-accent-100 text-accent-700" },
    en_stock: { label: "En stock", className: "bg-emerald-100 text-emerald-700" },
  }[stockStatus];

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (stockStatus === "rupture") {
      notify("Produit en rupture de stock", "error");
      return;
    }
    try {
      await addToCart(produit.idProduit, 1);
      notify(`${produit.nomProduit} ajouté au panier`);
    } catch {
      notify("Erreur lors de l'ajout au panier", "error");
    }
  };

  return (
    <Link
      to={`/produit/${produit.idProduit}`}
      className="card group overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <img
          src={produit.imageProduit}
          alt={produit.nomProduit}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Name label overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 pt-8 pb-2.5">
          <p className="text-white font-display font-bold text-sm leading-tight drop-shadow-lg line-clamp-2">
            {produit.nomProduit}
          </p>
        </div>
        <div className="absolute top-3 left-3">
          <span className={`badge ${stockConfig.className}`}>
            {stockStatus === "rupture" ? (
              <X className="w-3 h-3" />
            ) : stockStatus === "alerte" ? (
              <AlertTriangle className="w-3 h-3" />
            ) : null}
            {stockConfig.label}
          </span>
        </div>
        {produit.typeProduit && (
          <div className="absolute top-3 right-3">
            <span className="badge bg-white/90 text-neutral-700 backdrop-blur-sm">
              {produit.typeProduit.nomTypeProduit}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-neutral-500 line-clamp-2 mb-2 flex-1">
          {produit.descriptionProduit}
        </p>
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <StarRating rating={avgRating} size={14} />
            <span className="text-xs text-neutral-400">({reviewCount})</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="font-display font-bold text-lg text-primary-700">
            {formatPrice(produit.prixProduit)}
          </p>
          <button
            onClick={handleAdd}
            disabled={stockStatus === "rupture"}
            className="p-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
