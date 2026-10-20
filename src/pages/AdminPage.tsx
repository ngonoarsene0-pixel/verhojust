import { useEffect, useState, useRef } from "react";
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
  MessageSquare,
  Send,
  Box,
  Scale,
} from "lucide-react";
import { productService } from "../services/product.service";
import { orderService } from "../services/order.service";
import { deliveryService } from "../services/delivery.service";
import { authService } from "../services/auth.service";
import { supabase } from "../lib/supabase";
import type { ProduitWithType, TypeProduit, CommandeWithDetails, Livraison, Produit, Client } from "../lib/types";
import { formatPrice, formatDate, formatDateTime } from "../lib/format";
import { useToast } from "../contexts/ToastContext";

type Tab = "dashboard" | "products" | "orders" | "deliveries" | "clients" | "messages";

interface Message {
  id: number | string;
  message: string;
  sender: string;
  session_id?: string;
  created_at?: string;
}

interface Conversation {
  session_id: string;
  lastMessage: string;
  lastTime: string;
  unreadCount?: number;
}

interface AdminPageProps {
  currentLang?: "FR" | "EN";
}

export default function AdminPage({ currentLang = "FR" }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const { notify } = useToast();

  // Data
  const [products, setProducts] = useState<ProduitWithType[]>([]);
  const [types, setTypes] = useState<TypeProduit[]>([]);
  const [orders, setOrders] = useState<CommandeWithDetails[]>([]);
  const [livraisons, setLivraisons] = useState<(Livraison & { reference?: string })[]>([]);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Messaging state (Admin chat)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [replyInput, setReplyInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  // Charger les conversations de support
  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("session_id, message, created_at, sender")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const convMap = new Map<string, Conversation>();
      data.forEach((m: any) => {
        if (m.session_id && !convMap.has(m.session_id)) {
          convMap.set(m.session_id, {
            session_id: m.session_id,
            lastMessage: `${m.sender === "admin" ? (currentLang === "FR" ? "Vous : " : "You: ") : ""}${m.message}`,
            lastTime: m.created_at,
          });
        }
      });
      setConversations(Array.from(convMap.values()));
    }
  };

  useEffect(() => {
    refreshAll();
    fetchConversations();
  }, []);

  // Écouter les messages de la conversation sélectionnée en admin
  useEffect(() => {
    if (!selectedSession) return;

    const fetchSessionMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", selectedSession)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setChatMessages(data);
      }
    };

    fetchSessionMessages();

    const channel = supabase
      .channel(`admin:messages:${selectedSession}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${selectedSession}`,
        },
        (payload: any) => {
          setChatMessages((prev) => {
            const exists = prev.some((m) => m.id === payload.new.id);
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedSession]);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages]);

  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyInput.trim() || !selectedSession) return;

    const text = replyInput;
    setReplyInput("");

    const { data, error } = await supabase
      .from("messages")
      .insert([{ sender: "admin", message: text, session_id: selectedSession }])
      .select();

    if (!error && data && data[0]) {
      setChatMessages((prev) => {
        const exists = prev.some((m) => m.id === data[0].id);
        if (exists) return prev;
        return [...prev, data[0] as Message];
      });
      fetchConversations();
    } else {
      notify(currentLang === "FR" ? "Erreur lors de l'envoi" : "Error sending message", "error");
    }
  };

  const lowStock = products.filter((p) => p.quantiteStockProduit <= p.seuilAlertProduit);
  const totalRevenue = orders.reduce((s, o) => s + o.montantTotalCommande, 0);
  const pendingOrders = orders.filter(
    (o) => o.statutCommande === "en_attente" || o.statutCommande === "confirmee"
  ).length;

  const handleSaveProduct = async (data: Partial<Produit>) => {
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.idProduit, data);
        notify(currentLang === "FR" ? "Produit mis à jour" : "Product updated");
      } else {
        await productService.createProduct(data as Omit<Produit, "idProduit" | "dateAjoutProduit">);
        notify(currentLang === "FR" ? "Produit créé" : "Product created");
      }
      setShowForm(false);
      setEditingProduct(null);
      refreshAll();
    } catch {
      notify(currentLang === "FR" ? "Erreur lors de la sauvegarde" : "Error saving", "error");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm(currentLang === "FR" ? "Supprimer ce produit ?" : "Delete this product?")) return;
    try {
      await productService.deleteProduct(id);
      notify(currentLang === "FR" ? "Produit supprimé" : "Product deleted");
      refreshAll();
    } catch {
      notify(currentLang === "FR" ? "Erreur lors de la suppression" : "Error deleting", "error");
    }
  };

  const handleOrderStatus = async (id: number, statut: CommandeWithDetails["statutCommande"]) => {
    try {
      await orderService.updateOrderStatus(id, statut);
      notify(currentLang === "FR" ? "Statut de commande mis à jour" : "Order status updated");
      refreshAll();
    } catch {
      notify(currentLang === "FR" ? "Erreur" : "Error", "error");
    }
  };

  const handleDeliveryStatus = async (id: number, statut: Livraison["statutLivraison"]) => {
    try {
      await deliveryService.updateStatus(id, statut);
      notify(currentLang === "FR" ? "Statut de livraison mis à jour" : "Delivery status updated");
      refreshAll();
    } catch {
      notify(currentLang === "FR" ? "Erreur" : "Error", "error");
    }
  };

  const yaoundeOrders = orders.filter((o) => o.adresseLivraisonCommande.toLowerCase().includes("yaoundé") || o.adresseLivraisonCommande.toLowerCase().includes("yaounde"));
  const doualaOrders = orders.filter((o) => o.adresseLivraisonCommande.toLowerCase().includes("douala"));
  const yaoundeDeliveries = livraisons.filter((l) => l.adresseLivraison.toLowerCase().includes("yaoundé") || l.adresseLivraison.toLowerCase().includes("yaounde"));
  const doualaDeliveries = livraisons.filter((l) => l.adresseLivraison.toLowerCase().includes("douala"));
  const yaoundeClients = clientsList.filter((c) => c.villeClient.toLowerCase().includes("yaoundé") || c.villeClient.toLowerCase().includes("yaounde"));
  const doualaClients = clientsList.filter((c) => c.villeClient.toLowerCase().includes("douala"));

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "dashboard", label: currentLang === "FR" ? "Tableau de bord" : "Dashboard", icon: LayoutDashboard },
    { id: "products", label: currentLang === "FR" ? "Produits" : "Products", icon: Package },
    { id: "orders", label: currentLang === "FR" ? "Commandes" : "Orders", icon: ShoppingCart },
    { id: "deliveries", label: currentLang === "FR" ? "Livraisons" : "Deliveries", icon: Truck },
    { id: "clients", label: currentLang === "FR" ? "Clients" : "Clients", icon: Users },
    { id: "messages", label: currentLang === "FR" ? "Messages Support" : "Support Messages", icon: MessageSquare },
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
        {currentLang === "FR" ? "Administration" : "Administration"}
      </h1>
      <p className="text-neutral-500 mb-6">
        {currentLang === "FR" ? "Gérez votre boutique VERHOJUST ÉPICERIE" : "Manage your VERHOJUST GROCERY store"}
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              if (t.id === "messages") fetchConversations();
            }}
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
              { label: currentLang === "FR" ? "Chiffre d'affaires" : "Total Revenue", value: formatPrice(totalRevenue), icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
              { label: currentLang === "FR" ? "Commandes" : "Orders", value: String(orders.length), icon: ShoppingCart, color: "text-blue-600 bg-blue-50" },
              { label: currentLang === "FR" ? "Clients" : "Clients", value: String(clientsList.length), icon: Users, color: "text-violet-600 bg-violet-50" },
              { label: currentLang === "FR" ? "Stock bas" : "Low Stock", value: String(lowStock.length), icon: AlertTriangle, color: "text-accent-600 bg-accent-50" },
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
                <h3 className="font-semibold text-neutral-900">
                  {currentLang === "FR" ? "Alertes de stock" : "Stock alerts"}
                </h3>
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
                          {currentLang === "FR" ? "Seuil :" : "Threshold:"} {p.seuilAlertProduit} | {currentLang === "FR" ? "Stock :" : "Stock:"} {p.quantiteStockProduit}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${
                      p.quantiteStockProduit === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-accent-200 text-accent-800"
                    }`}>
                      {p.quantiteStockProduit === 0
                        ? (currentLang === "FR" ? "Rupture" : "Out of stock")
                        : (currentLang === "FR" ? "Stock bas" : "Low stock")}
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
                  <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Commandes" : "Orders"}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{yaoundeDeliveries.length}</p>
                  <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Livraisons" : "Deliveries"}</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-3">
                  <p className="text-2xl font-bold text-violet-700">{yaoundeClients.length}</p>
                  <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Clients" : "Clients"}</p>
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
                  <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Commandes" : "Orders"}</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-2xl font-bold text-blue-700">{doualaDeliveries.length}</p>
                  <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Livraisons" : "Deliveries"}</p>
                </div>
                <div className="rounded-xl bg-violet-50 p-3">
                  <p className="text-2xl font-bold text-violet-700">{doualaClients.length}</p>
                  <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Clients" : "Clients"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent orders */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-neutral-900">
                {currentLang === "FR" ? "Commandes récentes" : "Recent orders"}
              </h3>
            </div>
            {orders.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-6">
                {currentLang === "FR" ? "Aucune commande pour le moment" : "No orders yet"}
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
            <p className="text-sm text-neutral-500">
              {products.length} {currentLang === "FR" ? "produits" : "products"}
            </p>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowForm(true);
              }}
              className="btn-primary !py-2.5"
            >
              <Plus className="w-4 h-4" /> {currentLang === "FR" ? "Ajouter un produit" : "Add product"}
            </button>
          </div>

          {/* Products table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{currentLang === "FR" ? "Produit" : "Product"}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">{currentLang === "FR" ? "Catégorie" : "Category"}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{currentLang === "FR" ? "Prix (Détail / Kilo)" : "Price (Detail / Kg)"}</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Stock</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {products.map((p) => {
                    const uniteDetail = p.uniteDetailProduit || "Détail";
                    return (
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
                        <td className="px-4 py-3 text-right text-xs">
                          {p.prixBoiteProduit > 0 && (
                            <div className="text-neutral-900 font-semibold">
                              <span className="text-[10px] text-primary-600 uppercase">{uniteDetail}:</span> {formatPrice(p.prixBoiteProduit)}
                            </div>
                          )}
                          {p.prixKiloProduit > 0 && (
                            <div className="text-neutral-600">
                              <span className="text-[10px] text-amber-600 uppercase">Kg:</span> {formatPrice(p.prixKiloProduit)}
                            </div>
                          )}
                          {p.prixBoiteProduit === 0 && p.prixKiloProduit === 0 && (
                            <span className="text-neutral-400">Non défini</span>
                          )}
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
                    );
                  })}
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
              <p className="text-neutral-500">{currentLang === "FR" ? "Aucune commande" : "No orders"}</p>
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
                      {formatDateTime(o.dateCommande)} • {o.lignes?.length ?? 0} {currentLang === "FR" ? "article(s)" : "item(s)"}
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
                      <option value="en_attente">{currentLang === "FR" ? "En attente" : "Pending"}</option>
                      <option value="confirmee">{currentLang === "FR" ? "Confirmée" : "Confirmed"}</option>
                      <option value="preparation">{currentLang === "FR" ? "En préparation" : "In preparation"}</option>
                      <option value="expediee">{currentLang === "FR" ? "Expédiée" : "Shipped"}</option>
                      <option value="livree">{currentLang === "FR" ? "Livrée" : "Delivered"}</option>
                      <option value="annulee">{currentLang === "FR" ? "Annulée" : "Cancelled"}</option>
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
              <p className="text-neutral-500">{currentLang === "FR" ? "Aucune livraison" : "No deliveries"}</p>
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
                      {currentLang === "FR" ? "Prévue :" : "Scheduled:"} {formatDate(l.dateLivraisonPrevue)}
                      {l.dateLivraisonReelle && ` • ${currentLang === "FR" ? "Livrée :" : "Delivered:"} ${formatDate(l.dateLivraisonReelle)}`}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">{l.adresseLivraison}</p>
                    <p className="text-xs text-neutral-400">{currentLang === "FR" ? "Livreur :" : "Driver:"} {l.livreur}</p>
                  </div>
                  <select
                    value={l.statutLivraison}
                    onChange={(e) =>
                      handleDeliveryStatus(l.idLivraison, e.target.value as Livraison["statutLivraison"])
                    }
                    className="text-xs font-semibold rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:border-primary-400"
                  >
                    <option value="programmee">{currentLang === "FR" ? "Programmée" : "Scheduled"}</option>
                    <option value="en_preparation">{currentLang === "FR" ? "En préparation" : "In preparation"}</option>
                    <option value="en_cours">{currentLang === "FR" ? "En cours" : "In progress"}</option>
                    <option value="livree">{currentLang === "FR" ? "Livrée" : "Delivered"}</option>
                    <option value="echouee">{currentLang === "FR" ? "Échouée" : "Failed"}</option>
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
                <h3 className="font-semibold text-neutral-900">
                  {currentLang === "FR" ? "Clients à Yaoundé" : "Clients in Yaoundé"}
                </h3>
              </div>
              <p className="text-3xl font-bold text-primary-700">{yaoundeClients.length}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-neutral-900">
                  {currentLang === "FR" ? "Clients à Douala" : "Clients in Douala"}
                </h3>
              </div>
              <p className="text-3xl font-bold text-emerald-700">{doualaClients.length}</p>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{currentLang === "FR" ? "Client" : "Client"}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">{currentLang === "FR" ? "Contact" : "Contact"}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">{currentLang === "FR" ? "Ville" : "City"}</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase hidden md:table-cell">{currentLang === "FR" ? "Inscrit le" : "Joined on"}</th>
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

      {/* MESSAGES SUPPORT TAB */}
      {tab === "messages" && (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: "38rem" }}>
          {/* Liste des conversations */}
          <div className="card overflow-hidden flex flex-col md:col-span-1">
            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
              <h3 className="font-semibold text-sm text-neutral-900">
                {currentLang === "FR" ? "Conversations Clients" : "Customer Conversations"}
              </h3>
              <p className="text-xs text-neutral-500">
                {conversations.length} {currentLang === "FR" ? "discussion(s)" : "discussion(s)"}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
              {conversations.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-10">
                  {currentLang === "FR" ? "Aucun message pour le moment" : "No messages yet"}
                </p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.session_id}
                    onClick={() => setSelectedSession(conv.session_id)}
                    className={`p-3.5 cursor-pointer transition-colors hover:bg-neutral-50 ${
                      selectedSession === conv.session_id ? "bg-primary-50/60 border-l-4 border-primary-600" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-neutral-800 truncate">
                        {currentLang === "FR" ? "Client #" : "Customer #"}{conv.session_id.substring(0, 8)}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {formatDateTime(conv.lastTime)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 truncate">{conv.lastMessage}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Espace de discussion de la conversation sélectionnée */}
          <div className="card overflow-hidden flex flex-col md:col-span-2">
            {selectedSession ? (
              <>
                <div className="p-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-900">
                      {currentLang === "FR" ? "Discussion avec Client #" : "Chat with Customer #"}{selectedSession.substring(0, 8)}
                    </h3>
                    <p className="text-xs text-neutral-500">Session ID: {selectedSession}</p>
                  </div>
                </div>

                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50/50">
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line shadow-sm ${
                          m.sender === "admin"
                            ? "bg-primary-600 text-white rounded-br-sm"
                            : "bg-white border border-neutral-200 text-neutral-800 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-[10px] opacity-70 mb-0.5 font-semibold">
                          {m.sender === "admin"
                            ? (currentLang === "FR" ? "Vous (Admin)" : "You (Admin)")
                            : (currentLang === "FR" ? "Client" : "Customer")}
                        </p>
                        {m.message}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendAdminReply} className="p-3 border-t border-neutral-200 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    placeholder={currentLang === "FR" ? "Écrivez votre réponse au client..." : "Type your reply to the customer..."}
                    className="flex-1 text-sm rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 focus:outline-none focus:border-primary-400"
                  />
                  <button type="submit" className="btn-primary !px-4 !py-2.5 flex items-center gap-1.5">
                    <Send className="w-4 h-4" />
                    <span>{currentLang === "FR" ? "Envoyer" : "Send"}</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                <MessageSquare className="w-12 h-12 text-neutral-300 mb-2" />
                <p className="text-sm font-medium">
                  {currentLang === "FR"
                    ? "Sélectionnez une conversation à gauche pour répondre au client en direct."
                    : "Select a conversation on the left to reply live to the customer."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          types={types}
          currentLang={currentLang}
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
/* PRODUCT FORM MODAL                                                 */
/* ------------------------------------------------------------------ */
function ProductFormModal({
  product,
  types,
  currentLang = "FR",
  onClose,
  onSave,
}: {
  product: Produit | null;
  types: TypeProduit[];
  currentLang?: "FR" | "EN";
  onClose: () => void;
  onSave: (data: Partial<Produit>) => void;
}) {
  const [form, setForm] = useState({
    nomProduit: product?.nomProduit ?? "",
    descriptionProduit: product?.descriptionProduit ?? "",
    prixBoiteProduit: product?.prixBoiteProduit ?? 0,
    prixKiloProduit: product?.prixKiloProduit ?? 0,
    uniteDetailProduit: product?.uniteDetailProduit ?? "100g",
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
            {product
              ? (currentLang === "FR" ? "Modifier le produit" : "Edit Product")
              : (currentLang === "FR" ? "Nouveau produit" : "New Product")}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">
              {currentLang === "FR" ? "Nom du produit" : "Product Name"}
            </label>
            <input
              required
              value={form.nomProduit}
              onChange={(e) => update("nomProduit", e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">
              {currentLang === "FR" ? "Description" : "Description"}
            </label>
            <textarea
              required
              value={form.descriptionProduit}
              onChange={(e) => update("descriptionProduit", e.target.value)}
              rows={3}
              className="input resize-none"
            />
          </div>
          <div>
            <label className="label">
              {currentLang === "FR" ? "Image (URL)" : "Image (URL)"}
            </label>
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
                  alt={currentLang === "FR" ? "Aperçu" : "Preview"}
                  className="w-16 h-16 rounded-xl object-cover border border-neutral-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
                <p className="text-xs text-neutral-400">
                  {currentLang === "FR" ? "Aperçu de l'image" : "Image preview"}
                </p>
              </div>
            )}
          </div>

          {/* Unité de détail personnalisée (ex: 100g, 50g, 1L...) */}
          <div>
            <label className="label">
              {currentLang === "FR" ? "Unité de détail personnalisée (ex: 100g, 50g, 1L)" : "Custom detail unit (e.g. 100g, 50g, 1L)"}
            </label>
            <input
              required
              value={form.uniteDetailProduit}
              onChange={(e) => update("uniteDetailProduit", e.target.value)}
              placeholder="100g"
              className="input"
            />
          </div>

          {/* Prix Détail et Prix Kilo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5 text-primary-700">
                <Box className="w-4 h-4" /> {currentLang === "FR" ? `Prix ${form.uniteDetailProduit || "Détail"} (FCFA)` : "Detail Price"}
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.prixBoiteProduit}
                onChange={(e) => update("prixBoiteProduit", Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label flex items-center gap-1.5 text-amber-700">
                <Scale className="w-4 h-4" /> {currentLang === "FR" ? "Prix Kilo (FCFA)" : "Kg Price"}
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.prixKiloProduit}
                onChange={(e) => update("prixKiloProduit", Number(e.target.value))}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                {currentLang === "FR" ? "Catégorie" : "Category"}
              </label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                {currentLang === "FR" ? "Seuil d'alerte" : "Alert Threshold"}
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.seuilAlertProduit}
                onChange={(e) => update("seuilAlertProduit", Number(e.target.value))}
                className="input"
              />
            </div>
            <div>
              <label className="label">
                {currentLang === "FR" ? "Statut" : "Status"}
              </label>
              <select
                value={form.statutProduit}
                onChange={(e) => update("statutProduit", e.target.value)}
                className="input"
              >
                <option value="actif">{currentLang === "FR" ? "Actif" : "Active"}</option>
                <option value="inactif">{currentLang === "FR" ? "Inactif" : "Inactive"}</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              {currentLang === "FR" ? "Annuler" : "Cancel"}
            </button>
            <button type="submit" className="btn-primary flex-1">
              <Save className="w-4 h-4" /> {currentLang === "FR" ? "Enregistrer" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}