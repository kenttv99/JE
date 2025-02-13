import { useState, useEffect } from 'react';
import api from '@/lib/api';

export interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface FormError {
  field: string;
  message: string;
}

interface RequisiteFormData {
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  status?: string;
}

export const useTraderRequisites = () => {
  const [requisites, setRequisites] = useState<Requisite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequisites = async () => {
    try {
      const response = await api.get<Requisite[]>('/api/v1/trader_req/all_requisites');
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch requisites');
      setError(error);
      return null;
    }
  };

  const refetch = async () => {
    setLoading(true);
    try {
      const data = await fetchRequisites();
      if (data) {
        setRequisites(data);
        return data;
      }
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    refetch();
  }, []);

  return { requisites, loading, error, refetch };
};

export const useRequisiteForm = () => {
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [formData, setFormData] = useState<RequisiteFormData>({
    payment_method: '',
    bank: '',
    req_number: '',
    fio: '',
  });
  const [formErrors, setFormErrors] = useState<FormError[]>([]);

  const fetchOptions = async () => {
    try {
      const [methodsResponse, banksResponse] = await Promise.all([
        api.get<string[]>('/api/v1/trader_req/payment_methods'),
        api.get<string[]>('/api/v1/trader_req/banks')
      ]);
      setPaymentMethods(methodsResponse.data);
      setBanks(banksResponse.data);
    } catch (error) {
      console.error('Failed to fetch form options:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    setFormData(prev => ({ ...prev, payment_method: method }));
  };

  const handleInputChange = (field: keyof RequisiteFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => prev.filter(error => error.field !== field));
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

  const addRequisite = async () => {
    if (!validateForm()) {
      return null;
    }
    try {
      const response = await api.post<Requisite>('/api/v1/trader_req/add_requisite', formData);
      resetForm();
      return response.data;
    } catch (error) {
      console.error('Failed to add requisite:', error);
      return null;
    }
  };

  const resetForm = () => {
    setFormData({
      payment_method: '',
      bank: '',
      req_number: '',
      fio: '',
    });
    setSelectedMethod('');
    setFormErrors([]);
  };

  return {
    paymentMethods,
    banks,
    loading,
    formData,
    formErrors,
    selectedMethod,
    handleMethodSelect,
    handleInputChange,
    addRequisite,
    resetForm,
  };
};