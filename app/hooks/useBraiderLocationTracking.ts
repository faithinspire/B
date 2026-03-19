'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export function useBraiderLocationTracking(booking_id: string) {
  const { user } = useSupabaseAuthStore();
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);

  const startTracking = useCallback(async () => {
    if (!user || !booking_id) return;

    try {
      setError(null);

      // Request permission
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }

      // Start watching position
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          const timestamp = position.timestamp;

          setCurrentPosition({ lat: latitude, lng: longitude });

          try {
            // Send to server
            const response = await fetch('/api/location/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                booking_id,
                braider_id: user.id,
                latitude,
                longitude,
                accuracy,
                speed,
                heading,
                timestamp,
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to send location');
            }
          } catch (err) {
            console.error('Error sending location:', err);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(err.message);
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      setWatchId(id);
      setIsTracking(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start tracking';
      setError(message);
      setIsTracking(false);
    }
  }, [user, booking_id]);

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  }, [watchId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    isTracking,
    error,
    currentPosition,
    startTracking,
    stopTracking,
  };
}
