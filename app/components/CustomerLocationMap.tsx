'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader, MapPin, Navigation, Clock, Route } from 'lucide-react';

declare global {
  interface Window { google: any; }
}

interface BraiderLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  created_at?: string;
}

interface CustomerLocationMapProps {
  braiderLocation?: BraiderLocation | null;
  braiderName?: string;
  bookingId?: string;
}

export function CustomerLocationMap({
  braiderLocation,
  braiderName = 'Braider',
  bookingId,
}: CustomerLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const braiderMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Get customer's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silent fail
      );
    }
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (!apiKey || apiKey.length < 10) { setNoApiKey(true); setLoading(false); return; }
    if (window.google?.maps) { setMapsReady(true); return; }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => setMapsReady(true));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=directions`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapsReady(true);
    script.onerror = () => { setNoApiKey(true); setLoading(false); };
    document.head.appendChild(script);
  }, [apiKey]);

  const updateRoute = useCallback(async () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    if (!braiderLocation || !customerLocation) return;

    const braiderPos = { lat: braiderLocation.latitude, lng: braiderLocation.longitude };
    const customerPos = customerLocation;

    // Update braider marker
    if (braiderMarkerRef.current) {
      braiderMarkerRef.current.setPosition(braiderPos);
    } else {
      braiderMarkerRef.current = new window.google.maps.Marker({
        position: braiderPos,
        map: mapInstanceRef.current,
        title: braiderName,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#9333ea',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        label: { text: '✂', color: '#fff', fontSize: '12px' },
      });
      new window.google.maps.InfoWindow({ content: `<b>${braiderName}</b><br>On the way` })
        .open(mapInstanceRef.current, braiderMarkerRef.current);
    }

    // Update customer marker
    if (customerMarkerRef.current) {
      customerMarkerRef.current.setPosition(customerPos);
    } else {
      customerMarkerRef.current = new window.google.maps.Marker({
        position: customerPos,
        map: mapInstanceRef.current,
        title: 'Your Location',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
    }

    // Draw directions route
    const directionsService = new window.google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: { strokeColor: '#9333ea', strokeWeight: 4, strokeOpacity: 0.8 },
      });
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    }

    try {
      const result = await directionsService.route({
        origin: braiderPos,
        destination: customerPos,
        travelMode: window.google.maps.TravelMode.DRIVING,
      });
      directionsRendererRef.current.setDirections(result);
      const leg = result.routes[0]?.legs[0];
      if (leg) {
        setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
      }
    } catch {
      // Fallback: just fit bounds
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(braiderPos);
      bounds.extend(customerPos);
      mapInstanceRef.current.fitBounds(bounds);
    }
  }, [braiderLocation, customerLocation, braiderName]);

  // Init map once Maps is ready
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;

    const center = braiderLocation
      ? { lat: braiderLocation.latitude, lng: braiderLocation.longitude }
      : customerLocation || { lat: 51.505, lng: -0.09 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 14,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setLoading(false);
    updateRoute();
  }, [mapsReady]); // eslint-disable-line

  // Update route when locations change
  useEffect(() => {
    if (mapInstanceRef.current) updateRoute();
  }, [updateRoute]);

  // Fallback UI when no API key
  if (noApiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 gap-2">
        <MapPin className="w-8 h-8 text-purple-600" />
        <p className="font-semibold text-gray-800 text-sm">{braiderName}</p>
        {braiderLocation ? (
          <div className="text-center">
            <p className="text-xs text-gray-600 font-mono">
              {braiderLocation.latitude.toFixed(5)}, {braiderLocation.longitude.toFixed(5)}
            </p>
            {braiderLocation.created_at && (
              <p className="text-xs text-gray-400 mt-1">
                Updated {new Date(braiderLocation.created_at).toLocaleTimeString()}
              </p>
            )}
            <p className="text-xs text-green-600 mt-2 font-semibold">● Sharing location</p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">Waiting for braider location...</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* Route info bar */}
      {routeInfo && (
        <div className="flex items-center gap-3 px-3 py-2 bg-purple-50 border-b border-purple-100 text-xs flex-shrink-0">
          <div className="flex items-center gap-1 text-purple-700">
            <Route className="w-3.5 h-3.5" />
            <span className="font-semibold">{routeInfo.distance}</span>
          </div>
          <div className="flex items-center gap-1 text-purple-700">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{routeInfo.duration} away</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 ml-auto">
            <Navigation className="w-3.5 h-3.5" />
            <span>Live</span>
          </div>
        </div>
      )}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <Loader className="w-7 h-7 text-purple-600 animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full rounded-lg" />
        {!braiderLocation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 rounded-lg">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Waiting for braider to share location...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
