'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { Upload, Trash2, Eye, Clock, Plus, Loader, AlertCircle, CheckCircle, Play, Image as ImageIcon } from 'lucide-react';

interface StatusItem {
  id: string;
  braider_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  expires_at: string;
  view_count: number;
}

export default function BraiderStatusPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseAuthStore();
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'braider')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'braider') fetchStatuses();
  }, [user]);

  const fetchStatuses = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/braider/status?braider_id=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setStatuses(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching statuses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setError('Please select an image or video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !user) return;

    if (statuses.length >= 3) {
      setError('You can only have 3 active statuses. Delete one first.');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Upload the file to storage first, then create the status record
      const fileInput = fileInputRef.current;
      const file = fileInput?.files?.[0];

      let mediaUrl = preview;

      // If we have an actual file, upload it to storage
      if (file) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload/status', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          if (uploadData.url) {
            mediaUrl = uploadData.url;
          }
        }
        // If upload fails, fall back to base64 (works for small images)
      }

      const res = await fetch('/api/braider/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          braider_id: user.id,
          media_url: mediaUrl,
          media_type: mediaType,
          caption: caption || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create status');
      }

      setPreview(null);
      setCaption('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Status shared! It will expire in 24 hours.');
      setTimeout(() => setSuccess(null), 3000);
      await fetchStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (statusId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/braider/status?status_id=${statusId}&braider_id=${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatuses(prev => prev.filter(s => s.id !== statusId));
        setSuccess('Status deleted.');
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (err) {
      setError('Failed to delete status');
    }
  };

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader className="w-8 h-8 text-purple-600 animate-spin"/></div>;
  if (!user || user.role !== 'braider') return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-pink-600 text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">📸 My Status</h1>
          <p className="text-purple-100 text-sm">Share images & videos — visible for 24 hours, max 3 at a time</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-600" />
            Share New Status
            <span className="ml-auto text-xs text-gray-400 font-normal">{statuses.length}/3 active</span>
          </h2>

          {preview ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                {mediaType === 'video' ? (
                  <video src={preview} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                )}
                <button
                  onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-lg hover:bg-black/70"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || statuses.length >= 3}
                  className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? <><Loader className="w-4 h-4 animate-spin" /> Sharing...</> : '🚀 Share Status'}
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => statuses.length < 3 && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                statuses.length >= 3
                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer'
              }`}
            >
              <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="font-semibold text-gray-700 text-sm">
                {statuses.length >= 3 ? 'Delete a status to add new one' : 'Tap to upload image or video'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Max 50MB • Images & Videos</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Active Statuses */}
        <div>
          <h2 className="font-bold text-gray-900 mb-3">Active Statuses ({statuses.length}/3)</h2>
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="w-6 h-6 text-purple-500 animate-spin"/></div>
          ) : statuses.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
              <div className="text-4xl mb-2">📸</div>
              <p className="text-gray-500 text-sm">No active statuses. Share your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {statuses.map(status => (
                <div key={status.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      {status.media_type === 'video' ? (
                        <>
                          <video src={status.media_url} className="w-full h-full object-cover" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        </>
                      ) : (
                        <img src={status.media_url} alt="Status" className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {status.caption && <p className="text-sm text-gray-700 line-clamp-2 mb-1">{status.caption}</p>}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{status.view_count} views</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeLeft(status.expires_at)}</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          status.media_type === 'video' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {status.media_type === 'video' ? <Play className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          {status.media_type}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(status.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
