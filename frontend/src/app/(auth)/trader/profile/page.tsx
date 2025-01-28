'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-blue-500 px-6 py-4">
        <h1 className="text-2xl font-bold text-white">Профиль трейдера</h1>
      </div>
      
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              {/* Profile Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Личная информация</h2>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {isEditing ? 'Сохранить' : 'Редактировать'}
                  </button>
                </div>
                
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      disabled
                      value={session?.user?.email || ''}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Имя</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      defaultValue={session?.user?.name || ''}
                      className="mt-1 block w-full rounded-md border-gray-300"
                    />
                  </div>
                  
                  {/* Add more profile fields as needed */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}