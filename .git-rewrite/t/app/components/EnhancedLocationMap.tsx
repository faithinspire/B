'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, ExternalLink, AlertCircle, Loader } from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

interface EnhancedLocationMapProps {
  braiderLocation?: LocationData;
  customerLocation?: LocationData;
  braiderName?: string;
  bookingId?: string;
}

export function EnhancedLocationMap({
  braiderLocation,
  customerLocation,
  braiderName = 'Braider',
  bookingId,
}: EnhancedLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
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
  };

  // Initialize Google Map
  useEffect(() => {
    if (!mapRef.current || !braiderLocation) return;

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if Google Maps API is loaded
        if (!window.google) {
          throw new Error('Google Maps API not loaded');
        }

        const map = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center: { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          streetViewControl: false,
        });

        mapInstanceRef.current = map;

        // Add braider marker
        new window.google.maps.Marker({
          position: { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
          map,
          title: braiderName,
          icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          animation: window.google.maps.Animation.DROP,
        });

        // Add customer marker if available
        if (customerLocation) {
          new window.google.maps.Marker({
            position: { lat: customerLocation.latitude, lng: customerLocation.longitude },
            map,
            title: 'Your Location',
            icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            animation: window.google.maps.Animation.DROP,
          });

          // Draw line between markers
          new window.google.maps.Polyline({
            path: [
              { lat: braiderLocation.latitude, lng: braiderLocation.longitude },
              { lat: customerLocation.latitude, lng: customerLocation.longitude },
            ],
            geodesic: true,
            strokeColor: '#4f46e5',
            strokeOpacity: 0.7,
            strokeWeight: 2,
            map,
          });

          // Calculate distance
          const dist = calculateDistance(
            braiderLocation.latitude,
            braiderLocation.longitude,
            customerLocation.latitude,
            customerLocation.longitude
          );
          setDistance(dist);

          // Fit bounds to show both markers
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
  }, [braiderLocation, customerLocation, braiderName]);

  const openGoogleMaps = () => {
    if (!braiderLocation) return;

    const url = `https://www.google.com/maps/search/${braiderLocation.latitude},${braiderLocation.longitude}`;
    window.open(url, '_blank');
  };

  const openDirections = () => {
    if (!braiderLocation || !customerLocation) return;

    const url = `https://www.google.com/maps/dir/${customerLocation.latitude},${customerLocation.longitude}/${braiderLocation.latitude},${braiderLocation.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary-600" />
            Live Location
          </h3>
          {braiderLocation && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        {distance !== null && (
          <p className="text-xs sm:text-sm text-gray-600">
            Distance: <span className="font-semibold">{distance.toFixed(1)} km</span>
          </p>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative min-h-96 sm:min-h-[500px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-2" />
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

      {/* Footer with Actions */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={openGoogleMaps}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Maps
          </button>
          {customerLocation && braiderLocation && (
            <button
              onClick={openDirections}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </button>
          )}
        </div>

        {/* Location Details */}
        {braiderLocation && (
          <div className="text-xs text-gray-600 space-y-1 p-2 bg-white rounded border border-gray-200">
            <p><strong>Braider:</strong> {braiderLocation.latitude.toFixed(4)}, {braiderLocation.longitude.toFixed(4)}</p>
            {braiderLocation.accuracy && <p><strong>Accuracy:</strong> ±{braiderLocation.accuracy.toFixed(0)}m</p>}
            {braiderLocation.speed !== undefined && <p><strong>Speed:</strong> {(braiderLocation.speed * 3.6).toFixed(1)} km/h</p>}
            {braiderLocation.timestamp && <p><strong>Updated:</strong> {new Date(braiderLocation.timestamp).toLocaleTimeString()}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
