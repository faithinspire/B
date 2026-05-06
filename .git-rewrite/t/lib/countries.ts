/**
 * Multi-country configuration system
 * Centralized configuration for all country-specific logic
 * Easy to extend for new countries
 */

export type CountryCode = 'NG' | 'US';

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
  phoneFormat: string;
  phoneRegex: RegExp;
  phoneLength: number;
  currency: string;
  currencySymbol: string;
  paymentGateway: 'paystack' | 'stripe';
  timezone: string;
}

export const COUNTRIES: Record<CountryCode, CountryConfig> = {
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    dialCode: '+234',
    phoneFormat: '+234 XXX XXX XXXX',
    phoneRegex: /^(\+234|0)[789]\d{9}$/,
    phoneLength: 11,
    currency: 'NGN',
    currencySymbol: '₦',
    paymentGateway: 'paystack',
    timezone: 'Africa/Lagos',
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    phoneFormat: '+1 (XXX) XXX-XXXX',
    phoneRegex: /^(\+1)?[2-9]\d{2}[2-9]\d{6}$/,
    phoneLength: 10,
    currency: 'USD',
    currencySymbol: '$',
    paymentGateway: 'stripe',
    timezone: 'America/New_York',
  },
};

export const COUNTRY_LIST = Object.values(COUNTRIES);

/**
 * Get country config by code
 */
export function getCountryConfig(code: CountryCode): CountryConfig {
  const config = COUNTRIES[code];
  if (!config) {
    throw new Error(`Unsupported country code: ${code}`);
  }
  return config;
}

/**
 * Normalize phone number to international format
 * Input: "08012345678" or "8012345678" (Nigeria)
 * Output: "+2348012345678"
 */
export function normalizePhoneNumber(phone: string, countryCode: CountryCode): string {
  const config = getCountryConfig(countryCode);
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  if (countryCode === 'NG') {
    // Handle Nigeria: 08012345678 or 2348012345678
    if (cleaned.startsWith('234')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
      return `+234${cleaned.slice(1)}`;
    }
    return `+234${cleaned}`;
  }
  
  if (countryCode === 'US') {
    // Handle USA: 2025551234 or 12025551234
    if (cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }
    return `+1${cleaned}`;
  }
  
  return `${config.dialCode}${cleaned}`;
}

/**
 * Format phone number for display
 * Input: "+2348012345678"
 * Output: "+234 801 234 5678"
 */
export function formatPhoneNumber(phone: string, countryCode: CountryCode): string {
  const config = getCountryConfig(countryCode);
  const normalized = normalizePhoneNumber(phone, countryCode);
  const cleaned = normalized.replace(/\D/g, '');
  
  if (countryCode === 'NG') {
    // Format: +234 801 234 5678
    const match = cleaned.match(/^234(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+234 ${match[1]} ${match[2]} ${match[3]}`;
    }
  }
  
  if (countryCode === 'US') {
    // Format: +1 (202) 555-1234
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return normalized;
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string, countryCode: CountryCode): boolean {
  const config = getCountryConfig(countryCode);
  const normalized = normalizePhoneNumber(phone, countryCode);
  return config.phoneRegex.test(normalized);
}

/**
 * Get placeholder for phone input
 */
export function getPhonePlaceholder(countryCode: CountryCode): string {
  const config = getCountryConfig(countryCode);
  
  if (countryCode === 'NG') {
    return '080 1234 5678';
  }
  if (countryCode === 'US') {
    return '(202) 555-1234';
  }
  
  return config.phoneFormat;
}

/**
 * Detect country from IP (simplified - in production use a service like MaxMind)
 * For now, returns default country
 */
export async function detectCountryFromIP(): Promise<CountryCode> {
  try {
    const response = await fetch('/api/user/ip');
    const data = await response.json();
    const country = data.country as CountryCode;
    
    if (COUNTRIES[country]) {
      return country;
    }
  } catch (error) {
    console.error('Failed to detect country:', error);
  }
  
  return 'NG'; // Default to Nigeria
}

/**
 * Get payment gateway for country
 */
export function getPaymentGateway(countryCode: CountryCode): 'paystack' | 'stripe' {
  return getCountryConfig(countryCode).paymentGateway;
}

/**
 * Get currency for country
 */
export function getCurrency(countryCode: CountryCode): string {
  return getCountryConfig(countryCode).currency;
}
