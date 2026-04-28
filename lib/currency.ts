/**
 * Currency utilities
 * Nigeria (NG) → NGN → ₦ → Paystack
 * USA     (US) → USD → $ → Stripe
 */

export const COUNTRY_CURRENCY: Record<string, { symbol: string; code: string; provider: string; flag: string }> = {
  NG: { symbol: '₦', code: 'NGN', provider: 'paystack', flag: '🇳🇬' },
  US: { symbol: '$', code: 'USD', provider: 'stripe',   flag: '🇺🇸' },
};

export function getCurrencyInfo(country?: string | null) {
  const c = (country || 'NG').toUpperCase();
  return COUNTRY_CURRENCY[c] ?? COUNTRY_CURRENCY['NG'];
}

export function formatPrice(amount: number, country?: string | null): string {
  const { symbol } = getCurrencyInfo(country);
  return `${symbol}${amount.toFixed(2)}`;
}

export function getCurrencySymbol(country?: string | null): string {
  return getCurrencyInfo(country).symbol;
}

export function getPaymentProvider(country?: string | null): string {
  return getCurrencyInfo(country).provider;
}
