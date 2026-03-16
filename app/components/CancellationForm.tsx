'use client';

import { useState } from 'react';
import { AlertTriangle, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface CancellationFormProps {
  bookingId: string;
  userId: string;
  appointmentDate: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CancellationForm({
  bookingId,
  userId,
  appointmentDate,
  totalAmount,
  onClose,
  onSuccess,
}: CancellationFormProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate refund amount based on time until appointment
  const appointmentTime = new Date(appointmentDate);
  const now = new Date();
  const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundAmount = totalAmount;
  let cancellationFee = 0;

  if (hoursUntil < 12) {
    refundAmount = 0;
    cancellationFee = totalAmount;
  } else if (hoursUntil < 24) {
    refundAmount = totalAmount * 0.5;
    cancellationFee = totalAmount * 0.5;
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          cancelled_by: userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg sm:text-xl font-serif font-bold">Cancel Booking</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-smooth"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleCancel} className="p-4 sm:p-6 space-y-6">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-700">
              <p className="font-semibold mb-1">Cancellation Policy</p>
              <p>
                {hoursUntil < 12
                  ? 'Less than 12 hours before appointment - No refund'
                  : hoursUntil < 24
                  ? '12-24 hours before appointment - 50% refund'
                  : 'More than 24 hours before appointment - Full refund'}
              </p>
            </div>
          </div>

          {/* Refund Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-semibold">${totalAmount.toFixed(2)}</span>
            </div>
            {cancellationFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cancellation Fee:</span>
                <span className="font-semibold text-red-600">-${cancellationFee.toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Refund Amount:</span>
              <span className="font-bold text-lg text-primary-600">${refundAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for cancellation *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please let us know why you're cancelling..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth text-sm"
              rows={4}
              disabled={loading}
              required
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Note:</strong> The braider will be notified of your cancellation. Refunds are processed within 3-5 business days.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-smooth font-semibold text-sm sm:text-base"
            >
              Keep Booking
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-smooth font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Cancel Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
