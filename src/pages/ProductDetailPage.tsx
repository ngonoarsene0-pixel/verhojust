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
  Box,
  Scale,
} from "lucide-react";
import { productService } from "../services/product.service";
import { reviewService } from "../services/review.service";
import type { ProduitWithType, Avis } from "../lib/types";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import { formatPrice, formatDate } from "../lib/format";
import StarRating from "../components/StarRating";

interface ProductDetailPageProps {
  currentLang?: "FR" | "EN";
}

export default function ProductDetailPage({ currentLang = "FR" }: ProductDetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { notify } = useToast();
  const { user } = useAuth();

  const [produit, setProduit] = useState<ProduitWithType | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantite, setQuantite] = useState(1);
  const [unitType, setUnitType] = useState<string>("kilo");
  const [reviews, setReviews] = useState<Avis[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const p = await productService.getById(Number(id));
      setProduit(p);
      if (p) {
        const detailUnit = p.uniteDetailProduit || "Détail";
        if (p.prixBoiteProduit > 0) {
          setUnitType(detailUnit);
        } else if (p.prixKiloProduit > 0) {
          setUnitType("kilo");
        }
      }
      const r = await reviewService.getByProduct(Number(id));
      setReviews(r);
      setReviewAuthor(user?.client?.prenomClient ? `${user.client.prenomClient} ${user.client.nomClient}` : "");
      setLoading(false);
    })();
  }, [id, user]);

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
        <p className="text-neutral-500 mb-4">
          {currentLang === "FR" ? "Produit introuvable" : "Product not found"}
        </p>
        <Link to="/catalogue" className="btn-primary">
          {currentLang === "FR" ? "Retour au catalogue" : "Back to catalog"}
        </Link>
      </div>
    );
  }

  const uniteDetail = produit.uniteDetailProduit || "Détail";
  const activePrice = unitType === "kilo" ? produit.prixKiloProduit : produit.prixBoiteProduit;

  const stockStatus = productService.getStockStatus(produit);
  const stockConfig = {
    rupture: {
      label: currentLang === "FR" ? "Rupture de stock" : "Out of stock",
      color: "text-red-600",
      bg: "bg-red-50",
      icon: AlertTriangle,
    },
    alerte: {
      label: currentLang === "FR" 
        ? `Stock limité (${produit.quantiteStockProduit} restants)` 
        : `Limited stock (${produit.quantiteStockProduit} left)`,
      color: "text-accent-700",
      bg: "bg-accent-50",
      icon: AlertTriangle,
    },
    en_stock: {
      label: currentLang === "FR" ? "En stock" : "In stock",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      icon: Check,
    },
  }[stockStatus];

  const handleAddToCart = async () => {
    if (stockStatus === "rupture") return;
    try {
      await addToCart(produit.idProduit, quantite, unitType as any);
      
      const labelUnit = unitType === "kilo" 
        ? "Kg" 
        : uniteDetail;

      notify(
        currentLang === "FR"
          ? `${quantite} (${labelUnit}) × ${produit.nomProduit} ajouté(s) au panier`
          : `${quantite} (${labelUnit}) × ${produit.nomProduit} added to cart`
      );
    } catch {
      notify(
        currentLang === "FR"
          ? "Erreur lors de l'ajout au panier"
          : "Error adding item to cart",
        "error"
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Bouton de retour amélioré */}
      <button
        onClick={() => navigate("/catalogue")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-600 hover:text-primary-600 bg-neutral-100 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> 
        <span>{currentLang === "FR" ? "Retour au catalogue" : "Back to catalog"}</span>
      </button>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 shadow-md">
          <img
            src={produit.imageProduit}
            alt={produit.nomProduit}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.jpg";
            }}
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

          {/* Choix du format / conditionnement (Détail vs Kilo) */}
          <div className="mb-6">
            <label className="label mb-2">
              {currentLang === "FR" ? "Choisir le format :" : "Select format:"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {produit.prixBoiteProduit > 0 && (
                <button
                  type="button"
                  onClick={() => setUnitType(uniteDetail)}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    unitType === uniteDetail
                      ? "border-primary-600 bg-primary-50/50 text-primary-900 font-semibold shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <Box className="w-5 h-5 text-primary-600" />
                  <div className="text-left">
                    <p className="text-xs text-neutral-500">
                      {currentLang === "FR" ? `Par ${uniteDetail}` : `Per ${uniteDetail}`}
                    </p>
                    <p className="font-bold text-sm">{formatPrice(produit.prixBoiteProduit)}</p>
                  </div>
                </button>
              )}

              {produit.prixKiloProduit > 0 && (
                <button
                  type="button"
                  onClick={() => setUnitType("kilo")}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    unitType === "kilo"
                      ? "border-amber-600 bg-amber-50/50 text-amber-900 font-semibold shadow-sm"
                      : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                  }`}
                >
                  <Scale className="w-5 h-5 text-amber-600" />
                  <div className="text-left">
                    <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Au Kilo (Kg)" : "Per Kg"}</p>
                    <p className="font-bold text-sm">{formatPrice(produit.prixKiloProduit)}</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Affichage du prix total calculé selon la quantité choisie */}
          <div className="mb-6">
            <p className="text-xs text-neutral-400 mb-1">
              {currentLang === "FR" ? "Prix total calculé :" : "Total calculated price:"}
            </p>
            <p className="text-3xl font-display font-bold text-primary-700">
              {formatPrice(activePrice * quantite)}
            </p>
          </div>

          {/* Selecteur de quantité avec Saisie Libre au clavier + boutons +/- */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-neutral-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500">
              <button
                type="button"
                onClick={() => setQuantite(Math.max(1, quantite - 1))}
                className="p-3 hover:bg-neutral-100 transition-colors"
                disabled={stockStatus === "rupture"}
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                min="1"
                max={produit.quantiteStockProduit}
                value={quantite}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (isNaN(val) || val < 1) {
                    setQuantite(1);
                  } else if (val > produit.quantiteStockProduit) {
                    setQuantite(produit.quantiteStockProduit);
                  } else {
                    setQuantite(val);
                  }
                }}
                className="w-16 text-center font-bold text-base py-2 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-neutral-900"
                disabled={stockStatus === "rupture"}
              />

              <button
                type="button"
                onClick={() => setQuantite(Math.min(produit.quantiteStockProduit, quantite + 1))}
                className="p-3 hover:bg-neutral-100 transition-colors"
                disabled={stockStatus === "rupture" || quantite >= produit.quantiteStockProduit}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* AFFICHAGE DYNAMIQUE DIRECTEMENT DEPUIS LA BASE DE DONNÉES */}
            <span className="text-sm font-semibold text-neutral-600">
              {unitType === "kilo" ? "Kg" : uniteDetail}
            </span>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleAddToCart}
              disabled={stockStatus === "rupture"}
              className="btn-primary flex-1"
            >
              <ShoppingCart className="w-4 h-4" /> {currentLang === "FR" ? "Ajouter au panier" : "Add to cart"}
            </button>
            <Link to="/catalogue" className="btn-secondary">
              {currentLang === "FR" ? "Continuer mes achats" : "Continue shopping"}
            </Link>
          </div>

          {/* Meta */}
          <div className="mt-8 pt-6 border-t border-neutral-200 space-y-2 text-sm text-neutral-500">
            <div className="flex justify-between">
              <span>{currentLang === "FR" ? "Référence produit" : "Product SKU"}</span>
              <span className="font-mono font-medium text-neutral-700">
                #{produit.idProduit.toString().padStart(5, "0")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{currentLang === "FR" ? "Seuil d'alerte stock" : "Stock alert threshold"}</span>
              <span className="font-medium text-neutral-700">
                {produit.seuilAlertProduit} {currentLang === "FR" ? "unités" : "units"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>{currentLang === "FR" ? "Ajouté le" : "Added on"}</span>
              <span className="font-medium text-neutral-700">
                {new Date(produit.dateAjoutProduit).toLocaleDateString(currentLang === "FR" ? "fr-FR" : "en-US")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="font-display text-2xl font-bold text-neutral-900 mb-1">
          {currentLang === "FR" ? "Avis clients" : "Customer Reviews"}
        </h2>
        <div className="flex items-center gap-3 mb-6">
          <StarRating rating={reviewService.getAverage(reviews)} size={20} />
          <span className="text-sm text-neutral-500">
            {reviews.length > 0
              ? `${reviewService.getAverage(reviews).toFixed(1)}/5 • ${reviews.length} ${currentLang === "FR" ? "avis" : "reviews"}`
              : currentLang === "FR" ? "Aucun avis pour le moment" : "No reviews yet"}
          </span>
        </div>

        {/* Review form */}
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4">
            {currentLang === "FR" ? "Laisser un avis" : "Leave a review"}
          </h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newComment.trim() || !reviewAuthor.trim()) return;
              setSubmitting(true);
              try {
                const created = await reviewService.create({
                  idProduit: produit.idProduit,
                  idClient: user?.client?.idClient ?? null,
                  nomAuteur: reviewAuthor,
                  noteAvis: newRating,
                  commentaireAvis: newComment,
                });
                setReviews((prev) => [...prev, created]);
                setNewComment("");
                setNewRating(5);
                notify(currentLang === "FR" ? "Merci pour votre avis !" : "Thank you for your review!");
              } catch {
                notify(currentLang === "FR" ? "Erreur lors de l'envoi de l'avis" : "Error sending review", "error");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">{currentLang === "FR" ? "Votre nom" : "Your name"}</label>
              <input
                required
                value={reviewAuthor}
                onChange={(e) => setReviewAuthor(e.target.value)}
                placeholder={currentLang === "FR" ? "Ex: Jean D." : "Ex: John D."}
                className="input"
              />
            </div>
            <div>
              <label className="label">{currentLang === "FR" ? "Votre note" : "Your rating"}</label>
              <StarRating rating={newRating} size={28} interactive onRate={setNewRating} />
            </div>
            <div>
              <label className="label">{currentLang === "FR" ? "Votre commentaire" : "Your comment"}</label>
              <textarea
                required
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder={currentLang === "FR" ? "Partagez votre expérience avec ce produit..." : "Share your experience with this product..."}
                className="input resize-none"
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting
                ? currentLang === "FR" ? "Envoi..." : "Submitting..."
                : currentLang === "FR" ? "Publier mon avis" : "Post my review"}
            </button>
          </form>
        </div>

        {/* Review list */}
        <div className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">
              {currentLang === "FR"
                ? "Soyez le premier à donner votre avis sur ce produit."
                : "Be the first to leave a review for this product."}
            </p>
          ) : (
            reviews.map((r) => (
              <div key={r.idAvis} className="card p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                      {r.nomAuteur[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{r.nomAuteur}</p>
                      <p className="text-xs text-neutral-400">{formatDate(r.dateAvis)}</p>
                    </div>
                  </div>
                  <StarRating rating={r.noteAvis} size={14} />
                </div>
                <p className="text-sm text-neutral-600 leading-relaxed">{r.commentaireAvis}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}