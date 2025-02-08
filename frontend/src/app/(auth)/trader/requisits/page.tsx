'use client';

import { useTraderRequisites } from '@/hooks/useTraderRequisites';
import RequisitesTable from '@/components/TraderRequisitesTable';

const RequisitesPage = () => {
  const { requisites, loading, error } = useTraderRequisites();

  const handleAddRequisite = () => {
    // Implement the logic to add a new trader requisite
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="bg-blue-500 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Реквизиты</h1>
            <button 
              onClick={handleAddRequisite}
              className="bg-white text-blue-500 px-4 py-2 rounded shadow"
            >
              Добавить реквизиты
            </button>
          </div>

          <div className="p-6">
            <RequisitesTable requisites={requisites} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequisitesPage;