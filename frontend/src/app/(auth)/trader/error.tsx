// frontend/src/app/(auth)/admin/error.tsx
'use client';

import { useEffect } from 'react';
import NavigationButtons from '@/components/NavigationButtons';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center py-8 px-6 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так!</h2>
        <p className="text-gray-600 mb-4">Произошла ошибка при загрузке страницы</p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Попробовать снова
          </button>
          <div className="pt-2">
            <NavigationButtons />
          </div>
        </div>
      </div>
    </div>
  );
}