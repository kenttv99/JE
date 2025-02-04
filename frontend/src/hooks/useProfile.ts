// NEW FILE: frontend/src/hooks/useProfile.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { TraderProfile } from '@/types/trader';

export function useProfile() {
  const [profile, setProfile] = useState<TraderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<TraderProfile>('/api/v1/traders/profile');
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<TraderProfile>) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.patch<TraderProfile>('/api/v1/traders/profile', data);
      setProfile(response.data);
      return { success: true };
    } catch (err) {
      setError('Failed to update profile');
      console.error('Profile update error:', err);
      return { success: false, error: 'Failed to update profile' };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile
  };
}