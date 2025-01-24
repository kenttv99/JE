"use client";

import NavigationButtons from '@/components/NavigationButtons';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-8 text-indigo-500">JIVA PAY</h1>
      <NavigationButtons />
    </div>
  );
}