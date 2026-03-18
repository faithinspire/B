'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader, AlertCircle, MapPin, Zap, Compass } from 'lucide-react';

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
  const [distanceTraveled, setDistanceTraveled] = useState(0);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate total distance traveled
  useEffect(() => {
    if (locationHistory.length < 2) {
      setDistanceTraveled(0);
      return;
    }

    let total = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      total += calculateDistance(prev.latitude, prev.longitude, curr.latitude, curr.longitude);
    }
    setDistanceTraveled(total);
  }, [locationHistory, calculateDistance]);

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

          // Add info window for braider
          const braiderInfo = new window.google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-gray-900">${braiderName}</h3>
                <p class="text-sm text-gray-600">Accuracy: ${braiderLocation.accuracy.toFixed(0)}m</p>
                <p class="text-sm text-gray-600">Speed: ${braiderLocation.speed.toFixed(1)} km/h</p>
                <p class="text-sm text-gray-600">Heading: ${braiderLocation.heading.toFixed(0)}°</p>
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
    <div className="w-full space-y-4">
      {/* Map Container */}
      <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg relative bg-gray-100">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <Loader className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        )}

        {error === 'no-api-key' ? (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
            <div className="text-center p-4">
              <MapPin className="w-10 h-10 text-primary-600 mx-auto mb-2" />
              <p className="text-gray-700 font-semibold text-sm">Location Tracking</p>
              {braiderLocation ? (
                <div className="mt-2 text-xs text-gray-600">
                  <p>{braiderName} is at:</p>
                  <p className="font-mono mt-1">{braiderLocation.latitude.toFixed(5)}, {braiderLocation.longitude.toFixed(5)}</p>
                  <p className="mt-1">Speed: {braiderLocation.speed?.toFixed(1) ?? 0} km/h</p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Waiting for braider location...</p>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-10">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-red-600 font-semibold text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Location Details */}
      {braiderLocation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Accuracy */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-primary-600" />
              <p className="text-xs text-gray-600 font-semibold">Accuracy</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{braiderLocation.accuracy.toFixed(0)}m</p>
          </div>

          {/* Speed */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-gray-600 font-semibold">Speed</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{braiderLocation.speed.toFixed(1)} km/h</p>
          </div>

          {/* Heading */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-gray-600 font-semibold">Heading</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{braiderLocation.heading.toFixed(0)}°</p>
          </div>

          {/* Distance Traveled */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-green-600" />
              <p className="text-xs text-gray-600 font-semibold">Distance</p>
            </div>
            <p className="text-lg font-bold text-gray-900">{distanceTraveled.toFixed(2)} km</p>
          </div>
        </div>
      )}

      {/* Last Updated */}
      {braiderLocation && (
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date(braiderLocation.created_at).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
