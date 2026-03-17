'use client';

import { useState } from 'react';
import { Download, Printer, AlertCircle, Loader } from 'lucide-react';

interface ReceiptDownloaderProps {
  paymentIntentId?: string;
  bookingId?: string;
  amount?: number;
  braiderName?: string;
  serviceName?: string;
}

export function ReceiptDownloader({
  paymentIntentId,
  bookingId,
  amount,
  braiderName,
  serviceName,
}: ReceiptDownloaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (paymentIntentId) params.append('paymentIntentId', paymentIntentId);
      if (bookingId) params.append('bookingId', bookingId);
      params.append('format', 'html');

      const response = await fetch(`/api/payments/receipt?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const html = await response.text();

      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${bookingId || paymentIntentId || 'payment'}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to download receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (paymentIntentId) params.append('paymentIntentId', paymentIntentId);
      if (bookingId) params.append('bookingId', bookingId);
      params.append('format', 'html');

      const response = await fetch(`/api/payments/receipt?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate receipt');
      }

      const html = await response.text();

      // Open in new window and print
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (err) {
      console.error('Error printing receipt:', err);
      setError(err instanceof Error ? err.message : 'Failed to print receipt');
    } finally {
      setLoading(false);
    }
  };

  if (!paymentIntentId && !bookingId) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDownloadReceipt}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download Receipt
        </button>

        <button
          onClick={handlePrintReceipt}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:py-3 bg-accent-600 hover:bg-accent-700 disabled:bg-gray-400 text-white rounded-lg transition-smooth text-xs sm:text-sm font-semibold"
        >
          {loading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          Print Receipt
        </button>
      </div>

      {amount && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs sm:text-sm text-green-700">
            <strong>Amount Paid:</strong> ${amount.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">✓ Payment confirmed and receipt ready</p>
        </div>
      )}
    </div>
  );
}
