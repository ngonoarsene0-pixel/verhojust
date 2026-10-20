// src/services/notchpay.service.ts

declare const NotchPay: any;

interface NotchPayPaymentData {
  amount: number;
  currency?: string;
  email: string;
  name?: string;
  phone?: string;
  description?: string;
  reference?: string;
  callback_url?: string;
}

// Fonction qui charge automatiquement le script NotchPay s'il manque dans la page
const loadNotchPayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof NotchPay !== "undefined") {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://e.notchpay.co/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const notchPayService = {
  async initiatePayment(data: NotchPayPaymentData): Promise<any> {
    const publicKey = import.meta.env.VITE_NOTCHPAY_PUBLIC_KEY;

    // On s'assure que le SDK est chargé avant d'ouvrir la fenêtre de paiement
    const isLoaded = await loadNotchPayScript();
    if (!isLoaded || typeof NotchPay === "undefined") {
      throw new Error("Impossible de charger le guichet de paiement NotchPay.");
    }

    return new Promise((resolve, reject) => {
      NotchPay.init({
        key: publicKey,
        amount: data.amount,
        currency: data.currency || "XAF",
        email: data.email,
        phone: data.phone,
        reference: data.reference,
        description: data.description,
        callback: data.callback_url,
        onComplete: (response: any) => {
          resolve({
            success: true,
            data: response,
          });
        },
        onCancel: () => {
          resolve({
            success: false,
            message: "Paiement annulé par l'utilisateur",
          });
        },
        onError: (error: any) => {
          reject(error);
        },
      });
    });
  },
};