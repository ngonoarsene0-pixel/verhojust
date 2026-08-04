import { useEffect, useState } from "react";
import {
  Package,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  TrendingUp,
  DollarSign,
  Users,
  MapPin,
} from "lucide-react";
import { productService } from "../services/product.service";
import { orderService } from "../services/order.service";
import { deliveryService } from "../services/delivery.service";
import { authService } from "../services/auth.service";
import type { ProduitWithType, TypeProduit, CommandeWithDetails, Livraison, Produit, Client } from "../lib/types";
import { formatPrice, formatDate, formatDateTime } from "../lib/format";
import { useToast } from "../contexts/ToastContext";

type Tab = "dashboard" | "products" | "orders" | "deliveries" | "clients";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { notify } = useToast();

  // Data
  const [products, setProducts] = useState<ProduitWithType[]>([]);
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [orders, setOrders] = useState<CommandeWithDetails[]>([]);
  const [livraisons, setLivraisons] = useState<(Livraison & { reference?: string })[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Product form modal
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produit | null>(null);

  const refreshAll = async () => {
    const [prods, cats, ords, dels, clts] = await Promise.all([
      productService.getAllProducts(),
      productService.getAllTypes(),
      orderService.getAllOrders(),
      deliveryService.getAll(),
      authService.getAllClients(),
    ]);
    setProducts(prods);
    setTypes(cats);
    setOrders(ords);
    setLivraisons(dels);
    setClientsList(clts);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const lowStock = products.filter((p) => p.quantiteStockProduit <= p.seuilAlertProduit);
  const totalRevenue = orders.reduce((s, o) => s + o.montantTotalCommande, 0);
  const pendingOrders = orders.filter(
    (o) => o.statutCommande === "en_attente" || o.statutCommande === "confirmee"
  ).length;

  const handleSaveProduct = async (data: Partial<Produit>) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.idProduit, data);
        notify("Produit mis à jour");
      } else {
        await productService.createProduct(data as Omit<Produit, "idProduit" | "dateAjoutProduit">);
        notify("Produit créé");
      }
      setShowForm(false);
      setEditingProduct(null);
      refreshAll();
    } catch {
      notify("Erreur lors de la sauvegarde", "error");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Supprimer ce produit?")) return;
    try {
      await productService.deleteProduct(id);
      notify("Produit supprimé");
      refreshAll();
    } catch {
      notify("Erreur lors de la suppression", "error");
    }
  };

  const handleOrderStatus = async (id: number, statut: CommandeWithDetails["statutCommande"]) => {
    try {
      await orderService.updateOrderStatus(id, statut);
      notify("Statut de commande mis à jour");
      refreshAll();
    } catch {
      notify("Erreur", "error");
    }
  };

  const handleDeliveryStatus = async (id: number, statut: Livraison["statutLivraison"]) => {
    try {
      await deliveryService.updateStatus(id, statut);
      notify("Statut de livraison mis à jour");
      refreshAll();
    } catch {
      notify("Erreur", "error");
    }
  };

  const yaoundeOrders = orders.filter((o) => o.adresseLivraisonCommande.toLowerCase().includes("yaoundé") || o.adresseLivraisonCommande.toLowerCase().includes("yaounde"));
  const doualaOrders = orders.filter((o) => o.adresseLivraisonCommande.toLowerCase().includes("douala"));
  const yaoundeDeliveries = livraisons.filter((l) => l.adresseLivraison.toLowerCase().includes("yaoundé") || l.adresseLivraison.toLowerCase().includes("yaounde"));
  const doualaDeliveries = livraisons.filter((l) => l.adresseLivraison.toLowerCase().includes("douala"));
  const yaoundeClients = clientsList.filter((c) => c.villeClient.toLowerCase().includes("yaoundé") || c.villeClient.toLowerCase().includes("yaounde"));
  const doualaClients = clientsList.filter((c) => c.villeClient.toLowerCase().includes("douala"));

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "products", label: "Produits", icon: Package },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "deliveries", label: "Livraisons", icon: Truck },
    { id: "clients", label: "Clients", icon: Users },
  ];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
        Administration
      </h1>
      <p className="text-neutral-500 mb-6">Gérez votre boutique VERHOJUST ÉPICERIE</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              tab === t.id
                ? "bg-primary-600 text-white shadow-md"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
            {t.id === "products" && lowStock.length > 0 && (
              <span className="bg-accent-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {lowStock.length}
              </span>
            )}
            {t.id === "orders" && pendingOrders > 0 && (
              <span className="bg-primary-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingOrders}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {tab === "dashboard" && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Chiffre d'affaires", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
              { label: "Commandes", value: String(orders.length), icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
              { label: "Clients", value: String(clientsList.length), icon: Users, color: "text-violet-600 bg-violet-50" },
              { label: "Stock bas", value: String(lowStock.length), icon: AlertTriangle, color: "text-accent-600 bg-accent-50" },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-xs text-neutral-500">{stat.label}</p>
                <p className="font-display font-bold text-xl text-neutral-900 mt-1">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Low stock alert */}
          {lowStock.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-accent-600" />
                <h3 className="font-semibold text-neutral-900">Alertes de stock</h3>
              </div>
              <div className="space-y-2">
                {lowStock.map((p) => (
                  <div
                    key={p.idProduit}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent-50"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={p.imageProduit}
                        alt={p.nomProduit}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-neutral-900">{p.nomProduit}</p>
                        <p className="text-xs text-neutral-500">
                          Seuil: {p.seuilAlertProduit} | Stock: {p.quantiteStockProduit}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      p.quantiteStockProduit === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-accent-200 text-accent-800"
                    }`}>
                      {p.quantiteStockProduit === 0 ? "Rupture" : "Stock bas"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* City-based delivery tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-neutral-900">Yaoundé</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-primary-50 p-3">
                  <p className="text-2xl font-bold text-primary-700">{yaoundeOrders.length}</p>
                  <p className="text-xs text-neutral-500">Commandes</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{yaoundeDeliveries.length}</p>
                  <p className="text-xs text-neutral-500">Livraisons</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-3">
                  <p className="text-2xl font-bold text-violet-700">{yaoundeClients.length}</p>
                  <p className="text-xs text-neutral-500">Clients</p>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-neutral-900">Douala</h3>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-2xl font-bold text-emerald-700">{doualaOrders.length}</p>
                  <p className="text-xs text-neutral-500">Commandes</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{doualaDeliveries.length}</p>
                  <p className="text-xs text-neutral-500">Livraisons</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-3">
                  <p className="text-2xl font-bold text-violet-700">{doualaClients.length}</p>
                  <p className="text-xs text-neutral-500">Clients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-neutral-900">Commandes récentes</h3>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                Aucune commande pour le moment
              </p>
            ) : (
              <div className="space-y-2">
                {orders.slice(0, 5).map((o) => (
                  <div
                    key={o.idCommande}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {o.referenceCommande}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDateTime(o.dateCommande)}
                      </p>
                    </div>
                    <p className="font-semibold text-sm text-neutral-900">
                      {formatPrice(o.montantTotalCommande)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === "products" && (
        <div className="animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-neutral-500">{products.length} produits</p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="btn-primary !py-2.5"
            >
              <Plus className="w-4 h-4" /> Ajouter un produit
            </button>
          </div>

          {/* Products table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Produit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Catégorie</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Prix</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Stock</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => (
                    <tr key={p.idProduit} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.imageProduit} alt={p.nomProduit} className="w-10 h-10 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{p.nomProduit}</p>
                            <p className="text-xs text-neutral-500 md:hidden">{p.typeProduit?.nomTypeProduit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 hidden md:table-cell">
                        {p.typeProduit?.nomTypeProduit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-neutral-900">
                        {formatPrice(p.prixProduit)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`badge ${
                          p.quantiteStockProduit === 0
                            ? "bg-red-100 text-red-700"
                            : p.quantiteStockProduit <= p.seuilAlertProduit
                            ? "bg-accent-100 text-accent-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>
                          {p.quantiteStockProduit}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setShowForm(true);
                            }}
                            className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.idProduit)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === "orders" && (
        <div className="animate-fade-in space-y-3">
          {orders.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-neutral-500">Aucune commande</p>
            </div>
          ) : (
            orders.map((o) => (
              <div key={o.idCommande} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-neutral-900">
                      {o.referenceCommande}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(o.dateCommande)} • {o.lignes?.length ?? 0} article(s)
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {o.adresseLivraisonCommande}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-display font-bold text-neutral-900">
                      {formatPrice(o.montantTotalCommande)}
                    </p>
                    <select
                      value={o.statutCommande}
                      onChange={(e) =>
                        handleOrderStatus(o.idCommande, e.target.value as CommandeWithDetails["statutCommande"])
                      }
                      className="text-xs font-semibold rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:border-primary-400"
                    >
                      <option value="en_attente">En attente</option>
                      <option value="confirmee">Confirmée</option>
                      <option value="preparation">En préparation</option>
                      <option value="expediee">Expédiée</option>
                      <option value="livree">Livrée</option>
                      <option value="annulee">Annulée</option>
                    </select>
                  </div>
                </div>
                {/* Items */}
                <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
                  {o.lignes?.map((l) => (
                    <div key={l.idLigneCommande} className="flex justify-between text-xs text-neutral-600">
                      <span>{l.quantiteProduit} × {l.produit?.nomProduit}</span>
                      <span>{formatPrice(l.prixUnitaire * l.quantiteProduit)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DELIVERIES TAB */}
      {tab === "deliveries" && (
        <div className="animate-fade-in space-y-3">
          {livraisons.length === 0 ? (
            <div className="card p-12 text-center">
              <Truck className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">Aucune livraison</p>
            </div>
          ) : (
            livraisons.map((l) => (
              <div key={l.idLivraison} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm text-neutral-900">
                      {l.reference ?? `#${l.idLivraison}`}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Prévue: {formatDate(l.dateLivraisonPrevue)}
                      {l.dateLivraisonReelle && ` • Livrée: ${formatDate(l.dateLivraisonReelle)}`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{l.adresseLivraison}</p>
                    <p className="text-xs text-neutral-400">Livreur: {l.livreur}</p>
                  </div>
                  <select
                    value={l.statutLivraison}
                    onChange={(e) =>
                      handleDeliveryStatus(l.idLivraison, e.target.value as Livraison["statutLivraison"])
                    }
                    className="text-xs font-semibold rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:border-primary-400"
                  >
                    <option value="programmee">Programmée</option>
                    <option value="en_preparation">En préparation</option>
                    <option value="en_cours">En cours</option>
                    <option value="livree">Livrée</option>
                    <option value="echouee">Échouée</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* CLIENTS TAB */}
      {tab === "clients" && (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h3 className="font-semibold text-neutral-900">Clients à Yaoundé</h3>
              </div>
              <p className="text-3xl font-bold text-primary-700">{yaoundeClients.length}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-neutral-900">Clients à Douala</h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">{doualaClients.length}</p>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Contact</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Ville</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientsList.map((c) => (
                    <tr key={c.idClient} className="hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                            {c.prenomClient[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{c.prenomClient} {c.nomClient}</p>
                            <p className="text-xs text-neutral-500 md:hidden">{c.telephoneClient}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 hidden md:table-cell">
                        <p>{c.telephoneClient}</p>
                        <p className="text-xs text-neutral-400">{c.emailClient}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${c.villeClient.toLowerCase().includes("douala") ? "bg-emerald-100 text-emerald-700" : "bg-primary-100 text-primary-700"}`}>
                          {c.villeClient}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 hidden md:table-cell">
                        {formatDate(c.dateInscription)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          types={types}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PRODUCT FORM MODAL                                                 */
/* ------------------------------------------------------------------ */
function ProductFormModal({
  product,
  types,
  onClose,
  onSave,
}: {
  product: Produit | null;
  types: TypeProduit[];
  onClose: () => void;
  onSave: (data: Partial<Produit>) => void;
}) {
  const [form, setForm] = useState({
    nomProduit: product?.nomProduit ?? "",
    descriptionProduit: product?.descriptionProduit ?? "",
    prixProduit: product?.prixProduit ?? 0,
    quantiteStockProduit: product?.quantiteStockProduit ?? 0,
    seuilAlertProduit: product?.seuilAlertProduit ?? 10,
    imageProduit: product?.imageProduit ?? "",
    idTypeProduit: product?.idTypeProduit ?? types[0]?.idTypeProduit ?? 1,
    statutProduit: product?.statutProduit ?? "actif" as const,
  });

  const update = (key: keyof typeof form, val: string | number) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-display font-bold text-lg text-neutral-900">
            {product ? "Modifier le produit" : "Nouveau produit"}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Nom du produit</label>
            <input
              required
              value={form.nomProduit}
              onChange={(e) => update("nomProduit", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              required
              value={form.descriptionProduit}
              onChange={(e) => update("descriptionProduit", e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">Image (URL)</label>
            <input
              required
              value={form.imageProduit}
              onChange={(e) => update("imageProduit", e.target.value)}
              placeholder="https://..."
              className="input"
            />
            {form.imageProduit && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={form.imageProduit}
                  alt="Aperçu"
                  className="w-16 h-16 rounded-xl object-cover border border-neutral-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
                <p className="text-xs text-neutral-400">Aperçu de l'image</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prix (FCFA)</label>
              <input
                type="number"
                required
                min={0}
                value={form.prixProduit}
                onChange={(e) => update("prixProduit", Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select
                value={form.idTypeProduit}
                onChange={(e) => update("idTypeProduit", Number(e.target.value))}
                className="input"
              >
                {types.map((t) => (
                  <option key={t.idTypeProduit} value={t.idTypeProduit}>
                    {t.nomTypeProduit}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Stock</label>
              <input
                type="number"
                required
                min={0}
                value={form.quantiteStockProduit}
                onChange={(e) => update("quantiteStockProduit", Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">Seuil d'alerte</label>
              <input
                type="number"
                required
                min={0}
                value={form.seuilAlertProduit}
                onChange={(e) => update("seuilAlertProduit", Number(e.target.value))}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="label">Statut</label>
            <select
              value={form.statutProduit}
              onChange={(e) => update("statutProduit", e.target.value)}
              className="input"
            >
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" className="btn-primary flex-1">
              <Save className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
