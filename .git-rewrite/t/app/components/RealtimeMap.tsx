'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader, MapPin } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

interface Location {
  latitude: number;
  longitude: number;
  name: string;
  type: 'braider' | 'customer';
}

interface RealtimeMapProps {
  braiderLocation?: Location;
  customerLocation?: Location;
  distance?: number;
  eta?: number;
}

function CoordinateFallback({
  braiderLocation,
  customerLocation,
  distance,
  eta,
}: RealtimeMapProps) {
  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg bg-gray-50 flex flex-col items-center justify-center gap-4 p-6">
      <MapPin className="w-10 h-10 text-primary-600" />
      <p className="text-gray-600 font-semibold text-sm">Live Map</p>
      <div className="w-full space-y-3 max-w-xs">
        {braiderLocation && (
          <div className="bg-purple-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-purple-700">Braider: {braiderLocation.name}</p>
            <p className="text-xs text-purple-600">
              {braiderLocation.latitude.toFixed(5)}, {braiderLocation.longitude.toFixed(5)}
            </p>
          </div>
        )}
        {customerLocation && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700">Customer: {customerLocation.name}</p>
            <p className="text-xs text-blue-600">
              {customerLocation.latitude.toFixed(5)}, {customerLocation.longitude.toFixed(5)}
            </p>
          </div>
        )}
        {(distance !== undefined || eta !== undefined) && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            {distance !== undefined && (
              <p className="text-xs text-gray-700">Distance: <span className="font-semibold">{distance.toFixed(2)} miles</span></p>
            )}
            {eta !== undefined && (
              <p className="text-xs text-gray-700">ETA: <span className="font-semibold">{eta} minutes</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function RealtimeMap({
  braiderLocation,
  customerLocation,
  distance,
  eta,
}: RealtimeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasApiKey = !!apiKey && apiKey.length > 10;

  useEffect(() => {
    if (!hasApiKey || !mapRef.current) {
      setLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setLoading(true);

        if (!window.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existing) {
              // Wait for it to load if already in DOM
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
          setError('Google Maps failed to load');
          setLoading(false);
          return;
        }

        const center = braiderLocation
          ? { lat: braiderLocation.latitude, lng: braiderLocation.longitude }
          : { lat: 40.7128, lng: -74.006 };

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center,
          mapTypeControl: true,
          fullscreenControl: true,
          streetViewControl: true,
        });

        if (braiderLocation) {
          new window.google.maps.Marker({
            position: { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
            map: mapInstance,
            title: 'Braider Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
          });
        }

        if (customerLocation) {
          new window.google.maps.Marker({
            position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
            map: mapInstance,
            title: 'Customer Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          });
        }

        if (braiderLocation && customerLocation) {
          const directionsService = new window.google.maps.DirectionsService();
          const directionsRenderer = new window.google.maps.DirectionsRenderer();
          directionsRenderer.setMap(mapInstance);

          directionsService.route(
            {
              origin: { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
              destination: { lat: customerLocation.latitude, lng: customerLocation.longitude },
              travelMode: window.google.maps.TravelMode.DRIVING,
            },
            (result: any, status: any) => {
              if (status === window.google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
              }
            }
          );
        }

        setMapReady(true);
        setLoading(false);
      } catch (err) {
        setError('Error initializing map');
        setLoading(false);
      }
    };

    initMap();
  }, [braiderLocation, customerLocation, hasApiKey, apiKey]);

  if (!hasApiKey) {
    return (
      <CoordinateFallback
        braiderLocation={braiderLocation}
        customerLocation={customerLocation}
        distance={distance}
        eta={eta}
      />
    );
  }

  if (error) {
    return (
      <CoordinateFallback
        braiderLocation={braiderLocation}
        customerLocation={customerLocation}
        distance={distance}
        eta={eta}
      />
    );
  }

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden shadow-lg relative">
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <Loader className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />

      {mapReady && (distance !== undefined || eta !== undefined) && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-2">Trip Info</h3>
          <div className="space-y-2 text-sm">
            {distance !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">Distance:</span>
                <span className="font-semibold">{distance.toFixed(2)} miles</span>
              </div>
            )}
            {eta !== undefined && (
              <div className="flex justify-between">
                <span className="text-gray-600">ETA:</span>
                <span className="font-semibold">{eta} minutes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
