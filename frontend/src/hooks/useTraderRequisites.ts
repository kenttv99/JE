import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Requisite {
  id: number;
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
  status: string;
  created_at: string;
}

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

interface FormError {
  field: string;
  message: string;
}

interface RequisiteFormData {
  payment_method: string;
  bank: string;
  req_number: string;
  fio: string;
  can_buy: boolean;
  can_sell: boolean;
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [formData, setFormData] = useState<RequisiteFormData>({
    payment_method: '',
    bank: '',
    req_number: '',
    fio: '',
    can_buy: false,
    can_sell: false,
  });
  const [formErrors, setFormErrors] = useState<FormError[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [methodsResponse, banksResponse] = await Promise.all([
          api.get<PaymentMethod[]>('/api/v1/trader_methods/get_methods'),
          api.get<Bank[]>('/api/v1/banks_trader/')
        ]);
        
        setPaymentMethods(methodsResponse.data);
        setBanks(banksResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch form data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleMethodSelect = (method: PaymentMethod | null) => {
    setSelectedMethod(method);
    setFormData(prev => ({
      ...prev,
      payment_method: method?.method_name || '',
    }));
    setFormErrors([]);
  };

  const handleInputChange = (field: keyof RequisiteFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormErrors(formErrors.filter(err => err.field !== field));
  };

  const addRequisite = async () => {
    try {
      if (!validateForm()) {
        return null;
      }

      const response = await api.post<Requisite>('/api/v1/trader_req/add_requisite', {
        ...formData,
        status: 'approve',
      });

      resetForm();
      return response.data;
    } catch (error) {
      setFormErrors([{ field: 'general', message: 'Произошла ошибка при сохранении реквизита' }]);
      return null;
    }
  };

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
    validateForm
  };
};

export const useRequisiteUpdater = () => {
    const [updating, setUpdating] = useState<number | null>(null);
  
    const handleDirectionToggle = async (
      requisite: Requisite,
      field: 'can_buy' | 'can_sell',
      currentValue: boolean,
      onUpdate?: (updatedRequisite: Requisite) => void
    ) => {
      try {
        setUpdating(requisite.id);
        
        // Include all existing fields in the update request
        const updateData = {
          payment_method: requisite.payment_method,
          bank: requisite.bank,
          req_number: requisite.req_number,
          fio: requisite.fio,
          status: requisite.status,
          can_buy: field === 'can_buy' ? !currentValue : requisite.can_buy,
          can_sell: field === 'can_sell' ? !currentValue : requisite.can_sell
        };
  
        const response = await api.put<Requisite>(`/api/v1/trader_req/update_requisite/${requisite.id}`, updateData);
  
        if (response.data && onUpdate) {
          onUpdate(response.data);
        }
      } catch (error) {
        console.error('Failed to update requisite:', error);
      } finally {
        setUpdating(null);
      }
    };
  
    return { updating, handleDirectionToggle };
  };