'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader } from 'lucide-react';

interface FollowButtonProps {
  follower_id: string;
  following_id: string;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function FollowButton({
  follower_id,
  following_id,
  onFollowChange,
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkFollowStatus();
  }, [follower_id, following_id]);

  const checkFollowStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch(
        `/api/followers?follower_id=${follower_id}&following_id=${following_id}`
      );
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.data?.length > 0);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      setLoading(true);

      if (isFollowing) {
        // Unfollow
        const response = await fetch(
          `/api/followers?follower_id=${follower_id}&following_id=${following_id}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          setIsFollowing(false);
          onFollowChange?.(false);
        }
      } else {
        // Follow
        const response = await fetch('/api/followers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ follower_id, following_id }),
        });
        if (response.ok) {
          setIsFollowing(true);
          onFollowChange?.(true);
        }
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <button
        disabled
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all opacity-50 ${className}`}
      >
        <Loader className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        isFollowing
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
      } disabled:opacity-50 ${className}`}
    >
      <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}
