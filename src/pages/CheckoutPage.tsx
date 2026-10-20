import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  MapPin,
  CreditCard,
  PackageCheck,
  ShoppingBag,
  Wallet,
  Banknote,
  Smartphone,
  User,
  Phone,
  MessageCircle,
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { orderService } from "../services/order.service";
import { deliveryService } from "../services/delivery.service";
import { notchPayService } from "../services/notchpay.service";
import { formatPrice } from "../lib/format";
import { BUSINESS } from "../lib/db";
import type { Commande } from "../lib/types";

interface CheckoutPageProps {
  currentLang?: "FR" | "EN";
}

export default function CheckoutPage({ currentLang = "FR" }: CheckoutPageProps) {
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

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

  const STEPS = [
    { id: 1, label: currentLang === "FR" ? "Livraison" : "Delivery", icon: MapPin },
    { id: 2, label: currentLang === "FR" ? "Paiement" : "Payment", icon: CreditCard },
    { id: 3, label: currentLang === "FR" ? "Confirmation" : "Confirmation", icon: PackageCheck },
  ];

  if (items.length === 0 && !completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500 mb-4">
          {currentLang === "FR" ? "Votre panier est vide." : "Your cart is empty."}
        </p>
        <Link to="/catalogue" className="btn-primary">
          {currentLang === "FR" ? "Explorer le catalogue" : "Browse catalog"}
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    setProcessing(true);
    const clientId = user?.client.idClient ?? 0;
    const transactionId = "CMD_" + Date.now();

    let finalPaymentMode = modePaiement;

    // Si le client choisit Mobile Money ou Carte, on tente d'abord Notch Pay
    if (modePaiement === "mobile_money" || modePaiement === "carte") {
      try {
        const paymentResponse = await notchPayService.initiatePayment({
          amount: grandTotal,
          currency: "XAF",
          email: `${guestPrenom.toLowerCase()}.${guestNom.toLowerCase()}@client.local`,
          name: `${guestPrenom} ${guestNom}`,
          phone: telephone,
          description: `Commande Verhojust - ${items.length} article(s)`,
          reference: transactionId,
          callback_url: window.location.href,
        });

        if (!paymentResponse.success) {
          notify(
            currentLang === "FR"
              ? "Guichet en ligne indisponible. Basculement automatique vers le paiement à la livraison."
              : "Online payment unavailable. Automatically switching to cash on delivery."
          );
          finalPaymentMode = "especes";
        }
      } catch (err) {
        console.warn("Échec NotchPay, basculement automatique sur espèces :", err);
        notify(
          currentLang === "FR"
            ? "Problème de connexion au guichet en ligne. Votre commande est enregistrée en espèces à la livraison."
            : "Online gateway error. Order confirmed with Cash on Delivery."
        );
        finalPaymentMode = "especes";
      }
    }

    // Création garantie de la commande en BDD (Mobile Money validé ou basculé en espèces)
    try {
      const commande = await orderService.createOrder({
        idClient: clientId,
        adresseLivraisonCommande: `${adresse}, ${ville}`,
        modePaiementCommande: finalPaymentMode,
        items,
        guestInfo: {
          nom: guestNom,
          prenom: guestPrenom,
          email: `${guestPrenom.toLowerCase()}.${guestNom.toLowerCase()}@client.local`,
          telephone,
        },
      });

      await orderService.finalizeSale(commande.idCommande, finalPaymentMode);
      await deliveryService.createDelivery(
        commande.idCommande,
        `${adresse}, ${ville}`
      );

      await clearCart();
      setCompletedOrder(commande);
      setStep(3);

      if (finalPaymentMode === "especes" && modePaiement !== "especes") {
        notify(
          currentLang === "FR"
            ? "Commande enregistrée avec succès ! Vous réglerez en espèces à la livraison."
            : "Order recorded! You will pay cash on delivery."
        );
      } else {
        notify(
          currentLang === "FR"
            ? "Votre commande est en cours de traitement !"
            : "Your order is being processed!"
        );
      }
    } catch (error) {
      console.error(error);
      notify(
        currentLang === "FR"
          ? "Erreur lors de la création de la commande"
          : "Error creating order",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  const fullName = `${guestPrenom} ${guestNom}`;

  // Fonction pour envoyer l'alerte sur WhatsApp
  const handleWhatsAppAlert = () => {
    if (!completedOrder) return;
    const adminPhone = "+237671461340";
    const message = encodeURIComponent(
      currentLang === "FR"
        ? `🔔 ALERTE COMMANDE\n\n` +
          `Statut : Votre commande est en cours de traitement\n` +
          `Référence : ${completedOrder.referenceCommande}\n` +
          `Client : ${fullName} (${telephone})\n` +
          `Adresse : ${adresse}, ${ville}\n` +
          `Montant Total : ${formatPrice(grandTotal)}\n` +
          `Paiement : ${
            completedOrder.modePaiementCommande === "mobile_money"
              ? "Mobile Money"
              : completedOrder.modePaiementCommande === "especes"
              ? "Espèces à la livraison"
              : "Carte bancaire"
          }`
        : `🔔 ORDER ALERT\n\n` +
          `Status : Your order is being processed\n` +
          `Reference : ${completedOrder.referenceCommande}\n` +
          `Customer : ${fullName} (${telephone})\n` +
          `Address : ${adresse}, ${ville}\n` +
          `Total Amount : ${formatPrice(grandTotal)}\n` +
          `Payment : ${
            completedOrder.modePaiementCommande === "mobile_money"
              ? "Mobile Money"
              : completedOrder.modePaiementCommande === "especes"
              ? "Cash on delivery"
              : "Credit Card"
          }`
    );
    window.open(`https://wa.me/${adminPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-neutral-900 mb-8">
        {currentLang === "FR" ? "Finaliser ma commande" : "Checkout"}
      </h1>

      {/* Guest notice */}
      {isGuest && step === 1 && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-primary-50 border-primary-200">
          <User className="w-5 h-5 text-primary-600 shrink-0" />
          <p className="text-sm text-primary-800">
            {currentLang === "FR" ? (
              <>
                Vous commandez en tant qu'invité.{" "}
                <Link to="/login" className="font-semibold underline hover:text-primary-900">
                  Connectez-vous
                </Link>{" "}
                pour retrouver vos informations rapidement.
              </>
            ) : (
              <>
                You are checking out as a guest.{" "}
                <Link to="/login" className="font-semibold underline hover:text-primary-900">
                  Log in
                </Link>{" "}
                to auto-fill your details.
              </>
            )}
          </p>
        </div>
      )}

      {/* Steps */}
      <div className="flex items-center justify-center mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => {
                if (s.id < step && step !== 3) {
                  setStep(s.id);
                }
              }}
              disabled={s.id >= step || step === 3}
              className={`flex items-center gap-2.5 transition-all ${
                s.id < step && step !== 3 ? "cursor-pointer hover:opacity-80" : "cursor-default"
              } ${step >= s.id ? "text-primary-700" : "text-neutral-400"}`}
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
            </button>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg text-neutral-900">
                {currentLang === "FR" ? "Informations de livraison" : "Delivery Information"}
              </h2>
              <button
                onClick={() => navigate("/panier")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-primary-600 bg-neutral-100 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{currentLang === "FR" ? "Retour au panier" : "Back to cart"}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{currentLang === "FR" ? "Prénom" : "First Name"}</label>
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
                  <label className="label">{currentLang === "FR" ? "Nom" : "Last Name"}</label>
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

              <div>
                <label className="label">{currentLang === "FR" ? "Adresse complète" : "Full Address"}</label>
                <input
                  type="text"
                  required
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder={currentLang === "FR" ? "Ex: Quartier Bastos, Rue 1.234" : "Ex: Bastos neighborhood, Street 1.234"}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{currentLang === "FR" ? "Ville" : "City"}</label>
                <input
                  type="text"
                  required
                  value={ville}
                  onChange={(e) => setVille(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">{currentLang === "FR" ? "Téléphone" : "Phone"}</label>
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
              {currentLang === "FR" ? "Continuer vers le paiement" : "Continue to payment"} <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-sm text-neutral-900 mb-4">
              {currentLang === "FR" ? "Récapitulatif de la commande" : "Order Summary"}
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((item) => {
                const isKilo = item.typeAchat === "kilo";
                const uniteDetail = item.produit.uniteDetailProduit || "Détail";
                const unitPrice = isKilo
                  ? (item.produit.prixKiloProduit || 0)
                  : (item.produit.prixBoiteProduit || 0);
                const unitLabel = isKilo ? "kg" : uniteDetail;
                const badgeLabel = isKilo ? "Kg" : uniteDetail;

                return (
                  <div key={`${item.produit.idProduit}-${item.typeAchat || uniteDetail}`} className="flex gap-3 items-center">
                    <img
                      src={item.produit.imageProduit}
                      alt={item.produit.nomProduit}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-neutral-900 line-clamp-1">
                          {item.produit.nomProduit}
                        </p>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          isKilo ? "bg-amber-100 text-amber-800" : "bg-primary-100 text-primary-800"
                        }`}>
                          {badgeLabel}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {item.quantiteProduit} {unitLabel} × {formatPrice(unitPrice)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatPrice(unitPrice * item.quantiteProduit)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-neutral-200 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>{currentLang === "FR" ? "Sous-total" : "Subtotal"}</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>{currentLang === "FR" ? "Livraison" : "Delivery"}</span>
                <span>
                  {deliveryFee === 0
                    ? currentLang === "FR" ? "Gratuit" : "Free"
                    : formatPrice(deliveryFee)}
                </span>
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
              {currentLang === "FR" ? "Mode de paiement" : "Payment Method"}
            </h2>
            <div className="space-y-3">
              {[
                {
                  id: "mobile_money" as const,
                  label: "Mobile Money",
                  desc: "MTN / Orange Money",
                  icon: Smartphone,
                },
                {
                  id: "especes" as const,
                  label: currentLang === "FR" ? "Espèces à la livraison" : "Cash on delivery",
                  desc: currentLang === "FR" ? "Payez quand vous recevez" : "Pay upon receipt",
                  icon: Banknote,
                },
                {
                  id: "carte" as const,
                  label: currentLang === "FR" ? "Carte bancaire" : "Credit Card",
                  desc: "Visa / Mastercard",
                  icon: CreditCard,
                },
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
              <button onClick={() => setStep(1)} className="btn-secondary flex-1 inline-flex items-center justify-center gap-1.5">
                <ChevronLeft className="w-4 h-4" />
                <span>{currentLang === "FR" ? "Retour à la livraison" : "Back"}</span>
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="btn-primary flex-1"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {currentLang === "FR" ? "Traitement..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" /> {currentLang === "FR" ? "Payer" : "Pay"} {formatPrice(grandTotal)}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-sm text-neutral-900 mb-4">
              {currentLang === "FR" ? "Adresse de livraison" : "Delivery Address"}
            </h3>
            <div className="text-sm text-neutral-600 space-y-1 mb-6">
              <p className="font-medium text-neutral-900">{fullName}</p>
              <p>{adresse}</p>
              <p>{ville}</p>
              <p>{telephone}</p>
            </div>

            <h3 className="font-semibold text-sm text-neutral-900 mb-3">
              {currentLang === "FR" ? "Articles de la commande" : "Order Items"}
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
              {items.map((item) => {
                const isKilo = item.typeAchat === "kilo";
                const uniteDetail = item.produit.uniteDetailProduit || "Détail";
                const unitPrice = isKilo ? (item.produit.prixKiloProduit || 0) : (item.produit.prixBoiteProduit || 0);
                const unitLabel = isKilo ? "kg" : uniteDetail;
                return (
                  <div key={`${item.produit.idProduit}-${item.typeAchat || uniteDetail}`} className="flex justify-between text-xs text-neutral-600">
                    <span>{item.quantiteProduit} {unitLabel} × {item.produit.nomProduit}</span>
                    <span className="font-medium">{formatPrice(unitPrice * item.quantiteProduit)}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-neutral-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>{currentLang === "FR" ? "Sous-total" : "Subtotal"}</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>{currentLang === "FR" ? "Livraison" : "Delivery"}</span>
                <span>
                  {deliveryFee === 0
                    ? currentLang === "FR" ? "Gratuit" : "Free"
                    : formatPrice(deliveryFee)}
                </span>
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
          <h2 className="font-display text-3xl font-bold text-neutral-900 mb-2">
            {currentLang === "FR"
              ? "Votre commande est en cours de traitement !"
              : "Your order is being processed!"}
          </h2>
          <p className="text-neutral-500 mb-6">
            {currentLang === "FR"
              ? `Merci pour votre achat, ${fullName}. Nous préparons votre commande avec soin.`
              : `Thank you for your purchase, ${fullName}. We are preparing your order with care.`}
          </p>

          {/* Bouton d'alerte WhatsApp */}
          <div className="mb-6">
            <button
              onClick={handleWhatsAppAlert}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              {currentLang === "FR" ? "Informer le vendeur sur WhatsApp" : "Notify seller on WhatsApp"}
            </button>
          </div>

          <div className="card p-6 my-6 text-left">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Référence" : "Reference"}</p>
                <p className="font-mono font-bold text-neutral-900">
                  {completedOrder.referenceCommande}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500">{currentLang === "FR" ? "Total payé" : "Total paid"}</p>
                <p className="font-display font-bold text-lg text-primary-700">
                  {formatPrice(completedOrder.montantTotalCommande)}
                </p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-neutral-600">
              <div className="flex justify-between">
                <span>{currentLang === "FR" ? "Livraison prévue" : "Estimated delivery"}</span>
                <span className="font-medium text-neutral-900">
                  {currentLang === "FR" ? "Sous 24 à 48 heures" : "Within 24 to 48 hours"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{currentLang === "FR" ? "Adresse" : "Address"}</span>
                <span className="font-medium text-neutral-900">
                  {completedOrder.adresseLivraisonCommande}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{currentLang === "FR" ? "Paiement" : "Payment"}</span>
                <span className="font-medium text-neutral-900 capitalize">
                  {completedOrder.modePaiementCommande === "mobile_money"
                    ? "Mobile Money"
                    : completedOrder.modePaiementCommande === "especes"
                    ? currentLang === "FR" ? "Espèces à la livraison" : "Cash on delivery"
                    : currentLang === "FR" ? "Carte bancaire" : "Credit Card"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <Link to="/compte" className="btn-primary">
                {currentLang === "FR" ? "Suivre ma commande" : "Track my order"}
              </Link>
            ) : (
              <Link to="/signup" className="btn-primary">
                {currentLang === "FR" ? "Créer un compte pour suivre mes commandes" : "Create an account to track orders"}
              </Link>
            )}
            <Link to="/catalogue" className="btn-secondary">
              {currentLang === "FR" ? "Continuer mes achats" : "Continue shopping"}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}