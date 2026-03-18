'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, MapPin } from 'lucide-react';

interface LocationData {
  id: string;
  booking_id: string;
  customer_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  created_at: string;
}

interface BraiderLocationMapProps {
  booking_id: string;
}

// Fallback map when no API key is available
function MapFallback({ location }: { location: LocationData | null }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-4 gap-3">
      <MapPin className="w-10 h-10 text-primary-600" />
      {location ? (
        <div className="text-center">
          <p className="font-semibold text-gray-900 text-sm">Customer Location</p>
          <p className="text-xs text-gray-600 mt-1">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
          {location.accuracy && (
            <p className="text-xs text-gray-500">Accuracy: {location.accuracy.toFixed(0)}m</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Last updated: {new Date(location.created_at).toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No location data yet</p>
      )}
    </div>
  );
}

export function BraiderLocationMap({ booking_id }: BraiderLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [latestLocation, setLatestLocation] = useState<LocationData | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasApiKey = !!apiKey && apiKey.length > 10;

  useEffect(() => {
    const fetchLocation = async () => {
      if (!supabase) return;
      try {
        const { data: locations, error: locErr } = await supabase
          .from('location_tracking')
          .select('*')
          .eq('booking_id', booking_id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (locErr) throw locErr;
        setLatestLocation(locations?.[0] || null);
      } catch (err) {
        console.error('Error fetching location:', err);
      }
    };

    fetchLocation();
  }, [booking_id]);

  useEffect(() => {
    if (!hasApiKey || !mapRef.current) {
      setLoading(false);
      return;
    }

    const initMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load Google Maps script if not already loaded
        if (!window.google?.maps) {
          await new Promise<void>((resolve, reject) => {
            // Check if script already exists
            const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
            if (existing) {
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

        const center = latestLocation
          ? { lat: latestLocation.latitude, lng: latestLocation.longitude }
          : { lat: 40.7128, lng: -74.006 };

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 15,
          center,
          mapTypeControl: false,
          streetViewControl: false,
        });

        if (latestLocation) {
          markerRef.current = new window.google.maps.Marker({
            map: mapInstance.current,
            position: center,
            title: 'Customer Location',
          });
        }

        setMapsLoaded(true);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    initMap();
  }, [hasApiKey, apiKey, latestLocation]);

  // Subscribe to live location updates
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`braider-loc-map-${booking_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'location_tracking',
          filter: `booking_id=eq.${booking_id}`,
        },
        (payload) => {
          const location = payload.new as LocationData;
          setLatestLocation(location);

          if (mapsLoaded && mapInstance.current) {
            const newPosition = { lat: location.latitude, lng: location.longitude };
            if (markerRef.current) {
              markerRef.current.setPosition(newPosition);
            } else {
              markerRef.current = new window.google.maps.Marker({
                map: mapInstance.current,
                position: newPosition,
                title: 'Customer Location',
              });
            }
            mapInstance.current.panTo(newPosition);
          }
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [booking_id, mapsLoaded]);

  if (!hasApiKey) {
    return <MapFallback location={latestLocation} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-4">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <MapFallback location={latestLocation} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}
