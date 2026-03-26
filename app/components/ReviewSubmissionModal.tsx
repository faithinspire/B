'use client';

import { useState } from 'react';
import { Star, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReviewSubmissionModalProps {
  bookingId: string;
  braiderId: string;
  braiderName: string;
  reviewerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewSubmissionModal({
  bookingId,
  braiderId,
  braiderName,
  reviewerId,
  onClose,
  onSuccess,
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerId) { toast.error('You must be logged in to leave a review'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          reviewer_id: reviewerId,
          braider_id: braiderId,
          rating,
          comment: comment || null,
          photos: [],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit review');

      toast.success('Review submitted!');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg sm:text-xl font-serif font-bold">Review {braiderName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-smooth" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">How was your experience?</label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)} className="transition-transform hover:scale-110">
                  <Star className={`w-8 h-8 sm:w-10 sm:h-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Share your feedback (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth text-sm"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-smooth font-semibold text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-smooth font-semibold text-sm flex items-center justify-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
