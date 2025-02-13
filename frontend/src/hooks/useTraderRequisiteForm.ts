import { useState, useEffect } from 'react';
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

export const useRequisiteForm = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { paymentMethods, banks, loading, error };
};