'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import NavigationButtons from '@/components/NavigationButtons';
import axiosInstance from '@/lib/api';
import { APIUser } from '@/types';

export default function UserPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<APIUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (session?.accessToken) {
        try {
          const response = await axiosInstance.get<APIUser>('/api/v1/users/profile', {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });
          setUserData(response.data);
          setError(null);
        } catch (error: any) {
          console.error('Error fetching user data:', error);
          setError(error.response?.data?.detail || 'Failed to fetch user data');
        }
      }
      setLoading(false);
    };

    if (status === 'authenticated' && session?.accessToken) {
      fetchUserData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [status, session?.accessToken]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          Please log in to view this page.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-between p-24">
        <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p>{error}</p>
          <div className="mt-8">
            <NavigationButtons />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        {userData && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Email:</p>
              <p>{userData.email}</p>
            </div>
            <div>
              <p className="font-semibold">Full Name:</p>
              <p>{userData.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold">Phone Number:</p>
              <p>{userData.phone_number || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold">Telegram Username:</p>
              <p>{userData.telegram_username || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold">Verification Level:</p>
              <p>{userData.verification_level}</p>
            </div>
            <div>
              <p className="font-semibold">Member Since:</p>
              <p>{new Date(userData.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="font-semibold">Last Updated:</p>
              <p>{new Date(userData.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        )}
        <div className="mt-8">
          <NavigationButtons />
        </div>
      </div>
    </div>
  );
}