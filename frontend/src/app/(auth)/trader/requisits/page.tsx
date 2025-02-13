'use client';

import { useState } from 'react';
import { useTraderRequisites, useRequisiteForm } from '@/hooks/useTraderRequisites';
import RequisitesTable from '@/components/TraderRequisitesTable';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline } from 'react-icons/io5';

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

  const handleAddRequisite = async () => {
    const newRequisite = await addRequisite();
    if (newRequisite) {
      await refetch();
      setIsModalOpen(false);
    }
  };

  const handleRequisiteUpdate = async () => {
    await refetch();
  };

  const renderErrorMessage = (field: string) => {
    const error = formErrors.find(err => err.field === field);
    if (error) {
      return (
        <div className="text-red-500 text-sm mt-1">
          {error.message}
        </div>
      );
    }
    return null;
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
              onUpdate={handleRequisiteUpdate}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => setIsModalOpen(false)}
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full"
              >
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="absolute right-4 top-4">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      <IoCloseOutline size={24} />
                    </button>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Добавить реквизиты
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Метод оплаты
                      </label>
                      <select
                        value={selectedMethod}
                        onChange={(e) => handleMethodSelect(e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Выберите метод</option>
                        {paymentMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                      {renderErrorMessage('payment_method')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Банк
                      </label>
                      <select
                        value={formData.bank}
                        onChange={(e) => handleInputChange('bank', e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Выберите банк</option>
                        {banks.map((bank) => (
                          <option key={bank} value={bank}>
                            {bank}
                          </option>
                        ))}
                      </select>
                      {renderErrorMessage('bank')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Номер реквизита
                      </label>
                      <input
                        type="text"
                        value={formData.req_number}
                        onChange={(e) => handleInputChange('req_number', e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {renderErrorMessage('req_number')}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        ФИО
                      </label>
                      <input
                        type="text"
                        value={formData.fio}
                        onChange={(e) => handleInputChange('fio', e.target.value)}
                        className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                      {renderErrorMessage('fio')}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleAddRequisite}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Добавить
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Отмена
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequisitesPage;