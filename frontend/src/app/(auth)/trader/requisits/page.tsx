'use client';

import { useState, useEffect } from 'react';
import { useTraderRequisites } from '@/hooks/useTraderRequisites';
import { useRequisiteForm } from '@/hooks/useTraderRequisiteForm';
import RequisitesTable from '@/components/TraderRequisitesTable';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoArrowBack } from 'react-icons/io5';
import api from '@/lib/api';

interface PaymentMethod {
  id: number;
  method_name: string;
  details: string | null;
}

interface Bank {
  id: number;
  bank_name: string;
  description: string | null;
}

interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  created_at: string;
  status: string;
}

interface RequisiteFormData {
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
}

interface FormError {
  field: string;
  message: string;
}

const RequisitesPage = () => {
  const { requisites: initialRequisites, loading: reqLoading, error: reqError, refetch } = useTraderRequisites();
  const { paymentMethods, banks, loading: formLoading } = useRequisiteForm();
  const [requisites, setRequisites] = useState<Requisite[]>(initialRequisites || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const [formData, setFormData] = useState<RequisiteFormData>({
    payment_method: '',
    bank: '',
    req_number: '',
    fio: '',
    can_buy: false,
    can_sell: false,
  });

  useEffect(() => {
    if (initialRequisites) {
      setRequisites(initialRequisites);
    }
  }, [initialRequisites]);

  const resetForm = () => {
    setFormData({
      payment_method: '',
      bank: '',
      req_number: '',
      fio: '',
      can_buy: false,
      can_sell: false,
    });
    setSelectedMethod(null);
    setFormErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: FormError[] = [];

    if (!formData.payment_method) {
      errors.push({ field: 'payment_method', message: 'Выберите метод оплаты' });
    }
    if (!formData.bank) {
      errors.push({ field: 'bank', message: 'Выберите банк' });
    }
    if (!formData.req_number) {
      errors.push({ field: 'req_number', message: 'Введите номер реквизита' });
    }
    if (!formData.fio) {
      errors.push({ field: 'fio', message: 'Введите ФИО' });
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData(prev => ({
      ...prev,
      payment_method: method.method_name,
    }));
    setFormErrors([]);
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setFormData(prev => ({
      ...prev,
      payment_method: '',
      bank: '',
    }));
    setFormErrors([]);
  };

  const handleAddRequisite = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      const response = await api.post<Requisite>('/api/v1/trader_req/add_requisite', {
        ...formData,
        status: 'approve',
      });

      if (response.data) {
        setRequisites(prev => [...prev, response.data]);
      } else {
        const updatedData = await refetch();
        if (updatedData) {
          setRequisites(updatedData);
        }
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add requisite:', error);
      setFormErrors([{ field: 'general', message: 'Произошла ошибка при сохранении реквизита' }]);
    }
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
              onUpdate={setRequisites}
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
              />

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative inline-block w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                    {selectedMethod && (
                      <button
                        onClick={handleBack}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <IoArrowBack size={24} />
                      </button>
                    )}
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {selectedMethod ? 'Детали реквизита' : 'Выберите метод'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <IoCloseOutline size={24} />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {!selectedMethod ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => handleMethodSelect(method)}
                          className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                        >
                          <div>
                            <div className="font-medium text-gray-900">{method.method_name}</div>
                            {method.details && (
                              <div className="text-sm text-gray-500 mt-1">{method.details}</div>
                            )}
                          </div>
                          <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <div className="text-sm text-gray-500">Выбранный метод</div>
                        <div className="font-medium text-blue-700">{selectedMethod.method_name}</div>
                        {selectedMethod.details && (
                          <div className="text-sm text-blue-600 mt-1">{selectedMethod.details}</div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">БАНК</label>
                        <select
                          className={`block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200 ${
                            formErrors.find(err => err.field === 'bank') ? 'border-red-500' : ''
                          }`}
                          value={formData.bank}
                          onChange={(e) => {
                            setFormData({ ...formData, bank: e.target.value });
                            setFormErrors(formErrors.filter(err => err.field !== 'bank'));
                          }}
                        >
                          <option value="">Выберите банк</option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.bank_name}>
                              {bank.bank_name}
                            </option>
                          ))}
                        </select>
                        {renderErrorMessage('bank')}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">НОМЕР РЕКВИЗИТА</label>
                        <input
                          type="text"
                          className={`block w-full px-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200 ${
                            formErrors.find(err => err.field === 'req_number') ? 'border-red-500' : ''
                          }`}
                          value={formData.req_number}
                          onChange={(e) => {
                            setFormData({ ...formData, req_number: e.target.value });
                            setFormErrors(formErrors.filter(err => err.field !== 'req_number'));
                          }}
                          placeholder="Введите номер реквизита"
                        />
                        {renderErrorMessage('req_number')}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">ФИО</label>
                        <input
                          type="text"
                          className={`block w-full px-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200 ${
                            formErrors.find(err => err.field === 'fio') ? 'border-red-500' : ''
                          }`}
                          value={formData.fio}
                          onChange={(e) => {
                            setFormData({ ...formData, fio: e.target.value });
                            setFormErrors(formErrors.filter(err => err.field !== 'fio'));
                          }}
                          placeholder="Введите ФИО"
                        />
                        {renderErrorMessage('fio')}
                      </div>

                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">НАСТРОЙКИ</label>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">PayIn</span>
                            <div
                              onClick={() => setFormData(prev => ({ ...prev, can_buy: !prev.can_buy }))}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                                formData.can_buy ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                                  formData.can_buy ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">PayOut</span>
                            <div
                              onClick={() => setFormData(prev => ({ ...prev, can_sell: !prev.can_sell }))}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                                formData.can_sell ? 'bg-blue-500' : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                                  formData.can_sell ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {renderErrorMessage('general')}

                      <div className="flex justify-end space-x-3 pt-6">
                        <button
                          onClick={() => setIsModalOpen(false)}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleAddRequisite}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={formErrors.length > 0}
                        >
                          Сохранить
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RequisitesPage;