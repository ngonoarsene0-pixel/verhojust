import { BUSINESS } from "./db";

export function formatPrice(amount: number): string {
  const fcfaFormatted = new Intl.NumberFormat("fr-FR").format(amount) + " " + BUSINESS.currency;
  const usdAmount = (amount / 600).toFixed(2);
  return `${fcfaFormatted} ($${usdAmount})`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}