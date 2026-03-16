'use client';

import { useState } from 'react';
import { AlertCircle, Upload, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface DisputeFormProps {
  bookingId: string;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DisputeForm({ bookingId, userId, onClose, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState<'service_not_delivered' | 'quality_issue' | 'safety_concern' | 'other'>('quality_issue');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const reasons = [
    { value: 'service_not_delivered', label: 'Service Not Delivered' },
    { value: 'quality_issue', label: 'Quality Issue' },
    { value: 'safety_concern', label: 'Safety Concern' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/disputes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          raised_by: userId,
          reason,
          description,
          evidence_urls: evidence,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create dispute');
      }

      toast.success('Dispute submitted. Our team will review it shortly.');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg sm:text-xl font-serif font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Report Issue
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-smooth"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What's the issue? *
            </label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label key={r.value} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-600 transition-smooth">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value as any)}
                    className="w-4 h-4"
                    disabled={loading}
                  />
                  <span className="text-sm font-medium text-gray-700">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe the issue *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about what happened..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-primary-600 transition-smooth text-sm"
              rows={5}
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Add evidence (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {evidence.map((url, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                  <img src={url} alt={`Evidence ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEvidence(evidence.filter((_, i) => i !== idx))}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
              {evidence.length < 5 && (
                <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-600 transition-smooth">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <input type="file" accept="image/*" className="hidden" disabled={loading} />
                </label>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Note:</strong> Our support team will review your dispute within 24 hours. Your funds will be held securely during this time.
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-lg hover:shadow-lg disabled:opacity-50 transition-smooth font-semibold text-sm sm:text-base flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Submit Dispute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
