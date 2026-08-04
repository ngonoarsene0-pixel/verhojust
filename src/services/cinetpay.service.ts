// src/services/cinetpay.service.ts

interface CinetPayPaymentData {
  transaction_id: string;
  amount: number;
  currency: string;
  description: string;
  customer_name: string;
  customer_surname: string;
  customer_email: string;
  customer_phone_number: string;
  customer_address: string;
  customer_city: string;
  customer_country: string;
  return_url: string;
  notify_url: string;
}

export const cinetPayService = {
  async initiatePayment(data: CinetPayPaymentData) {
    const apiKey = import.meta.env.VITE_CINETPAY_API_KEY;
    const siteId = import.meta.env.VITE_CINETPAY_SITE_ID;

    const payload = {
      apikey: apiKey,
      site_id: siteId,
      transaction_id: data.transaction_id,
      amount: data.amount,
      currency: data.currency || "XAF",
      description: data.description,
      customer_name: data.customer_name,
      customer_surname: data.customer_surname,
      customer_email: data.customer_email,
      customer_phone_number: data.customer_phone_number,
      customer_address: data.customer_address,
      customer_city: data.customer_city,
      customer_country: data.customer_country || "CM",
      return_url: data.return_url,
      notify_url: data.notify_url,
      channels: "ALL",
      lang: "fr",
    };

    try {
      const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Erreur CinetPay:", error);
      throw error;
    }
  },
};