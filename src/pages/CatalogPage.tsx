import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { productService } from "../services/product.service";
import type { ProduitWithType, TypeProduit } from "../lib/types";
import ProductCard from "../components/ProductCard";

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const typeParam = searchParams.get("type") ?? "";

  const [products, setProducts] = useState<ProduitWithType[]>([]);
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(queryParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [sortBy, setSortBy] = useState<"nom" | "prix_asc" | "prix_desc">("nom");
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    setSearch(queryParam);
    setSelectedType(typeParam);
  }, [queryParam, typeParam]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nomProduit.toLowerCase().includes(q) ||
          p.descriptionProduit.toLowerCase().includes(q)
      );
    }
    if (selectedType) {
      result = result.filter((p) => p.idTypeProduit === Number(selectedType));
    }
    switch (sortBy) {
      case "prix_asc":
        result.sort((a, b) => a.prixProduit - b.prixProduit);
        break;
      case "prix_desc":
        result.sort((a, b) => b.prixProduit - a.prixProduit);
        break;
      default:
        result.sort((a, b) => a.nomProduit.localeCompare(b.nomProduit));
    }
    return result;
  }, [products, search, selectedType, sortBy]);

  const updateType = (typeId: string) => {
    const params = new URLSearchParams(searchParams);
    if (typeId) params.set("type", typeId);
    else params.delete("type");
    setSearchParams(params);
  };

  const updateSearch = (val: string) => {
    const params = new URLSearchParams(searchParams);
    if (val) params.set("q", val);
    else params.delete("q");
    setSearchParams(params);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
          Catalogue des produits
        </h1>
        <p className="text-neutral-500">
          {loading ? "Chargement..." : `${filtered.length} produit(s) trouvé(s)`}
        </p>
      </div>

      {/* Search & sort bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateSearch(e.target.value);
            }}
            placeholder="Rechercher un produit..."
            className="input pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="input sm:w-48"
        >
          <option value="nom">Trier par nom</option>
          <option value="prix_asc">Prix croissant</option>
          <option value="prix_desc">Prix décroissant</option>
        </select>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary sm:hidden"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filtres
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0`}>
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-neutral-900">Catégories</h3>
              {selectedType && (
                <button
                  onClick={() => updateType("")}
                  className="text-xs text-primary-600 hover:underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => updateType("")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !selectedType
                    ? "bg-primary-50 text-primary-700 font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Tous les produits
              </button>
              {types.map((t) => (
                <button
                  key={t.idTypeProduit}
                  onClick={() => updateType(String(t.idTypeProduit))}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedType === String(t.idTypeProduit)
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-neutral-600 hover:bg-neutral-50"
                  }`}
                >
                  {t.nomTypeProduit}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <X className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 mb-2">Aucun produit trouvé</p>
              <p className="text-sm text-neutral-400">
                Essayez d'autres mots-clés ou catégories
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.idProduit} produit={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
