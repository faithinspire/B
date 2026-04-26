'use client';

import { useState, useEffect } from 'react';
import { Play, X, Eye } from 'lucide-react';

interface StatusItem {
  id: string;
  braider_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
  viewed?: boolean;
}

interface BraiderStatusProps {
  braider_id: string;
  braider_name: string;
  braider_avatar?: string;
  viewer_id?: string;
  onStatusClick?: (status: StatusItem) => void;
}

export function BraiderStatus({
  braider_id,
  braider_name,
  braider_avatar,
  viewer_id,
  onStatusClick,
}: BraiderStatusProps) {
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStatuses();
  }, [braider_id, viewer_id]);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = new URL('/api/braider/status', window.location.origin);
      url.searchParams.set('braider_id', braider_id);
      if (viewer_id) {
        url.searchParams.set('viewer_id', viewer_id);
      }

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch status');

      const data = await response.json();
      setStatuses(data.data || []);

      // Record view if viewer_id provided
      if (viewer_id && data.data?.length > 0) {
        for (const status of data.data) {
          if (!status.viewed) {
            recordView(status.id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const recordView = async (status_id: string) => {
    try {
      await fetch('/api/status/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_id, viewer_id }),
      });
    } catch (err) {
      console.error('Error recording view:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (error || statuses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {statuses.map((status) => (
        <button
          key={status.id}
          onClick={() => onStatusClick?.(status)}
          className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all group"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-200 to-pink-200 border-2 border-purple-400">
              {braider_avatar ? (
                <img src={braider_avatar} alt={braider_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">✂️</div>
              )}
            </div>
            {status.media_type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                <Play className="w-4 h-4 text-white fill-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-left">
            <p className="font-semibold text-gray-900 text-sm">{braider_name}</p>
            {status.caption && (
              <p className="text-gray-600 text-xs line-clamp-1">{status.caption}</p>
            )}
            <p className="text-gray-400 text-xs mt-0.5">
              {new Date(status.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* View count */}
          <div className="flex items-center gap-1 text-gray-500 text-xs flex-shrink-0">
            <Eye className="w-3 h-3" />
            <span>{status.view_count}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
