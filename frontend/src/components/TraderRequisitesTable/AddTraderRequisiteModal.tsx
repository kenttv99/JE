'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RequisiteFormData } from '@/hooks/useTraderRequisites';
import { FaArrowLeft, FaSpinner, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

// Define interfaces for methods and banks with descriptions
interface PaymentMethod {
  method_name: string;
  description: string;
}

interface Bank {
  bank_name: string;
  description: string;
}

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
    // State
    const [selectedMethodName, setSelectedMethodName] = useState<string>('');
    const [selectedMethodDescription, setSelectedMethodDescription] = useState<string>('');
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [banks, setBanks] = useState<Bank[]>([]);
    const [methodsLoading, setMethodsLoading] = useState(true);
    const [banksLoading, setBanksLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [formTouched, setFormTouched] = useState<Record<string, boolean>>({});
    const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);

    // Disable body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        // Cleanup function to re-enable scrolling when component unmounts
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Track screen width changes
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormErrors({});
            setFormTouched({});
            setSearchQuery('');
        } else {
            setSelectedMethodName('');
            setSelectedMethodDescription('');
            setBanks([]);
        }
    }, [isOpen]);

    // Загрузка списка методов оплаты с описаниями
    useEffect(() => {
        if (!isOpen) return;
        
        const fetchPaymentMethods = async () => {
            setMethodsLoading(true);
            try {
                const response = await fetch('/api/v1/trader_methods/get_methods');
                if (!response.ok) throw new Error('Failed to fetch payment methods');
                const data = await response.json();
                setPaymentMethods(data); // Сохраняем полные объекты методов с описаниями
            } catch (error) {
                console.error('Error fetching payment methods:', error);
                setPaymentMethods([]);
            } finally {
                setMethodsLoading(false);
            }
        };
        
        fetchPaymentMethods();
    }, [isOpen]);

    // Загрузка списка банков для выбранного метода
    const fetchBanksByMethod = async (methodName: string) => {
        setBanksLoading(true);
        try {
            const response = await fetch(`/api/v1/trader_methods/${methodName}/banks`);
            if (!response.ok) throw new Error('Failed to fetch banks');
            const data = await response.json();
            setBanks(data); // Сохраняем полные объекты банков с описаниями
        } catch (error) {
            console.error('Error fetching banks:', error);
            setBanks([]);
        } finally {
            setBanksLoading(false);
        }
    };

    // Filtered methods based on search query
    const filteredMethods = useMemo(() => {
        if (!searchQuery.trim()) return paymentMethods;
        
        const query = searchQuery.toLowerCase();
        return paymentMethods.filter(method => 
            (method.description || '').toLowerCase().includes(query) || 
            method.method_name.toLowerCase().includes(query)
        );
    }, [paymentMethods, searchQuery]);

    // Form validation
    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!formData.payment_method) {
            errors.payment_method = 'Выберите метод оплаты';
        }
        
        if (!formData.bank) {
            errors.bank = 'Выберите банк';
        }
        
        if (!formData.req_number) {
            errors.req_number = 'Введите номер реквизита';
        }
        
        if (!formData.fio) {
            errors.fio = 'Введите ФИО';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handlePaymentMethodSelect = useCallback((method: PaymentMethod) => {
        setSelectedMethodName(method.method_name);
        setSelectedMethodDescription(method.description || method.method_name);
        handleInputChange('payment_method', method.method_name);
        handleInputChange('payment_method_description', method.description || method.method_name);
        fetchBanksByMethod(method.method_name);
        setFormTouched({...formTouched, payment_method: true});
    }, [handleInputChange, formTouched]);

    const handlePaymentMethodClear = useCallback(() => {
        setSelectedMethodName('');
        setSelectedMethodDescription('');
        handleInputChange('payment_method', '');
        handleInputChange('payment_method_description', '');
        setBanks([]);
    }, [handleInputChange]);

    // Handler for when a bank is selected from dropdown
    const handleBankSelection = useCallback((bankName: string) => {
        handleBankChange(bankName);
        setFormTouched({...formTouched, bank: true});
        
        // Find the selected bank and update its description in formData
        const selectedBank = banks.find(bank => bank.bank_name === bankName);
        if (selectedBank) {
            handleInputChange('bank_description', selectedBank.description || selectedBank.bank_name);
        }
    }, [banks, handleBankChange, handleInputChange, formTouched]);

    // Handle form submission with validation
    const handleFormSubmit = async () => {
        // Mark all fields as touched for validation
        setFormTouched({
            payment_method: true,
            bank: true,
            req_number: true,
            fio: true,
        });
        
        if (!validateForm()) return;
        
        setSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Animation variants
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
    };

    const slideIn = {
        hidden: { x: 20, opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    };

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

    // Calculate modal dimensions based on screen size
    const getModalWidth = () => {
        if (screenWidth < 480) return 'w-full mx-2';  // Full width - margins on smallest screens
        if (screenWidth < 768) return 'w-[95%] max-w-md'; // 95% width but max 448px on small screens
        return 'w-full max-w-md'; // Default for larger screens
    };

    // Calculate modal height based on screen size
    const getModalHeight = () => {
        if (screenWidth < 480) return 'max-h-[95vh]'; // Almost full height on small screens
        return 'max-h-[90vh]'; // Default for larger screens
    };

    // Calculate content height based on screen size
    const getContentHeight = () => {
        if (screenWidth < 480) return 'max-h-[calc(95vh-120px)]'; // Adjusted for smaller screens
        return 'max-h-[calc(90vh-120px)]'; // Default for larger screens
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose} />

                    <motion.div
                        className={`relative bg-white rounded-xl shadow-2xl transform my-4 ${getModalWidth()} ${getModalHeight()}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 bg-white rounded-t-xl px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-gray-100">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                    {selectedMethodName && (
                                        <button
                                            type="button"
                                            onClick={handlePaymentMethodClear}
                                            className="text-gray-400 hover:text-blue-500 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-blue-50"
                                            aria-label="Назад к выбору метода"
                                        >
                                            <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                                        </button>
                                    )}
                                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 truncate">
                                        {selectedMethodName ? 'Детали реквизита' : 'Выберите метод оплаты'}
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-500 transition-colors p-1.5 sm:p-2 rounded-full hover:bg-gray-100"
                                    aria-label="Закрыть"
                                >
                                    <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>

                        <div className={`overflow-y-auto ${getContentHeight()} px-4 sm:px-6 py-4 sm:py-6 pt-3`}>
                            <AnimatePresence mode="wait">
                                {!selectedMethodName ? (
                                    <motion.div
                                        key="paymentMethods"
                                        variants={paymentMethodsVariants}
                                        initial="initial"
                                        animate="animate"
                                        exit="exit"
                                    >
                                        {/* Search input for methods */}
                                        <div className="mb-4 relative">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Поиск метода оплаты..."
                                                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-8 sm:pl-10 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base"
                                                />
                                                <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                {searchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchQuery('')}
                                                        className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                                    >
                                                        <FaTimes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            </div>
                                        
                                        {/* Fixed container with proper padding to prevent hover effects from causing scrollbars */}
                                        <div className="relative overflow-hidden">
                                            <div className="px-0.5 py-0.5 -mx-0.5 -my-0.5">
                                                {methodsLoading ? (
                                                    <div className="flex justify-center items-center h-32 sm:h-40">
                                                        <FaSpinner className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 animate-spin" />
                                                    </div>
                                                ) : filteredMethods.length > 0 ? (
                                                    <div className="space-y-2">
                                                        {filteredMethods.map((method) => (
                                                            <motion.button
                                                                key={method.method_name}
                                                                type="button"
                                                                onClick={() => handlePaymentMethodSelect(method)}
                                                                className="w-full p-3 sm:p-4 text-left bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg transition-colors duration-200 group flex justify-between items-center"
                                                                variants={fadeIn}
                                                                whileTap={{ scale: 0.995 }}
                                                            >
                                                                <div className="pr-2 flex-1">
                                                                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                                                                        {method.description || method.method_name}
                                                                    </div>
                                                                    {method.description && method.description !== method.method_name && (
                                                                        <div className="text-xs sm:text-sm text-gray-500">{method.method_name}</div>
                                                                    )}
                                                                </div>
                                                                <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                ) : searchQuery ? (
                                                    <div className="text-center p-6 sm:p-8 text-gray-500 bg-gray-50 rounded-lg">
                                                        <FaExclamationTriangle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-gray-400" />
                                                        <p className="text-sm sm:text-base">По запросу "{searchQuery}" ничего не найдено</p>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-6 sm:p-8 text-gray-500 bg-gray-50 rounded-lg">
                                                        <FaExclamationTriangle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 text-gray-400" />
                                                        <p className="text-sm sm:text-base">Нет доступных методов оплаты</p>
                                                    </div>
                                                )}
                                            </div>
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
                                        <div className="space-y-5 sm:space-y-6">
                                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-100">
                                                <div className="text-xs sm:text-sm text-gray-500">Выбранный метод</div>
                                                <div className="font-medium text-blue-700 text-sm sm:text-base">{selectedMethodDescription}</div>
                                                {selectedMethodDescription !== selectedMethodName && (
                                                    <div className="text-xs text-gray-500 mt-1">{selectedMethodName}</div>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700">БАНК</label>
                                                    {formErrors.bank && formTouched.bank && (
                                                        <span className="text-xs text-red-500">{formErrors.bank}</span>
                                                    )}
                                                </div>
                                                <div className="relative">
                                                    {banksLoading && (
                                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                            <FaSpinner className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 animate-spin" />
                                                        </div>
                                                    )}
                                                    <select
                                                        value={formData.bank}
                                                        onChange={(e) => handleBankSelection(e.target.value)}
                                                        className={`block w-full pl-3 pr-8 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border ${
                                                            formErrors.bank && formTouched.bank 
                                                                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                        } rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-500`}
                                                        disabled={banksLoading || banks.length === 0}
                                                    >
                                                        <option value="">Выберите банк</option>
                                                        {banks.map((bank) => (
                                                            <option key={bank.bank_name} value={bank.bank_name}>
                                                                {bank.description || bank.bank_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {banks.length === 0 && !banksLoading && (
                                                    <p className="text-xs flex items-center space-x-1 mt-1 text-amber-600">
                                                        <FaExclamationTriangle className="inline w-3 h-3" />
                                                        <span>Для данного метода нет доступных банков</span>
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700">НОМЕР РЕКВИЗИТА</label>
                                                    {formErrors.req_number && formTouched.req_number && (
                                                        <span className="text-xs text-red-500">{formErrors.req_number}</span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.req_number}
                                                    onChange={(e) => {
                                                        handleReqNumberChange(e.target.value);
                                                        setFormTouched({...formTouched, req_number: true});
                                                    }}
                                                    className={`block w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border ${
                                                        formErrors.req_number && formTouched.req_number 
                                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                    } rounded-lg transition-colors`}
                                                    placeholder="Введите номер реквизита"
                                                    onBlur={() => setFormTouched({...formTouched, req_number: true})}
                                                />
                                            </div>

                                            <div className="space-y-1.5 sm:space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="block text-xs sm:text-sm font-medium text-gray-700">ФИО</label>
                                                    {formErrors.fio && formTouched.fio && (
                                                        <span className="text-xs text-red-500">{formErrors.fio}</span>
                                                    )}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formData.fio}
                                                    onChange={(e) => {
                                                        handleFioChange(e.target.value);
                                                        setFormTouched({...formTouched, fio: true});
                                                    }}
                                                    className={`block w-full px-3 py-2 sm:py-2.5 text-sm sm:text-base border ${
                                                        formErrors.fio && formTouched.fio 
                                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                    } rounded-lg transition-colors`}
                                                    placeholder="Введите ФИО"
                                                    onBlur={() => setFormTouched({...formTouched, fio: true})}
                                                />
                                            </div>

                                            <div className="space-y-3 sm:space-y-4">
                                                <label className="block text-xs sm:text-sm font-medium text-gray-700">НАСТРОЙКИ</label>
                                                <div className="space-y-2 sm:space-y-3">
                                                    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div>
                                                            <span className="text-xs sm:text-sm font-medium text-gray-700">PayIn</span>
                                                            <p className="text-xs text-gray-500 mt-0.5">Разрешить использовать для покупки</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleCanBuyChange}
                                                            className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors duration-300 ${
                                                                formData.can_buy ? 'bg-blue-500' : 'bg-gray-200'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-3.5 sm:h-4 w-3.5 sm:w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                                                    formData.can_buy ? 'translate-x-[18px] sm:translate-x-6' : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div>
                                                            <span className="text-xs sm:text-sm font-medium text-gray-700">PayOut</span>
                                                            <p className="text-xs text-gray-500 mt-0.5">Разрешить использовать для продажи</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleCanSellChange}
                                                            className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors duration-300 ${
                                                                formData.can_sell ? 'bg-blue-500' : 'bg-gray-200'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`inline-block h-3.5 sm:h-4 w-3.5 sm:w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                                                                    formData.can_sell ? 'translate-x-[18px] sm:translate-x-6' : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        
                        {selectedMethodName && (
                            <div className="sticky bottom-0 z-10 bg-white rounded-b-xl px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100">
                                <div className="flex justify-end space-x-2 sm:space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-3 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 hover:shadow-md text-xs sm:text-sm"
                                        disabled={submitting}
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleFormSubmit}
                                        disabled={submitting}
                                        className={`flex items-center justify-center px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg transition-all duration-200 text-xs sm:text-sm ${
                                            submitting 
                                                ? 'bg-blue-400 cursor-not-allowed' 
                                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg text-white'
                                        }`}
                                    >
                                        {submitting ? (
                                            <>
                                                                                                <FaSpinner className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                                Сохранение...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                                Сохранить
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AddTraderRequisiteModal;