import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  MapPin,
  CreditCard,
  PackageCheck,
  ShoppingBag,
  Wallet,
  Banknote,
  Smartphone,
  User,
  Phone,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { orderService } from "../services/order.service";
import { deliveryService } from "../services/delivery.service";
import { formatPrice } from "../lib/format";
import { BUSINESS } from "../lib/db";
import type { Commande } from "../lib/types";

const STEPS = [
  { id: 1, label: "Livraison", icon: MapPin },
  { id: 2, label: "Paiement", icon: CreditCard },
  { id: 3, label: "Confirmation", icon: PackageCheck },
];

export default function CheckoutPage() {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();

  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Commande | null>(null);

  const [guestNom, setGuestNom] = useState(user?.client.nomClient ?? "");
  const [guestPrenom, setGuestPrenom] = useState(user?.client.prenomClient ?? "");
  const [adresse, setAdresse] = useState(user?.client.adresseClient ?? "");
  const [ville, setVille] = useState(user?.client.villeClient ?? "Yaoundé");
  const [telephone, setTelephone] = useState(user?.client.telephoneClient ?? "");
  const [modePaiement, setModePaiement] =
    useState<"especes" | "mobile_money" | "carte">("mobile_money");

  const deliveryFee =
    totalAmount >= BUSINESS.freeDeliveryThreshold ? 0 : BUSINESS.deliveryFee;
  const grandTotal = totalAmount + deliveryFee;

  const isGuest = !user;

  // Validation : nom, prénom, adresse, ville et téléphone sont requis
  const step1Valid = !!(
    guestNom.trim() &&
    guestPrenom.trim() &&
    adresse.trim() &&
    ville.trim() &&
    telephone.trim()
  );

  if (items.length === 0 && !completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500 mb-4">Votre panier est vide.</p>
        <Link to="/catalogue" className="btn-primary">Explorer le catalogue</Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setProcessing(true);
    try {
      // Si l'utilisateur est connecté, on utilise son idClient, sinon on passe 0 pour forcer la création d'un nouveau client dans Supabase
      const clientId = user?.client.idClient ?? 0;
      
      const commande = await orderService.createOrder({
        idClient: clientId,
        adresseLivraisonCommande: `${adresse}, ${ville}`,
        modePaiementCommande: modePaiement,
        items,
        guestInfo: { 
          nom: guestNom, 
          prenom: guestPrenom, 
          email: `${guestPrenom.toLowerCase()}.${guestNom.toLowerCase()}@client.local`, 
          telephone 
        },
      });

      await orderService.finalizeSale(commande.idCommande, modePaiement);
      await deliveryService.createDelivery(
        commande.idCommande,
        `${adresse}, ${ville}`
      );

      await clearCart();
      setCompletedOrder(commande);
      setStep(3);
      notify("Commande passée avec succès!");
    } catch {
      notify("Erreur lors de la création de la commande", "error");
    } finally {
      setProcessing(false);
    }
  };

  const fullName = `${guestPrenom} ${guestNom}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-neutral-900 mb-8">
        Finaliser ma commande
      </h1>

      {/* Guest notice */}
      {isGuest && step === 1 && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-primary-50 border-primary-200">
          <User className="w-5 h-5 text-primary-600 shrink-0" />
          <p className="text-sm text-primary-800">
            Vous commandez en tant qu'invité.{" "}
            <Link to="/login" className="font-semibold underline hover:text-primary-900">
              Connectez-vous
            </Link>{" "}
            pour retrouver vos informations rapidement.
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex items-center gap-2.5 ${
                step >= s.id ? "text-primary-700" : "text-neutral-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  step > s.id
                    ? "bg-primary-600 text-white"
                    : step === s.id
                    ? "bg-primary-100 text-primary-700 ring-2 ring-primary-400"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                {step > s.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-5 h-5" />
                )}
              </div>
              <span className="text-sm font-semibold hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-3 rounded ${
                  step > s.id ? "bg-primary-400" : "bg-neutral-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">
              Informations de livraison
            </h2>
            <div className="space-y-4">
              {/* Prénom et Nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      required
                      value={guestPrenom}
                      onChange={(e) => setGuestPrenom(e.target.value)}
                      placeholder="Aline"
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Nom</label>
                  <input
                    type="text"
                    required
                    value={guestNom}
                    onChange={(e) => setGuestNom(e.target.value)}
                    placeholder="Nkomo"
                    className="input"
                  />
                </div>
              </div>

              {/* Adresse complète */}
              <div>
                <label className="label">Adresse complète</label>
                <input
                  type="text"
                  required
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex: Quartier Bastos, Rue 1.234"
                  className="input"
                />
              </div>

              {/* Ville */}
              <div>
                <label className="label">Ville</label>
                <input
                  type="text"
                  required
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="input"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="label">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="btn-primary w-full mt-6"
            >
              Continuer vers le paiement <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-sm text-neutral-900 mb-4">
              Récapitulatif de la commande
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.produit.idProduit} className="flex gap-3 items-center">
                  <img
                    src={item.produit.imageProduit}
                    alt={item.produit.nomProduit}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                      {item.produit.nomProduit}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.quantiteProduit} × {formatPrice(item.produit.prixProduit)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatPrice(item.produit.prixProduit * item.quantiteProduit)}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t border-neutral-200 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Sous-total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Livraison</span>
                <span>{deliveryFee === 0 ? "Gratuit" : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Total</span>
                <span className="text-primary-700 text-lg">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          <div className="card p-6">
            <h2 className="font-display font-bold text-lg text-neutral-900 mb-4">
              Mode de paiement
            </h2>
            <div className="space-y-3">
              {[
                { id: "mobile_money" as const, label: "Mobile Money", desc: "MTN / Orange Money", icon: Smartphone },
                { id: "especes" as const, label: "Espèces à la livraison", desc: "Payez quand vous recevez", icon: Banknote },
                { id: "carte" as const, label: "Carte bancaire", desc: "Visa / Mastercard", icon: CreditCard },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModePaiement(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    modePaiement === m.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      modePaiement === m.id
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <m.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-neutral-900">{m.label}</p>
                    <p className="text-xs text-neutral-500">{m.desc}</p>
                  </div>
                  {modePaiement === m.id && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                Retour
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="btn-primary flex-1"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" /> Payer {formatPrice(grandTotal)}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-sm text-neutral-900 mb-4">
              Adresse de livraison
            </h3>
            <div className="text-sm text-neutral-600 space-y-1">
              <p className="font-medium text-neutral-900">{fullName}</p>
              <p>{adresse}</p>
              <p>{ville}</p>
              <p>{telephone}</p>
            </div>
            <div className="border-t border-neutral-200 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Sous-total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Livraison</span>
                <span>{deliveryFee === 0 ? "Gratuit" : formatPrice(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold text-neutral-900 pt-2 border-t border-neutral-100">
                <span>Total</span>
                <span className="text-primary-700 text-lg">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && completedOrder && (
        <div className="max-w-2xl mx-auto text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
            Commande confirmée!
          </h2>
          <p className="text-neutral-500 mb-2">
            Merci pour votre achat, {fullName}. Votre commande a été enregistrée avec succès.
          </p>
          <div className="card p-6 my-6 text-left">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-neutral-500">Référence</p>
                <p className="font-mono font-bold text-neutral-900">
                  {completedOrder.referenceCommande}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">Total payé</p>
                <p className="font-display font-bold text-lg text-primary-700">
                  {formatPrice(completedOrder.montantTotalCommande)}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>Livraison prévue</span>
                <span className="font-medium text-neutral-900">
                  Sous 24 à 48 heures
                </span>
              </div>
              <div className="flex justify-between">
                <span>Adresse</span>
                <span className="font-medium text-neutral-900">
                  {completedOrder.adresseLivraisonCommande}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Paiement</span>
                <span className="font-medium text-neutral-900 capitalize">
                  {modePaiement === "mobile_money"
                    ? "Mobile Money"
                    : modePaiement === "especes"
                    ? "Espèces à la livraison"
                    : "Carte bancaire"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link to="/compte" className="btn-primary">
                Suivre ma commande
              </Link>
            ) : (
              <Link to="/signup" className="btn-primary">
                Créer un compte pour suivre mes commandes
              </Link>
            )}
            <Link to="/catalogue" className="btn-secondary">
              Continuer mes achats
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}