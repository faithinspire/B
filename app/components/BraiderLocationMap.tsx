'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Navigation, Clock, Route, Loader } from 'lucide-react';

declare global {
  interface Window { google: any; }
}

interface LocationData {
  id: string;
  booking_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  created_at: string;
}

interface BraiderLocationMapProps {
  booking_id: string;
  braiderCurrentLocation?: { lat: number; lng: number } | null;
}

export function BraiderLocationMap({ booking_id, braiderCurrentLocation }: BraiderLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const braiderMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [customerLocation, setCustomerLocation] = useState<LocationData | null>(null);
  const [braiderPos, setBraiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Get braider's own GPS position
  useEffect(() => {
    if (braiderCurrentLocation) {
      setBraiderPos(braiderCurrentLocation);
      return;
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setBraiderPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, [braiderCurrentLocation]);

  // Fetch customer location from DB
  useEffect(() => {
    if (!supabase || !booking_id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('location_tracking')
        .select('*')
        .eq('booking_id', booking_id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]) setCustomerLocation(data[0]);
    };
    fetch();
  }, [booking_id]);

  // Subscribe to live customer location updates
  useEffect(() => {
    if (!supabase || !booking_id) return;
    const ch = supabase
      .channel(`blm_${booking_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'location_tracking',
        filter: `booking_id=eq.${booking_id}`,
      }, (payload) => {
        setCustomerLocation(payload.new as LocationData);
      })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [booking_id]);

  // Load Google Maps
  useEffect(() => {
    if (!apiKey || apiKey.length < 10) { setNoApiKey(true); setLoading(false); return; }
    if (window.google?.maps) { setMapsReady(true); return; }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) { existing.addEventListener('load', () => setMapsReady(true)); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=directions`;
    script.async = true; script.defer = true;
    script.onload = () => setMapsReady(true);
    script.onerror = () => { setNoApiKey(true); setLoading(false); };
    document.head.appendChild(script);
  }, [apiKey]);

  const updateMap = useCallback(async () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    const custPos = customerLocation
      ? { lat: customerLocation.latitude, lng: customerLocation.longitude }
      : null;

    // Customer marker
    if (custPos) {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.setPosition(custPos);
      } else {
        customerMarkerRef.current = new window.google.maps.Marker({
          position: custPos,
          map: mapInstanceRef.current,
          title: 'Customer',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
        new window.google.maps.InfoWindow({ content: '<b>Customer Location</b>' })
          .open(mapInstanceRef.current, customerMarkerRef.current);
      }
    }

    // Braider marker (your position)
    if (braiderPos) {
      if (braiderMarkerRef.current) {
        braiderMarkerRef.current.setPosition(braiderPos);
      } else {
        braiderMarkerRef.current = new window.google.maps.Marker({
          position: braiderPos,
          map: mapInstanceRef.current,
          title: 'You',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#9333ea',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
        });
      }
    }

    // Directions
    if (braiderPos && custPos) {
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
          destination: custPos,
          travelMode: window.google.maps.TravelMode.DRIVING,
        });
        directionsRendererRef.current.setDirections(result);
        const leg = result.routes[0]?.legs[0];
        if (leg) setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });
      } catch {
        const bounds = new window.google.maps.LatLngBounds();
        if (braiderPos) bounds.extend(braiderPos);
        if (custPos) bounds.extend(custPos);
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  }, [customerLocation, braiderPos]);

  // Init map
  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    const center = customerLocation
      ? { lat: customerLocation.latitude, lng: customerLocation.longitude }
      : braiderPos || { lat: 51.505, lng: -0.09 };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 14, center,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    setLoading(false);
    updateMap();
  }, [mapsReady]); // eslint-disable-line

  useEffect(() => {
    if (mapInstanceRef.current) updateMap();
  }, [updateMap]);

  if (noApiKey) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg p-4 gap-2">
        <MapPin className="w-8 h-8 text-blue-600" />
        <p className="font-semibold text-gray-800 text-sm">Customer Location</p>
        {customerLocation ? (
          <div className="text-center">
            <p className="text-xs text-gray-600 font-mono">
              {customerLocation.latitude.toFixed(5)}, {customerLocation.longitude.toFixed(5)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Updated {new Date(customerLocation.created_at).toLocaleTimeString()}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No customer location yet</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {routeInfo && (
        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 border-b border-blue-100 text-xs flex-shrink-0">
          <div className="flex items-center gap-1 text-blue-700">
            <Route className="w-3.5 h-3.5" />
            <span className="font-semibold">{routeInfo.distance}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-700">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-semibold">{routeInfo.duration}</span>
          </div>
          <div className="flex items-center gap-1 text-green-600 ml-auto">
            <Navigation className="w-3.5 h-3.5" />
            <span>Route active</span>
          </div>
        </div>
      )}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <Loader className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full rounded-lg" />
        {!customerLocation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 rounded-lg">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Customer location not shared yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
