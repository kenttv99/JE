import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { RequisiteFormData, Requisite } from '@/hooks/useTraderRequisites';

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

export const useRequisiteForm = () => {
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [formData, setFormData] = useState<RequisiteFormData>({
    payment_method: '',
    bank: '',
    req_number: '',
    fio: '',
    can_buy: false,
    can_sell: false,
    created_at: new Date().toISOString(),
  });
  const [formErrors, setFormErrors] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setFormData((prev: RequisiteFormData) => ({ ...prev, payment_method: method }));
  };

  const handleInputChange = (field: keyof RequisiteFormData, value: string) => {
    setFormData((prev: RequisiteFormData) => ({ ...prev, [field]: value }));
  };

  const handleBankChange = (value: string) => {
    setFormData((prev: RequisiteFormData) => ({ ...prev, bank: value }));
  };

  const handleReqNumberChange = (value: string) => {
    setFormData((prev: RequisiteFormData) => ({ ...prev, req_number: value }));
  };

  const handleFioChange = (value: string) => {
    setFormData((prev: RequisiteFormData) => ({ ...prev, fio: value }));
  };

  const handleCanBuyChange = () => {
    setFormData((prev: RequisiteFormData) => ({ ...prev, can_buy: !prev.can_buy }));
  };

  const handleCanSellChange = () => {
    setFormData((prev: RequisiteFormData) => ({ ...prev, can_sell: !prev.can_sell }));
  };

  const validateForm = (): boolean => {
    const errors: any[] = [];
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

  const addRequisite = async (data?: RequisiteFormData): Promise<void> => {
    if (!validateForm()) {
      console.log('Form has validation errors:', formErrors);
      return;
    }
    try {
      await api.post<Requisite>('/api/v1/trader_req/add_requisite', data);
      resetForm();
      return;
    } catch (error) {
      console.error('Failed to add requisite:', error);
      return;
    }
  };

  const resetForm = () => {
    setFormData({
      payment_method: '',
      bank: '',
      req_number: '',
      fio: '',
      can_buy: false,
      can_sell: false,
      created_at: new Date().toISOString(),
    });
    setSelectedMethod('');
    setFormErrors([]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsResponse, banksResponse] = await Promise.all([
          api.get<PaymentMethod[]>('/api/v1/trader_methods/get_methods'),
          api.get<Bank[]>('/api/v1/banks_trader/')
        ]);

        setPaymentMethods(methodsResponse.data.map(method => method.method_name));
        setBanks(banksResponse.data.map(bank => bank.bank_name));
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    paymentMethods,
    banks,
    loading,
    error,
    formData,
    formErrors,
    selectedMethod,
    handleMethodSelect,
    handleInputChange,
    addRequisite,
    resetForm,
    handleBankChange,
    handleReqNumberChange,
    handleFioChange,
    handleCanBuyChange,
    handleCanSellChange,
  };
};