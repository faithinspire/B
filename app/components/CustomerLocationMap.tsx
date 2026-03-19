'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader, AlertCircle, MapPin } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface BraiderLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  heading: number;
  created_at: string;
}

interface LocationHistoryPoint {
  latitude: number;
  longitude: number;
  created_at: string;
}

interface CustomerLocationMapProps {
  braiderLocation?: BraiderLocation;
  locationHistory?: LocationHistoryPoint[];
  customerLocation?: {
    latitude: number;
    longitude: number;
  };
  braiderName?: string;
}

export function CustomerLocationMap({
  braiderLocation,
  locationHistory = [],
  customerLocation,
  braiderName = 'Braider',
}: CustomerLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const hasApiKey = !!apiKey && apiKey.length > 10;

    if (!hasApiKey) {
      setError('no-api-key');
      setLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setLoading(true);

        // Check if Google Maps is already loaded
        if (!window.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existing) {
              if (window.google?.maps) { resolve(); return; }
              existing.addEventListener('load', () => resolve());
              return;
            }
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps'));
            document.head.appendChild(script);
          });
        }

        if (!window.google?.maps || !mapRef.current) {
          setError('Failed to load Google Maps');
          setLoading(false);
          return;
        }

        // Determine center
        const center = braiderLocation
          ? { lat: braiderLocation.latitude, lng: braiderLocation.longitude }
          : customerLocation
            ? { lat: customerLocation.latitude, lng: customerLocation.longitude }
            : { lat: 40.7128, lng: -74.006 }; // Default to NYC

        // Create map
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: false,
          zoomControl: true,
        });

        mapInstanceRef.current = mapInstance;

        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        // Add braider marker
        if (braiderLocation) {
          const braiderMarker = new window.google.maps.Marker({
            position: {
              lat: braiderLocation.latitude,
              lng: braiderLocation.longitude,
            },
            map: mapInstance,
            title: braiderName,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#9333ea',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });

          const braiderInfo = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${braiderName}</h3>
                <p class="text-sm text-gray-600">Accuracy: ${(braiderLocation.accuracy ?? 0).toFixed(0)}m</p>
              </div>
            `,
          });

          braiderMarker.addListener('click', () => {
            braiderInfo.open(mapInstance, braiderMarker);
          });

          markersRef.current.push(braiderMarker);
        }

        // Add customer marker
        if (customerLocation) {
          const customerMarker = new window.google.maps.Marker({
            position: {
              lat: customerLocation.latitude,
              lng: customerLocation.longitude,
            },
            map: mapInstance,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
          });

          const customerInfo = new window.google.maps.InfoWindow({
            content: '<div class="p-2"><h3 class="font-semibold text-gray-900">Your Location</h3></div>',
          });

          customerMarker.addListener('click', () => {
            customerInfo.open(mapInstance, customerMarker);
          });

          markersRef.current.push(customerMarker);
        }

        // Draw route from location history
        if (locationHistory.length > 1) {
          const path = locationHistory.map((loc) => ({
            lat: loc.latitude,
            lng: loc.longitude,
          }));

          if (polylineRef.current) {
            polylineRef.current.setMap(null);
          }

          polylineRef.current = new window.google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#9333ea',
            strokeOpacity: 0.7,
            strokeWeight: 3,
            map: mapInstance,
          });
        }

        // Zoom to fit all markers
        if (markersRef.current.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          markersRef.current.forEach((marker) => {
            bounds.extend(marker.getPosition());
          });
          mapInstance.fitBounds(bounds);
        }

        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    initMap();
  }, [braiderLocation, customerLocation, locationHistory, braiderName]);

  return (
    <div className="w-full h-full relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      )}

      {error === 'no-api-key' ? (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center p-4">
            <MapPin className="w-10 h-10 text-primary-600 mx-auto mb-2" />
            <p className="text-gray-700 font-semibold text-sm">Braider Location</p>
            {braiderLocation ? (
              <div className="mt-2 text-xs text-gray-600">
                <p>{braiderName} is at:</p>
                <p className="font-mono mt-1">{braiderLocation.latitude.toFixed(5)}, {braiderLocation.longitude.toFixed(5)}</p>
                <p className="mt-1 text-gray-400">Last updated: {new Date(braiderLocation.created_at).toLocaleTimeString()}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Waiting for braider location...</p>
            )}
          </div>
        </div>
      ) : error ? (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-600 font-semibold text-sm">{error}</p>
          </div>
        </div>
      ) : null}

      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}
