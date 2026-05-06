'use client';

import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, Loader, X } from 'lucide-react';
import { NIGERIAN_STATES } from '@/lib/nigerian-locations';

interface PremiumSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (country: string, location: string) => void;
}

export function PremiumSearchModal({ isOpen, onClose, onSearch }: PremiumSearchModalProps) {
  const [step, setStep] = useState<'country' | 'location'>('country');
  const [selectedCountry, setSelectedCountry] = useState<'NG' | 'US' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nigerianStates = Object.keys(NIGERIAN_STATES);
  const usCities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
    'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston'
  ];

  const handleCountrySelect = (country: 'NG' | 'US') => {
    setSelectedCountry(country);
    setStep('location');
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setIsLoading(true);
    
    setTimeout(() => {
      onSearch(selectedCountry === 'NG' ? 'Nigeria' : 'USA', location);
      setIsLoading(false);
      onClose();
      setStep('country');
      setSelectedCountry(null);
      setSelectedLocation('');
    }, 600);
  };

  const handleBack = () => {
    setStep('country');
    setSelectedCountry(null);
    setSelectedLocation('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 animate-scale-in">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-3xl" />
          </div>
          
          <div className="relative h-full flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-white mb-2">Find Braiders</h1>
            <p className="text-white/80 text-sm">Premium professionals near you</p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {step === 'country' ? (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-gray-600 font-medium mb-6">Select your country</p>
              
              {/* Nigeria Option */}
              <button
                onClick={() => handleCountrySelect('NG')}
                className="w-full group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-emerald-400/0 group-hover:from-green-400/10 group-hover:to-emerald-400/10 transition-all" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🇳🇬</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Find Braiders in Nigeria</p>
                      <p className="text-sm text-gray-600">36 states + major cities</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* USA Option */}
              <button
                onClick={() => handleCountrySelect('US')}
                className="w-full group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-cyan-400/0 group-hover:from-blue-400/10 group-hover:to-cyan-400/10 transition-all" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🇺🇸</span>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Find Braiders in USA</p>
                      <p className="text-sm text-gray-600">20+ major cities</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
                </button>
                <p className="text-sm text-gray-600 font-medium">
                  Select {selectedCountry === 'NG' ? 'a state' : 'a city'}
                </p>
              </div>

              {/* Locations Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                {(selectedCountry === 'NG' ? nigerianStates : usCities).map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationSelect(location)}
                    disabled={isLoading}
                    className="group relative overflow-hidden rounded-xl p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 hover:border-primary-400 hover:from-primary-50 hover:to-primary-100 transition-all duration-300 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-400/0 to-accent-400/0 group-hover:from-primary-400/10 group-hover:to-accent-400/10 transition-all" />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 text-left">{location}</span>
                      {isLoading && selectedLocation === location && (
                        <Loader className="w-4 h-4 text-primary-600 animate-spin" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            {step === 'country' 
              ? 'Choose your country to find verified braiders'
              : 'Select a location to see available braiders'}
          </p>
        </div>
      </div>
    </div>
  );
}
