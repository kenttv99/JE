"use client";

import { useRouter } from 'next/navigation';

const NavigationButtons = () => {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('./login');
  };

  const handleProfileClick = () => {
    router.push('./profile');
  };

  return (
    <div className="flex gap-4 mt-4">
      <button 
        onClick={handleLoginClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Авторизоваться
      </button>
      <button 
        onClick={handleProfileClick}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        Перейти в Профиль
      </button>
    </div>
  );
};

export default NavigationButtons;