'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Navigation, Phone, AlertCircle, Loader, Share2 } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

interface RealTimeLocationMapProps {
  braiderLocation?: LocationData;
  customerLocation?: LocationData;
  braiderName?: string;
  bookingId?: string;
  braiderPhone?: string;
  customerPhone?: string;
}

export function RealTimeLocationMap({
  braiderLocation,
  customerLocation,
  braiderName = 'Braider',
  bookingId,
  braiderPhone,
  customerPhone,
}: RealTimeLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<string | null>(null);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
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

  const calculateETA = useCallback((distanceKm: number, speedKmh: number = 20) => {
    if (distanceKm <= 0) return 'Arriving';
    const minutes = Math.round((distanceKm / speedKmh) * 60);
    if (minutes < 1) return 'Arriving';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }, []);

  useEffect(() => {
    if (!mapRef.current || !braiderLocation) return;

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!window.google) {
          throw new Error('Google Maps API not loaded');
        }

        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 16,
          center: { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;

        // Braider marker
        const braiderMarker = new window.google.maps.Marker({
          position: { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
          map,
          title: braiderName,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          animation: window.google.maps.Animation.DROP,
        });

        // Customer marker
        if (customerLocation) {
          new window.google.maps.Marker({
            position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
            map,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
            },
            animation: window.google.maps.Animation.DROP,
          });

          // Polyline
          new window.google.maps.Polyline({
            path: [
              { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
              { lat: customerLocation.latitude, lng: customerLocation.longitude },
            ],
            geodesic: true,
            strokeColor: '#4f46e5',
            strokeOpacity: 0.7,
            strokeWeight: 3,
            map,
          });

          // Calculate distance and ETA
          const dist = calculateDistance(
            braiderLocation.latitude,
            braiderLocation.longitude,
            customerLocation.latitude,
            customerLocation.longitude
          );
          setDistance(dist);
          setEta(calculateETA(dist, braiderLocation.speed ? braiderLocation.speed * 3.6 : 20));

          // Fit bounds
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: braiderLocation.latitude, lng: braiderLocation.longitude });
          bounds.extend({ lat: customerLocation.latitude, lng: customerLocation.longitude });
          map.fitBounds(bounds);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    initMap();
  }, [braiderLocation, customerLocation, braiderName, calculateDistance, calculateETA]);

  const openPhoneApp = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const openGoogleMaps = () => {
    if (!braiderLocation) return;
    const url = `https://www.google.com/maps/search/${braiderLocation.latitude},${braiderLocation.longitude}`;
    window.open(url, '_blank');
  };

  const shareLocation = async () => {
    if (!braiderLocation) return;
    const text = `I'm at ${braiderLocation.latitude.toFixed(4)}, ${braiderLocation.longitude.toFixed(4)}`;
    if (navigator.share) {
      navigator.share({ title: 'Location', text });
    } else {
      const url = `https://www.google.com/maps/search/${braiderLocation.latitude},${braiderLocation.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Live Tracking
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Live
          </span>
        </div>
        {distance !== null && eta && (
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span>Distance: <strong>{distance.toFixed(1)} km</strong></span>
            <span>ETA: <strong>{eta}</strong></span>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-96">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader className="w-8 h-8 text-red-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
            <div className="text-center p-4">
              <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-700 font-semibold">{error}</p>
            </div>
          </div>
        )}

        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Actions */}
      <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={openGoogleMaps}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
          >
            <Navigation className="w-4 h-4" />
            Navigate
          </button>
          {braiderPhone && (
            <button
              onClick={() => openPhoneApp(braiderPhone)}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
            >
              <Phone className="w-4 h-4" />
              Call
            </button>
          )}
        </div>

        <button
          onClick={shareLocation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
        >
          <Share2 className="w-4 h-4" />
          Share Location
        </button>

        {braiderLocation && (
          <div className="text-xs text-gray-600 space-y-1 p-2 bg-white rounded border border-gray-200">
            <p><strong>Coordinates:</strong> {braiderLocation.latitude.toFixed(4)}, {braiderLocation.longitude.toFixed(4)}</p>
            {braiderLocation.accuracy && <p><strong>Accuracy:</strong> ±{braiderLocation.accuracy.toFixed(0)}m</p>}
            {braiderLocation.speed && <p><strong>Speed:</strong> {(braiderLocation.speed * 3.6).toFixed(1)} km/h</p>}
          </div>
        )}
      </div>
    </div>
  );
}
