'use client';

import { useState } from 'react';
import { useTraderRequisites, useRequisiteForm } from '@/hooks/useTraderRequisites';
import RequisitesTable from '@/components/TraderRequisitesTable';
import AddTraderRequisiteModal from '@/components/AddTraderRequisiteModal';
import type { PaymentMethod, Bank, RequisiteFormData } from '@/components/AddTraderRequisiteModal';

const RequisitesPage = () => {
  const { requisites, loading: reqLoading, refetch } = useTraderRequisites();
  const {
    paymentMethods,
    banks,
    loading: formLoading,
    formData,
    formErrors,
    selectedMethod,
    handleMethodSelect,
    handleInputChange,
    addRequisite,
    resetForm
  } = useRequisiteForm();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert string arrays to proper types
  const formattedPaymentMethods: PaymentMethod[] = paymentMethods.map((method, index) => ({
    id: index + 1,
    method_name: method,
    details: null
  }));

  const formattedBanks: Bank[] = banks.map((bank, index) => ({
    id: index + 1,
    bank_name: bank,
    description: null
  }));

  const handleSubmit = async (formData: RequisiteFormData) => {
    await addRequisite();
    await refetch();
    setIsModalOpen(false);
  };

  if (reqLoading || formLoading) {
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
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">Реквизиты</h1>
            <button 
              onClick={() => {
                setIsModalOpen(true);
                resetForm();
              }}
              className="bg-white text-blue-500 px-6 py-2 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Добавить реквизиты
            </button>
          </div>

          <div className="p-6">
            <RequisitesTable 
              requisites={requisites}
              onUpdate={(updatedRequisites) => {
                if (updatedRequisites) {
                  requisites.forEach((req, index) => {
                    if (updatedRequisites[index]) {
                      requisites[index] = updatedRequisites[index];
                    }
                  });
                }
              }}
            />
          </div>
        </div>
      </div>

      <AddTraderRequisiteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        paymentMethods={formattedPaymentMethods}
        banks={formattedBanks}
      />
    </div>
  );
};

export default RequisitesPage;