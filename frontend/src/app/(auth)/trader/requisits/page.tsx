'use client';

import { useState, useCallback } from 'react';
import useTraderRequisites from '@/hooks/useTraderRequisites';
import { useRequisiteForm } from '@/hooks/useTraderRequisiteForm';
import TraderRequisitesTable from '@/components/TraderRequisitesTable';
import AddTraderRequisiteModal from '@/components/TraderRequisitesTable/AddTraderRequisiteModal';
import type { RequisiteFormData } from '@/hooks/useTraderRequisites';

const RequisitesPage = () => {
  const { requisites, loading, refetch, deleteRequisite, updateRequisiteProperties } = useTraderRequisites();
  const {
    paymentMethods,
    banks,
    loading: formLoading,
    addRequisite,
    resetForm,
    formData,
    handleBankChange,
    handleReqNumberChange,
    handleFioChange,
    handleCanBuyChange,
    handleCanSellChange,
    handleInputChange,
  } = useRequisiteForm();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    resetForm();
  }, [resetForm]);

  const handleSubmit = useCallback(
    async (submitData: RequisiteFormData) => {
      try {
        await addRequisite(submitData);
        await refetch();
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to add requisite:', error);
      }
    },
    [addRequisite, refetch]
  );

  // Prop to update toggle values.
  const handleToggleProperty = useCallback(
    async (id: number, property: 'can_buy' | 'can_sell', newValue: boolean) => {
      try {
        await updateRequisiteProperties(id, { [property]: newValue });
      } catch (error) {
        console.error(`Failed to update ${property}:`, error);
      }
    },
    [updateRequisiteProperties]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteRequisite(id);
      } catch (error) {
        console.error('Failed to delete requisite', error);
      }
    },
    [deleteRequisite]
  );

  if (loading || formLoading) {
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
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-blue-500 px-6 py-2 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 active:scale-95"
            >
              Добавить реквизиты
            </button>
          </div>
          <div className="p-6">
            <TraderRequisitesTable
              requisites={requisites}
              onDelete={handleDelete}
              onToggleProperty={handleToggleProperty}
            />
          </div>
        </div>
      </div>
      <AddTraderRequisiteModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        paymentMethods={paymentMethods}
        banks={banks}
        formData={formData}
        handleBankChange={handleBankChange}
        handleReqNumberChange={handleReqNumberChange}
        handleFioChange={handleFioChange}
        handleCanBuyChange={handleCanBuyChange}
        handleCanSellChange={handleCanSellChange}
        handleInputChange={handleInputChange}
      />
    </div>
  );
};

export default RequisitesPage;