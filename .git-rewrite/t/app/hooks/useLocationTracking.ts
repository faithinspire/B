'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UseLocationTrackingReturn {
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  currentLocation: { latitude: number; longitude: number } | null;
  error: string | null;
  accuracy: number | null;
}

export function useLocationTracking(
  bookingId: string,
  braiderId: string,
  enabled: boolean = false
): UseLocationTrackingReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ latitude: number; longitude: number; speed: number; heading: number } | null>(null);

  // Request GPS permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        return false;
      }

      // Check if permission API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setError('Location permission denied. Please enable it in your browser settings.');
          return false;
        }
      }

      return true;
    } catch (err) {
      console.error('Permission check error:', err);
      return true; // Continue anyway, browser will prompt
    }
  }, []);

  // Send location to server
  const sendLocationToServer = useCallback(
    async (latitude: number, longitude: number, accuracy: number, speed: number, heading: number) => {
      try {
        const response = await fetch('/api/location/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bookingId,
            braider_id: braiderId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send location');
        }

        setError(null);
      } catch (err) {
        console.error('Error sending location:', err);
        setError(err instanceof Error ? err.message : 'Failed to send location');
      }
    },
    [bookingId, braiderId]
  );

  // Start tracking
  const startTracking = useCallback(async () => {
    try {
      setError(null);

      // Request permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return;
      }

      if (!navigator.geolocation) {
        setError('Geolocation is not supported');
        return;
      }

      setIsTracking(true);

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const speed = position.coords.speed || 0;
          const heading = position.coords.heading || 0;

          setCurrentLocation({ latitude, longitude });
          setAccuracy(accuracy);
          lastLocationRef.current = { latitude, longitude, speed, heading };

          // Send to server
          sendLocationToServer(latitude, longitude, accuracy, speed, heading);
        },
        (err) => {
          console.error('Geolocation error:', err);
          if (err.code === 1) {
            setError('Location permission denied');
          } else if (err.code === 2) {
            setError('Location unavailable');
          } else if (err.code === 3) {
            setError('Location request timeout');
          } else {
            setError('Failed to get location');
          }
          setIsTracking(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      // Watch position for continuous updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          const speed = position.coords.speed || 0;
          const heading = position.coords.heading || 0;

          setCurrentLocation({ latitude, longitude });
          setAccuracy(accuracy);
          lastLocationRef.current = { latitude, longitude, speed, heading };
        },
        (err) => {
          console.error('Watch position error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      // Send location every 10 seconds
      trackingIntervalRef.current = setInterval(() => {
        if (lastLocationRef.current) {
          const { latitude, longitude, speed, heading } = lastLocationRef.current;
          sendLocationToServer(latitude, longitude, accuracy || 0, speed, heading);
        }
      }, 10000);
    } catch (err) {
      console.error('Start tracking error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start tracking');
      setIsTracking(false);
    }
  }, [requestPermission, sendLocationToServer, accuracy]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    setIsTracking(false);
    setError(null);
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !isTracking) {
      startTracking();
    } else if (!enabled && isTracking) {
      stopTracking();
    }

    return () => {
      // Cleanup on unmount
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [enabled, isTracking, startTracking, stopTracking]);

  return {
    isTracking,
    startTracking,
    stopTracking,
    currentLocation,
    error,
    accuracy,
  };
}
