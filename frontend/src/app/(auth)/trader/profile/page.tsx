'use client';

import { useSession } from 'next-auth/react';

export default function TraderProfile() {
  const { data: session } = useSession();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trader Profile</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <p className="mt-1">{session?.user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Verification Level</label>
            <p className="mt-1">{session?.user?.verification_level ?? 'Not verified'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">Status</label>
            <p className="mt-1">
              Pay In: {session?.user?.pay_in ? 'Enabled' : 'Disabled'}<br />
              Pay Out: {session?.user?.pay_out ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}