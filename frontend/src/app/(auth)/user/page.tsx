'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import NavigationButtons from '@/components/NavigationButtons';
import axiosInstance from '@/lib/api';
import { APIUser } from '@/types';

export default function UserPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<APIUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.accessToken) {
        console.log('No access token available');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Fetching user data with token:', session.accessToken);
        const response = await axiosInstance.get<APIUser>('/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        
        console.log('User data received:', response.data);
        setUserData(response.data);
        setError(null);
      } catch (error: any) {
        console.error('Error fetching user data:', error);
        setError(error.response?.data?.detail || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated' && session?.accessToken) {
      fetchUserData();
    }
  }, [status, session?.accessToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        <div className="mb-4 text-sm text-gray-500">
          Session Status: {status}
          {session?.accessToken ? ' (Token present)' : ' (No token)'}
        </div>
        
        {loading ? (
          <div className="text-center py-4">Loading user data...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : userData ? (
          <div className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div>
              <p className="font-semibold text-gray-700">Email:</p>
              <p className="text-gray-900">{userData.email}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Full Name:</p>
              <p className="text-gray-900">{userData.full_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Phone Number:</p>
              <p className="text-gray-900">{userData.phone_number || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Telegram Username:</p>
              <p className="text-gray-900">{userData.telegram_username || 'Not provided'}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Verification Level:</p>
              <p className="text-gray-900">{userData.verification_level}</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Member Since:</p>
              <p className="text-gray-900">
                {userData.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Not available'}
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Last Updated:</p>
              <p className="text-gray-900">
                {userData.updated_at ? new Date(userData.updated_at).toLocaleDateString() : 'Not available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-600 bg-gray-50 rounded-lg border border-gray-200">
            No user data available
          </div>
        )}
        
        <div className="mt-8">
          <NavigationButtons />
        </div>
      </div>
    </div>
  );
}