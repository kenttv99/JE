'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCloseOutline, IoArrowBack } from 'react-icons/io5';

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

interface RequisiteFormData {
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  created_at?: string;
}

interface AddRequisiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: RequisiteFormData) => Promise<void>;
  paymentMethods: PaymentMethod[];
  banks: Bank[];
}

export default function AddRequisiteModal({
  isOpen,
  onClose,
  onSubmit,
  paymentMethods,
  banks,
}: AddRequisiteModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<RequisiteFormData>({
    payment_method: '',
    bank: '',
    req_number: '',
    fio: '',
    can_buy: false,
    can_sell: false,
    created_at: new Date().toISOString()
  });

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData(prev => ({
      ...prev,
      payment_method: method.method_name,
      bank: ''
    }));
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setFormData(prev => ({
      ...prev,
      payment_method: '',
      bank: ''
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity"
              onClick={onClose}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-block w-full max-w-md my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
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
                    onClick={onClose}
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
                          className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200"
                          value={formData.bank}
                          onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                        >
                          <option value="">Выберите банк</option>
                          {banks.map((bank) => (
                            <option key={bank.id} value={bank.bank_name}>
                              {bank.bank_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">НОМЕР РЕКВИЗИТА</label>
                        <input
                          type="text"
                          className="block w-full px-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200"
                          value={formData.req_number}
                          onChange={(e) => setFormData({ ...formData, req_number: e.target.value })}
                          placeholder="Введите номер реквизита"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">ФИО</label>
                        <input
                          type="text"
                          className="block w-full px-3 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200"
                          value={formData.fio}
                          onChange={(e) => setFormData({ ...formData, fio: e.target.value })}
                          placeholder="Введите ФИО"
                        />
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

                      <div className="flex justify-end space-x-3 pt-6">
                        <button
                          onClick={onClose}
                          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => onSubmit(formData)}
                          className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg"
                        >
                          Сохранить
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}