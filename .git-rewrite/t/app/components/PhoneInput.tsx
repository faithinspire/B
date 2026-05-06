'use client';

import { useState, useEffect } from 'react';
import { CountryCode, getCountryConfig, normalizePhoneNumber, formatPhoneNumber, validatePhoneNumber, getPhonePlaceholder } from '@/lib/countries';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  country: CountryCode;
  label?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  country,
  label = 'Phone Number',
  placeholder,
  error,
  required = false,
  disabled = false,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const config = getCountryConfig(country);

  // Update display value when value or country changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value, country));
      setIsValid(validatePhoneNumber(value, country));
    } else {
      setDisplayValue('');
      setIsValid(false);
    }
  }, [value, country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;

    // Remove all non-digit characters except + at the start
    let cleaned = input.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = '+' + cleaned.slice(1).replace(/\D/g, '');
    } else {
      cleaned = cleaned.replace(/\D/g, '');
    }

    // Update display value with formatting
    setDisplayValue(input);

    // Normalize and validate
    if (cleaned) {
      try {
        const normalized = normalizePhoneNumber(cleaned, country);
        const valid = validatePhoneNumber(normalized, country);
        setIsValid(valid);
        onChange(normalized);
      } catch (err) {
        setIsValid(false);
        onChange(cleaned);
      }
    } else {
      setIsValid(false);
      onChange('');
    }
  };

  const handleBlur = () => {
    if (displayValue && value) {
      // Format on blur
      setDisplayValue(formatPhoneNumber(value, country));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-3 text-2xl pointer-events-none">
          {config.flag}
        </div>

        <div className="absolute left-14 top-3 text-gray-500 font-medium pointer-events-none">
          {config.dialCode}
        </div>

        <input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder || getPhonePlaceholder(country)}
          disabled={disabled}
          className={`w-full pl-24 pr-12 py-3 border-2 rounded-lg font-mono text-sm transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
              : isValid && displayValue
              ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
              : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
          } focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        {/* Status icon */}
        {displayValue && (
          <div className="absolute right-4 top-3">
            {isValid ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && displayValue && (
        <p className="mt-2 text-xs text-gray-500">
          {isValid ? (
            <span className="text-green-600">✓ Valid phone number</span>
          ) : (
            <span className="text-orange-600">
              Expected format: {config.phoneFormat}
            </span>
          )}
        </p>
      )}

      {/* Format hint */}
      {!displayValue && (
        <p className="mt-2 text-xs text-gray-500">
          Format: {config.phoneFormat}
        </p>
      )}
    </div>
  );
}
