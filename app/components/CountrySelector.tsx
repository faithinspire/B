'use client';

import { useState, useEffect } from 'react';
import { COUNTRY_LIST, CountryCode, detectCountryFromIP } from '@/lib/countries';
import { ChevronDown } from 'lucide-react';

interface CountrySelectorProps {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
  label?: string;
  disabled?: boolean;
}

export function CountrySelector({
  value,
  onChange,
  label = 'Country',
  disabled = false,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    // Auto-detect country on first load if not set
    if (!value) {
      detectCountryFromIP().then((country) => {
        onChange(country);
        setAutoDetected(true);
      });
    }
  }, []);

  const selectedCountry = COUNTRY_LIST.find((c) => c.code === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {autoDetected && <span className="text-xs text-gray-500 ml-1">(auto-detected)</span>}
      </label>

      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-primary-400 focus:outline-none focus:border-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selectedCountry?.flag}</span>
          <div>
            <div className="font-medium text-gray-900">{selectedCountry?.name}</div>
            <div className="text-xs text-gray-500">{selectedCountry?.dialCode}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50">
          {COUNTRY_LIST.map((country) => (
            <button
              key={country.code}
              onClick={() => {
                onChange(country.code);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-primary-50 transition-colors ${
                value === country.code ? 'bg-primary-100 border-l-4 border-primary-600' : ''
              }`}
            >
              <span className="text-2xl">{country.flag}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{country.name}</div>
                <div className="text-xs text-gray-500">
                  {country.dialCode} • {country.currency}
                </div>
              </div>
              {value === country.code && (
                <div className="w-2 h-2 bg-primary-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
