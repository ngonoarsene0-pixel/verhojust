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

export const notchPayService = {
  async initiatePayment(data: NotchPayPaymentData): Promise<any> {
    const publicKey = import.meta.env.VITE_NOTCHPAY_PUBLIC_KEY;

    return new Promise((resolve, reject) => {
      if (typeof NotchPay === "undefined") {
        reject(new Error("Le SDK NotchPay n'est pas encore chargé dans la page."));
        return;
      }

      // Initialisation du pop-up de paiement NotchPay
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