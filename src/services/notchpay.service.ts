// src/services/notchpay.service.ts

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
  async initiatePayment(data: NotchPayPaymentData) {
    const publicKey = import.meta.env.VITE_NOTCHPAY_PUBLIC_KEY;

    const payload = {
      amount: data.amount,
      currency: data.currency || "XAF",
      email: data.email,
      name: data.name,
      phone: data.phone,
      description: data.description,
      reference: data.reference,
      callback: data.callback_url,
    };

    try {
      const response = await fetch("https://api.notchpay.co/checkout/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": publicKey,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.status === "Accepted" && result.authorization_url) {
        return {
          success: true,
          payment_url: result.authorization_url,
          reference: result.transaction?.reference || data.reference,
          data: result,
        };
      } else {
        return {
          success: false,
          message: result.message || "Erreur lors de l'initialisation du paiement Notch Pay",
          data: result,
        };
      }
    } catch (error) {
      console.error("Erreur Notch Pay:", error);
      throw error;
    }
  },
};