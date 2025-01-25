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
    console.log('UseEffect triggered');
    console.log('Status:', status);
    console.log('Session:', session);

    const fetchUserData = async () => {
      if (!session?.accessToken) {
        console.log('No access token found in session');
        return;
      }
      
      setLoading(true);
      try {
        // Log the request details
        console.log('Making API request with token:', session.accessToken.slice(0, 10) + '...');
        
        const response = await axiosInstance.get<APIUser>('/api/v1/users/profile', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
        
        // Log successful response
        console.log('API Response:', response.data);
        
        if (response.data) {
          setUserData(response.data);
          setError(null);
        } else {
          console.log('Response data is empty');
          setError('No data received from server');
        }
      } catch (error: any) {
        // Detailed error logging
        console.error('Error details:', {
          message: error.message,
          response: error.response,
          status: error.response?.status,
          data: error.response?.data
        });
        setError(error.response?.data?.detail || 'Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have an authenticated session
    if (status === 'authenticated' && session?.accessToken) {
      console.log('Initiating data fetch...');
      fetchUserData();
    }
  }, [status, session]);

  // Debug render state
  useEffect(() => {
    console.log('Component state:', {
      loading,
      userData,
      error,
      status,
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken
    });
  }, [loading, userData, error, status, session]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        <div className="mb-4 text-sm text-gray-500">
          Status: {status} {/* Debug info */}
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