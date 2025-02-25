import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface FinancialEntity {
  name: string;
  description: string;
}

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
  payment_method_description: string;
  bank_description: string;
}

export interface RequisiteFormData extends Pick<Requisite, 
  'payment_method' | 'bank' | 'req_number' | 'fio' | 'can_buy' | 'can_sell' |
  'payment_method_description' | 'bank_description'
> {
  created_at: string;
}

const normalize = (str?: string | null) => 
  String(str || '')
    .toLowerCase()
    .replace(/[^a-zа-я0-9]/g, '') // Удаляем ВСЕ символы, кроме букв и цифр
    .trim();

const useTraderRequisites = () => {
  const [state, setState] = useState({
    requisites: [] as Requisite[],
    banks: [] as FinancialEntity[],
    paymentMethods: [] as FinancialEntity[],
    loading: true,
    error: null as Error | null
  });

  const fetchData = async () => {
    try {
      const [banksRes, methodsRes] = await Promise.all([
        api.get<FinancialEntity[]>('/api/v1/banks_trader'),
        api.get<FinancialEntity[]>('/api/v1/trader_methods/get_methods')
      ]);
  
      const normalizeData = (data: FinancialEntity[]) => 
        data.map(item => ({
          name: normalize(item.name),
          description: item.description || ''
        }));
  
      return {
        banks: normalizeData(banksRes.data),
        paymentMethods: normalizeData(methodsRes.data)
      };
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      return { banks: [], paymentMethods: [] };
    }
  };

  const fetchRequisites = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      // Загружаем актуальные банки и методы
      const { banks, paymentMethods } = await fetchData();
      
      // Загружаем реквизиты
      const { data } = await api.get<Requisite[]>('/api/v1/trader_req/all_requisites');
      
      // Ensure all requisites have proper descriptions
      const enrichedData = data.map(req => ({
        ...req, 
        bank: req.bank || '', 
        payment_method: req.payment_method || '',
        // Make sure these are always strings to avoid rendering issues
        bank_description: req.bank_description || req.bank || '',
        payment_method_description: req.payment_method_description || req.payment_method || '' 
      }));
      
      setState(prev => ({ 
        ...prev, 
        requisites: enrichedData,
        banks,
        paymentMethods,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Ошибка загрузки'),
        loading: false
      }));
    }
  };

  const updateRequisite = async (id: number, payload: Partial<Requisite>) => {
    try {
      // First update locally for immediate UI feedback
      setState(prev => ({
        ...prev,
        requisites: prev.requisites.map(req => 
          req.id === id ? { ...req, ...payload } : req
        )
      }));
      
      // Then update on the server
      const response = await api.put(`/api/v1/trader_req/update_requisite/${id}`, payload);
      
      // Update with the server response to ensure data consistency
      if (response.data) {
        setState(prev => ({
          ...prev,
          requisites: prev.requisites.map(req => 
            req.id === id ? {
              ...req,
              ...response.data,
              bank_description: response.data.bank_description || req.bank_description || response.data.bank || '',
              payment_method_description: response.data.payment_method_description || req.payment_method_description || response.data.payment_method || ''
            } : req
          )
        }));
      }
    } catch (error) {
      console.error('Error updating requisite:', error);
      // Refresh all requisites if there's an error to ensure data consistency
      await fetchRequisites();
    }
  };

  useEffect(() => { 
    fetchRequisites();
  }, []);

  return {
    ...state,
    refetch: fetchRequisites,
    updateRequisiteProperties: (id: number, payload: Partial<Requisite>) => updateRequisite(id, payload),
    deleteRequisite: (id: number) => updateRequisite(id, { status: 'deleted' })
  };
};

export default useTraderRequisites;