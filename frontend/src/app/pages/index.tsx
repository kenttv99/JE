// frontend/src/app/pages/index.tsx

import NavigationButtons from '../../components/NavigationButtons';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-blue-500 mb-4">
        JIVA PAY
      </h1>
      <p className="text-lg bg-gray-100 p-4 rounded-lg">
        With Love
      </p>
      <NavigationButtons />
    </main>
  );
}