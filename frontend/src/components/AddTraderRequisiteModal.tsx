'use client';

import { useState } from 'react';

export interface RequisiteFormData {
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
  paymentMethods: string[];  // Changed: Now expects string arrays directly
  banks: string[];          // Changed: Now expects string arrays directly
}

const AddTraderRequisiteModal = ({
  isOpen,
  onClose,
  onSubmit,
  paymentMethods,
  banks,
}: AddRequisiteModalProps) => {
  const [selectedMethodName, setSelectedMethodName] = useState<string>('');
  const [formData, setFormData] = useState<RequisiteFormData>({
    payment_method: '',
    bank: '',
    req_number: '',
    fio: '',
    can_buy: false,
    can_sell: false,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div 
          className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              {selectedMethodName && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMethodName('');
                    setFormData(prev => ({
                      ...prev,
                      payment_method: '',
                      bank: ''
                    }));
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <h3 className="text-2xl font-semibold text-gray-900">
                {selectedMethodName ? 'Детали реквизита' : 'Выберите метод'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!selectedMethodName ? (
            <div className="space-y-4">
              {paymentMethods.map((methodName) => (
                <button
                  key={methodName}
                  type="button"
                  onClick={() => {
                    setSelectedMethodName(methodName);
                    setFormData(prev => ({
                      ...prev,
                      payment_method: methodName
                    }));
                  }}
                  className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between group"
                >
                  <div>
                    <div className="font-medium text-gray-900">{methodName}</div>
                  </div>
                  <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="text-sm text-gray-500">Выбранный метод</div>
                <div className="font-medium text-blue-700">{selectedMethodName}</div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">БАНК</label>
                <select
                  value={formData.bank}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank: e.target.value }))}
                  className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200"
                >
                  <option value="">Выберите банк</option>
                  {banks.map((bankName) => (
                    <option key={bankName} value={bankName}>
                      {bankName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rest of the form remains the same */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">НОМЕР РЕКВИЗИТА</label>
                <input
                  type="text"
                  value={formData.req_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, req_number: e.target.value }))}
                  className="block w-full px-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200"
                  placeholder="Введите номер реквизита"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">ФИО</label>
                <input
                  type="text"
                  value={formData.fio}
                  onChange={(e) => setFormData(prev => ({ ...prev, fio: e.target.value }))}
                  className="block w-full px-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all duration-200"
                  placeholder="Введите ФИО"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">НАСТРОЙКИ</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">PayIn</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, can_buy: !prev.can_buy }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        formData.can_buy ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          formData.can_buy ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">PayOut</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, can_sell: !prev.can_sell }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        formData.can_sell ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          formData.can_sell ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const submitData = {
                      ...formData,
                      created_at: new Date().toISOString()
                    };
                    onSubmit(submitData);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg"
                >
                  Сохранить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTraderRequisiteModal;