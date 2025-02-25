'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RequisiteFormData } from '@/hooks/useTraderRequisites';

interface AddRequisiteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: RequisiteFormData) => Promise<void>;
    formData: RequisiteFormData;
    handleBankChange: (value: string) => void;
    handleReqNumberChange: (value: string) => void;
    handleFioChange: (value: string) => void;
    handleCanBuyChange: () => void;
    handleCanSellChange: () => void;
    handleInputChange: (field: keyof RequisiteFormData, value: string) => void;
}

const AddTraderRequisiteModal = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    handleBankChange,
    handleReqNumberChange,
    handleFioChange,
    handleCanBuyChange,
    handleCanSellChange,
    handleInputChange,
}: AddRequisiteModalProps) => {
    const [selectedMethodName, setSelectedMethodName] = useState<string>('');
    const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
    const [banks, setBanks] = useState<string[]>([]);

    // Загрузка списка методов оплаты
    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const response = await fetch('/api/v1/trader_methods/get_methods');
                if (!response.ok) throw new Error('Failed to fetch payment methods');
                const data = await response.json();
                setPaymentMethods(data.map((method: any) => method.method_name));
            } catch (error) {
                console.error('Error fetching payment methods:', error);
            }
        };
        fetchPaymentMethods();
    }, []);

    // Загрузка списка банков для выбранного метода
    const fetchBanksByMethod = async (methodName: string) => {
        try {
            const response = await fetch(`/api/v1/trader_methods/${methodName}/banks`);
            if (!response.ok) throw new Error('Failed to fetch banks');
            const data = await response.json();
            setBanks(data); // Теперь сохраняем полные объекты банков
        } catch (error) {
            console.error('Error fetching banks:', error);
        }
    };

    const handlePaymentMethodSelect = useCallback((methodName: string) => {
        setSelectedMethodName(methodName);
        handleInputChange('payment_method', methodName);
        fetchBanksByMethod(methodName);
    }, [handleInputChange]);

    const handlePaymentMethodClear = useCallback(() => {
        setSelectedMethodName('');
        handleInputChange('payment_method', '');
    }, [handleInputChange]);

    const paymentMethodsVariants = {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
    };

    const formDetailsVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
        exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ display: isOpen ? 'block' : 'none' }}>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

                <div
                    className={`relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl transform transition-all duration-300 ${
                        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[-100px]'
                    } overflow-hidden`}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            {selectedMethodName && (
                                <button
                                    type="button"
                                    onClick={handlePaymentMethodClear}
                                    className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100 hover:shadow-md"
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
                            className="text-gray-400 hover:text-gray-500 transition-colors p-2 rounded-full hover:bg-gray-100 hover:shadow-md"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {!selectedMethodName ? (
                        <motion.div
                            key="paymentMethods"
                            variants={paymentMethodsVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <div className="space-y-4">
                                {paymentMethods.map((methodName) => (
                                    <button
                                        key={methodName}
                                        type="button"
                                        onClick={() => handlePaymentMethodSelect(methodName)}
                                        className="w-full p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-between group hover:shadow-md"
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
                        </motion.div>
                    ) : (
                        <motion.div
                            key="formDetails"
                            variants={formDetailsVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                        >
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="text-sm text-gray-500">Выбранный метод</div>
                                    <div className="font-medium text-blue-700">{selectedMethodName}</div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">БАНК</label>
                                    <select
                                        value={formData.bank}
                                        onChange={(e) => handleBankChange(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all hover:shadow-md"
                                    >
                                        <option value="">Выберите банк</option>
                                        {banks.map((bank: any) => (
                                            <option key={bank.bank_name} value={bank.bank_name}>
                                                {bank.description}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">НОМЕР РЕКВИЗИТА</label>
                                    <input
                                        type="text"
                                        value={formData.req_number}
                                        onChange={(e) => handleReqNumberChange(e.target.value)}
                                        className="block w-full px-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all hover:shadow-md"
                                        placeholder="Введите номер реквизита"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">ФИО</label>
                                    <input
                                        type="text"
                                        value={formData.fio}
                                        onChange={(e) => handleFioChange(e.target.value)}
                                        className="block w-full px-3 py-2.5 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg transition-all hover:shadow-md"
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
                                                onClick={handleCanBuyChange}
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
                                                onClick={handleCanSellChange}
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
                                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 hover:shadow-md"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await onSubmit(formData);
                                        }}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg"
                                    >
                                        Сохранить
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddTraderRequisiteModal;