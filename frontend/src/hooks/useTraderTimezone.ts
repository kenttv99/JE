// frontend/src/hooks/useTraderTimezone.ts
import { useState } from 'react';
import api from '@/lib/api';
import { TimeZone } from '@/types/trader';

export const useTraderTimezone = () => {
  const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeZones = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const { data } = await api.get('/api/v1/trader_timezones/timezones');
      setTimeZones(data);
      if (data.length > 0) {
        setSelectedTimezone(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching time zones:', error);
      setError('Failed to load time zones');
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = async (tzId: number) => {
    setSelectedTimezone(tzId);
  };

  return {
    timeZones,
    selectedTimezone,
    loading,
    error,
    fetchTimeZones,
    handleTimezoneChange
  };
};