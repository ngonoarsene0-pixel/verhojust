import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { orderService } from "../services/order.service";
import { deliveryService } from "../services/delivery.service";
import type { CommandeWithDetails, Livraison } from "../lib/types";
import { formatPrice, formatDate, formatDateTime } from "../lib/format";

const STATUS_CONFIG = {
  en_attente: { label: "En attente", color: "bg-neutral-100 text-neutral-700", icon: Clock },
  confirmee: { label: "Confirmée", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  preparation: { label: "En préparation", color: "bg-accent-100 text-accent-700", icon: Package },
  expediee: { label: "Expédiée", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  livree: { label: "Livrée", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  annulee: { label: "Annulée", color: "bg-red-100 text-red-700", icon: XCircle },
};

const DELIVERY_STATUS_CONFIG = {
  programmee: { label: "Programmée", color: "bg-blue-100 text-blue-700" },
  en_preparation: { label: "En préparation", color: "bg-accent-100 text-accent-700" },
  en_cours: { label: "En cours de livraison", color: "bg-indigo-100 text-indigo-700" },
  livree: { label: "Livrée", color: "bg-emerald-100 text-emerald-700" },
  echouee: { label: "Échouée", color: "bg-red-100 text-red-700" },
};

export default function AccountPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<CommandeWithDetails[]>([]);
  const [livraisons, setLivraisons] = useState<Livraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [ords, dels] = await Promise.all([
        orderService.getClientOrders(user.client.idClient),
        deliveryService.getByClient(user.client.idClient),
      ]);
      setOrders(ords);
      setLivraisons(dels);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="card p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
            {user.client.prenomClient[0].toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900">
              {user.client.prenomClient} {user.client.nomClient}
            </h1>
            <p className="text-neutral-500 text-sm">{user.client.emailClient}</p>
            <p className="text-neutral-400 text-xs mt-1">
              Membre depuis {formatDate(user.client.dateInscription)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-neutral-100">
          <div>
            <p className="text-xs text-neutral-400">Téléphone</p>
            <p className="text-sm font-medium text-neutral-900">{user.client.telephoneClient}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Adresse</p>
            <p className="text-sm font-medium text-neutral-900">{user.client.adresseClient}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Ville</p>
            <p className="text-sm font-medium text-neutral-900">{user.client.villeClient}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Commandes</p>
            <p className="text-sm font-medium text-neutral-900">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold text-neutral-900 mb-4">
          Mes commandes
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-2">Aucune commande pour le moment</p>
          <Link to="/catalogue" className="btn-primary mt-4">
            Commencer mes achats
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const livraison = livraisons.find((l) => l.idCommande === order.idCommande);
            const statusCfg = STATUS_CONFIG[order.statutCommande];
            const isExpanded = expandedOrder === order.idCommande;
            return (
              <div key={order.idCommande} className="card overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.idCommande)}
                  className="w-full p-5 flex items-center justify-between hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusCfg.color}`}>
                      <statusCfg.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-neutral-900">
                        {order.referenceCommande}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDateTime(order.dateCommande)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-display font-bold text-neutral-900">
                        {formatPrice(order.montantTotalCommande)}
                      </p>
                      <span className={`badge ${statusCfg.color} mt-1`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 p-5 animate-slide-up">
                    {/* Delivery tracking */}
                    {livraison && (
                      <div className="mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-primary-600" />
                          <h4 className="font-semibold text-sm text-neutral-900">
                            Suivi de livraison
                          </h4>
                        </div>
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className={`badge ${DELIVERY_STATUS_CONFIG[livraison.statutLivraison].color}`}>
                              {DELIVERY_STATUS_CONFIG[livraison.statutLivraison].label}
                            </span>
                            <span className="text-xs text-neutral-500">
                              Prévue: {formatDate(livraison.dateLivraisonPrevue)}
                            </span>
                          </div>
                          {livraison.dateLivraisonReelle && (
                            <p className="text-xs text-emerald-600 font-medium mb-2">
                              Livrée le {formatDate(livraison.dateLivraisonReelle)}
                            </p>
                          )}
                          <div className="flex items-start gap-2 text-xs text-neutral-600">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <span>{livraison.adresseLivraison}</span>
                          </div>
                          {livraison.livreur && (
                            <p className="text-xs text-neutral-500 mt-2">
                              Livreur: {livraison.livreur}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Order items */}
                    <h4 className="font-semibold text-sm text-neutral-900 mb-3">
                      Articles commandés
                    </h4>
                    <div className="space-y-2">
                      {order.lignes?.map((ligne) => (
                        <div
                          key={ligne.idLigneCommande}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                        >
                          <img
                            src={ligne.produit?.imageProduit}
                            alt={ligne.produit?.nomProduit}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-neutral-900">
                              {ligne.produit?.nomProduit}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {ligne.quantiteProduit} × {formatPrice(ligne.prixUnitaire)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-neutral-900">
                            {formatPrice(ligne.prixUnitaire * ligne.quantiteProduit)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-neutral-100 mt-4 pt-4 flex justify-between text-sm">
                      <span className="font-semibold text-neutral-900">Total</span>
                      <span className="font-display font-bold text-primary-700">
                        {formatPrice(order.montantTotalCommande)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
