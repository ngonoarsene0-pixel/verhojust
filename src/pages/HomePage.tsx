import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Leaf,
  Clock,
  ArrowRight,
} from "lucide-react";
import { productService } from "../services/product.service";
import type { ProduitWithType, TypeProduit } from "../lib/types";
import ProductCard from "../components/ProductCard";
import VideoCarousel from "../components/VideoCarousel";
import { BUSINESS } from "../lib/db";

/**
 * Category image mapping — each category ID gets a representative photo.
 * To use your own images, upload them to /public/images and update the URLs
 * below to point to "/images/your-image.jpg".
 */
const categoryImages: Record<number, string> = {
  1: "https://images.pexels.com/photos/32994324/pexels-photo-32994324.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  2: "https://images.pexels.com/photos/678414/pexels-photo-678414.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  3: "https://images.pexels.com/photos/616484/pexels-photo-616484.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  4: "https://images.pexels.com/photos/5056631/pexels-photo-5056631.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
  5: "https://images.pexels.com/photos/34940649/pexels-photo-34940649.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
};

export default function HomePage() {
  const [products, setProducts] = useState<ProduitWithType[]>([]);
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [prods, cats] = await Promise.all([
        productService.getAllProducts(),
        productService.getAllTypes(),
      ]);
      setProducts(prods);
      setTypes(cats);
      setLoading(false);
    })();
  }, []);

  const featured = products.filter((p) => p.statutProduit === "actif").slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-emerald-50">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 -left-20 w-72 h-72 rounded-full bg-primary-200 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-emerald-200 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-slide-up">
              <span className="badge bg-primary-100 text-primary-700 mb-4">
                <Leaf className="w-3.5 h-3.5" /> Produits frais & de qualité
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-neutral-900 leading-tight mb-4">
                Votre épicerie
                <span className="text-primary-600"> premium </span>
                à Yaoundé et Douala
              </h1>
              <p className="text-lg text-neutral-600 mb-8 max-w-lg leading-relaxed">
                Découvrez une sélection soignée de produits frais et d'épicerie,
                livrés rapidement à Yaoundé et Douala.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/catalogue" className="btn-primary">
                  Explorer le catalogue <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn-secondary">
                  Créer un compte
                </Link>
              </div>
            </div>
            <div className="hidden md:block relative">
              <div className="grid grid-cols-2 gap-4">
                {featured.slice(0, 4).map((p, i) => (
                  <div
                    key={p.idProduit}
                    className={`rounded-2xl overflow-hidden shadow-lg ${
                      i % 2 === 0 ? "mt-8" : ""
                    }`}
                  >
                    <img
                      src={p.imageProduit}
                      alt={p.nomProduit}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — Premium Banner */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Truck, title: "Livraison rapide", desc: "Yaoundé et Douala", gradient: "from-blue-500 to-cyan-400", bg: "bg-blue-50" },
            { icon: Leaf, title: "Produits frais", desc: "Directement de nos fournisseurs", gradient: "from-emerald-500 to-green-400", bg: "bg-emerald-50" },
            { icon: ShieldCheck, title: "Paiement sécurisé", desc: "Espèces, Mobile Money, carte", gradient: "from-amber-500 to-orange-400", bg: "bg-amber-50" },
            { icon: Clock, title: "Service 7j/7", desc: "Toujours à votre service", gradient: "from-rose-500 to-pink-400", bg: "bg-rose-50" },
          ].map((f) => (
            <div
              key={f.title}
              className={`group relative ${f.bg} rounded-2xl p-5 text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-white/60 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900 mb-1">{f.title}</h3>
                <p className="text-xs text-neutral-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Carousel */}
      <VideoCarousel />

      {/* Categories — Photo Cards */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-neutral-900">
              Nos catégories
            </h2>
            <p className="text-neutral-500 mt-1">Parcourez par type de produit</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {types.map((t) => (
            <Link
              key={t.idTypeProduit}
              to={`/catalogue?type=${t.idTypeProduit}`}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <img
                src={categoryImages[t.idTypeProduit] ?? "https://images.pexels.com/photos/678414/pexels-photo-678414.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"}
                alt={t.nomTypeProduit}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-display font-bold text-sm md:text-base drop-shadow-lg leading-tight">
                  {t.nomTypeProduit}
                </p>
                <p className="text-white/70 text-xs mt-1 line-clamp-2 drop-shadow">
                  {t.descriptionTypeProduit}
                </p>
              </div>
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-neutral-900">
              Produits populaires
            </h2>
            <p className="text-neutral-500 mt-1">Notre sélection du moment</p>
          </div>
          <Link
            to="/catalogue"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-neutral-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-full" />
                  <div className="h-6 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((p) => (
              <ProductCard key={p.idProduit} produit={p} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="rounded-3xl bg-gradient-to-r from-primary-700 to-emerald-700 p-8 md:p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="font-display text-2xl md:text-4xl font-bold mb-3">
              Faites vos courses en ligne dès aujourd'hui
            </h2>
            <p className="text-primary-100 mb-6 max-w-xl mx-auto">
              Inscrivez-vous gratuitement et profitez d'une livraison rapide à Yaoundé et Douala.
              Frais de livraison: {BUSINESS.deliveryFee} {BUSINESS.currency}.
              Livraison gratuite dès {new Intl.NumberFormat("fr-FR").format(BUSINESS.freeDeliveryThreshold)} {BUSINESS.currency}.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 transition-all hover:shadow-lg"
            >
              Commencer maintenant <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
