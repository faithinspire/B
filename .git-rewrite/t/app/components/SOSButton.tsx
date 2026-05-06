'use client';

import { useState } from 'react';
import { AlertTriangle, Loader, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SOSButtonProps {
  bookingId: string;
  userId: string;
  onSuccess?: () => void;
}

export function SOSButton({ bookingId, userId, onSuccess }: SOSButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSOS = async () => {
    setLoading(true);

    try {
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setLocation(loc);

            // Send SOS alert
            const response = await fetch(`/api/bookings/${bookingId}/sos`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                location: loc,
                incident_type: 'emergency',
                description: 'SOS Emergency Alert',
              }),
            });

            if (!response.ok) {
              throw new Error('Failed to send SOS alert');
            }

            toast.success('Emergency alert sent! Support team notified.');
            onSuccess?.();
            setShowConfirm(false);
          },
          () => {
            // If geolocation fails, send without location
            sendSOSAlert(null);
          }
        );
      } else {
        sendSOSAlert(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send SOS alert');
    } finally {
      setLoading(false);
    }
  };

  const sendSOSAlert = async (loc: { lat: number; lng: number } | null) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          location: loc,
          incident_type: 'emergency',
          description: 'SOS Emergency Alert',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SOS alert');
      }

      toast.success('Emergency alert sent! Support team notified.');
      onSuccess?.();
      setShowConfirm(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send SOS alert');
    }
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 sm:p-8">
          <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
          </div>

          <h2 className="text-xl sm:text-2xl font-serif font-bold text-center mb-2">
            Emergency Alert
          </h2>
          <p className="text-gray-600 text-center text-sm sm:text-base mb-6">
            Are you sure you need emergency assistance? This will alert our support team and the other party immediately.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-smooth font-semibold text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleSOS}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-smooth font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Send Alert
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-smooth font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
    >
      <AlertTriangle className="w-5 h-5" />
      SOS Emergency
    </button>
  );
}
