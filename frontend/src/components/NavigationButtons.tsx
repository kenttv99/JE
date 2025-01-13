// frontend/src/components/NavigationButtons.tsx

import { useRouter } from 'next/navigation';

const NavigationButtons = () => {
  const router = useRouter();

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  return (
    <div className="navigation-buttons">
      <button onClick={handleLoginClick} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Авторизоваться
      </button>
      <button onClick={handleProfileClick} className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
        Перейти в Профиль
      </button>
      <style jsx>{`
        .navigation-buttons {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .bg-blue-500 {
          background-color: #3b82f6;
        }
        .bg-green-500 {
          background-color: #10b981;
        }
        .text-white {
          color: white;
        }
        .rounded {
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default NavigationButtons;