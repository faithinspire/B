'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Clock, Route, Loader, Satellite, Map } from 'lucide-react';

declare global {
  interface Window { google: any; }
}

interface LocationData {
  id?: string;
  booking_id?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  created_at?: string;
}

interface BraiderLocationMapProps {
  booking_id: string;
  braiderCurrentLocation?: { lat: number; lng: number } | null;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const miles = km * 0.621371;
  const mins = Math.round((km / 30) * 60);
  return {
    km: km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`,
    miles: `${miles.toFixed(1)}mi`,
    mins: mins < 1 ? '<1 min' : `~${mins} min`,
  };
}

export function BraiderLocationMap({ booking_id, braiderCurrentLocation }: BraiderLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const braiderMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const [customerLocation, setCustomerLocation] = useState<LocationData | null>(null);
  const [braiderPos, setBraiderPos] = useState<{ lat: number; lng: number } | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; miles: string; duration: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapsReady, setMapsReady] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (braiderCurrentLocation) { setBraiderPos(braiderCurrentLocation); return; }
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
    const fetchLoc = async () => {
      const { data } = await supabase!.from('location_tracking').select('*')
        .eq('booking_id', booking_id).order('created_at', { ascending: false }).limit(1);
      if (data?.[0]) setCustomerLocation(data[0]);
    };
    fetchLoc();
  }, [booking_id]);

  // Real-time customer location
  useEffect(() => {
    if (!supabase || !booking_id) return;
    const ch = supabase.channel(`blm_${booking_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_tracking', filter: `booking_id=eq.${booking_id}` },
        (payload) => { setCustomerLocation(payload.new as LocationData); })
      .subscribe();
    return () => { supabase?.removeChannel(ch); };
  }, [booking_id]);

  // Haversine distance
  useEffect(() => {
    if (braiderPos && customerLocation) {
      const d = haversineDistance(braiderPos.lat, braiderPos.lng, customerLocation.latitude, customerLocation.longitude);
      setRouteInfo({ distance: d.km, miles: d.miles, duration: d.mins });
    }
  }, [braiderPos, customerLocation]);

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

  const toggleMapType = useCallback(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const next = !isSatellite;
    setIsSatellite(next);
    mapInstanceRef.current.setMapTypeId(next ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP);
  }, [isSatellite]);

  const updateMap = useCallback(async () => {
    if (!mapInstanceRef.current || !window.google?.maps) return;
    const custPos = customerLocation ? { lat: customerLocation.latitude, lng: customerLocation.longitude } : null;

    if (custPos) {
      if (customerMarkerRef.current) { customerMarkerRef.current.setPosition(custPos); }
      else {
        customerMarkerRef.current = new window.google.maps.Marker({
          position: custPos, map: mapInstanceRef.current, title: 'Customer',
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#3b82f6', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        });
      }
    }
    if (braiderPos) {
      if (braiderMarkerRef.current) { braiderMarkerRef.current.setPosition(braiderPos); }
      else {
        braiderMarkerRef.current = new window.google.maps.Marker({
          position: braiderPos, map: mapInstanceRef.current, title: 'You',
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#9333ea', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
        });
      }
    }
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
        const result = await directionsService.route({ origin: braiderPos, destination: custPos, travelMode: window.google.maps.TravelMode.DRIVING });
        directionsRendererRef.current.setDirections(result);
        const leg = result.routes[0]?.legs[0];
        if (leg) setRouteInfo({ distance: leg.distance.text, miles: '', duration: leg.duration.text });
      } catch {
        const bounds = new window.google.maps.LatLngBounds();
        if (braiderPos) bounds.extend(braiderPos);
        if (custPos) bounds.extend(custPos);
        mapInstanceRef.current.fitBounds(bounds);
      }
    }
  }, [customerLocation, braiderPos]);

  useEffect(() => {
    if (!mapsReady || !mapRef.current) return;
    const center = customerLocation ? { lat: customerLocation.latitude, lng: customerLocation.longitude } : braiderPos || { lat: 51.505, lng: -0.09 };
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      zoom: 14, center,
      mapTypeId: isSatellite ? window.google.maps.MapTypeId.HYBRID : window.google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
    });
    setLoading(false);
    updateMap();
  }, [mapsReady]); // eslint-disable-line

  useEffect(() => { if (mapInstanceRef.current) updateMap(); }, [updateMap]);

  if (noApiKey) {
    return (
      <div className="w-full h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-blue-400"/>
            <span className="text-xs text-blue-400 font-semibold">GPS Tracking</span>
          </div>
          {braiderPos && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>}
        </div>
        {routeInfo && (
          <div className="flex items-center gap-3 px-3 py-2 bg-blue-900/60 border-b border-blue-700 text-xs">
            <div className="flex items-center gap-1 text-blue-300">
              <Route className="w-3.5 h-3.5"/>
              <span className="font-bold">{routeInfo.distance}</span>
              {routeInfo.miles && <span className="text-blue-400">({routeInfo.miles})</span>}
            </div>
            <div className="flex items-center gap-1 text-blue-300">
              <Clock className="w-3.5 h-3.5"/>
              <span className="font-bold">{routeInfo.duration}</span>
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-3">
          <div className="relative w-full flex-1 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 60% 40%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 30% 60%, #9333ea 0%, transparent 50%)' }}/>
            {customerLocation && (
              <div className="absolute" style={{ top: '40%', left: '55%' }}>
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"/>
                <div className="text-xs text-white font-semibold mt-1 bg-blue-700/80 px-1.5 py-0.5 rounded">Customer</div>
              </div>
            )}
            {braiderPos && (
              <div className="absolute" style={{ top: '55%', left: '30%' }}>
                <div className="w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg animate-pulse"/>
                <div className="text-xs text-white font-semibold mt-1 bg-purple-700/80 px-1.5 py-0.5 rounded">You</div>
              </div>
            )}
            {braiderPos && customerLocation && (
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                <line x1="30%" y1="55%" x2="55%" y2="40%" stroke="#9333ea" strokeWidth="2" strokeDasharray="4,4" opacity="0.6"/>
              </svg>
            )}
            {!customerLocation && (
              <div className="text-center">
                <MapPin className="w-8 h-8 text-gray-500 mx-auto mb-2"/>
                <p className="text-xs text-gray-400">Customer location not shared</p>
              </div>
            )}
          </div>
          {braiderPos && (
            <div className="w-full bg-gray-800 rounded-lg p-2 text-xs text-gray-300 font-mono">
              <div className="flex justify-between">
                <span className="text-purple-400">Your position:</span>
                <span>{braiderPos.lat.toFixed(5)}, {braiderPos.lng.toFixed(5)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {routeInfo && (
        <div className="flex items-center gap-3 px-3 py-2 bg-blue-50 border-b border-blue-100 text-xs flex-shrink-0">
          <div className="flex items-center gap-1 text-blue-700">
            <Route className="w-3.5 h-3.5"/>
            <span className="font-semibold">{routeInfo.distance}</span>
            {routeInfo.miles && <span className="text-blue-400">({routeInfo.miles})</span>}
          </div>
          <div className="flex items-center gap-1 text-blue-700">
            <Clock className="w-3.5 h-3.5"/>
            <span className="font-semibold">{routeInfo.duration}</span>
          </div>
          <button onClick={toggleMapType} className="ml-auto flex items-center gap-1 px-2 py-0.5 bg-blue-100 hover:bg-blue-200 rounded-full text-blue-700 transition-colors">
            {isSatellite ? <Map className="w-3 h-3"/> : <Satellite className="w-3 h-3"/>}
            <span>{isSatellite ? 'Map' : 'Satellite'}</span>
          </button>
        </div>
      )}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <Loader className="w-7 h-7 text-blue-600 animate-spin"/>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full rounded-lg"/>
        {!routeInfo && !loading && mapInstanceRef.current && (
          <button onClick={toggleMapType}
            className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-white/90 hover:bg-white rounded-full text-gray-700 text-xs shadow-md transition-colors">
            {isSatellite ? <Map className="w-3 h-3"/> : <Satellite className="w-3 h-3"/>}
            <span>{isSatellite ? 'Map' : 'Satellite'}</span>
          </button>
        )}
        {!customerLocation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 rounded-lg">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2"/>
              <p className="text-sm text-gray-500">Customer location not shared yet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
