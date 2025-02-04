// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';

interface Timezone {
  id: number;
  name: string;
  display_name: string;
  utc_offset: number;
  regions: string[];
}

const DEFAULT_TIMEZONE: Timezone = {
  id: 0,
  name: 'UTC',
  display_name: 'UTC+0',
  utc_offset: 0,
  regions: ['Default']
};

export function useTraderTimezone() {
  const { status } = useSession();
  const [timeZones, setTimeZones] = useState<Timezone[]>([DEFAULT_TIMEZONE]);
  const [selectedTimezone, setSelectedTimezone] = useState<number>(DEFAULT_TIMEZONE.id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTimezones = async () => {
      if (status !== 'authenticated') {
        return;
      }

      try {
        // Get all available timezones using the correct endpoint
        const allTimezones = await api.get<Timezone[]>('/api/v1/trader_timezones/timezones');
        
        // Get trader's current timezone using the correct endpoint
        const traderTimezone = await api.get('/api/v1/trader_timezones/trader/timezone');
        
        if (isMounted) {
          setTimeZones(allTimezones.data);
          // Set the trader's current timezone or default to first timezone
          setSelectedTimezone(traderTimezone.data?.id || allTimezones.data[0].id);
        }
      } catch (err: any) {
        if (isMounted && err.response?.status !== 404) {
          setError('Unable to load timezones');
          // If error, at least keep the default timezone
          setTimeZones([DEFAULT_TIMEZONE]);
          setSelectedTimezone(DEFAULT_TIMEZONE.id);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTimezones();
    return () => { isMounted = false; };
  }, [status]);

  const handleTimezoneChange = async (value: string | number) => {
    const timezoneId = typeof value === 'string' ? parseInt(value, 10) : value;
    
    try {
      // Use the correct endpoint for updating timezone
      await api.put(`/api/v1/trader_timezones/trader/timezone/${timezoneId}`);
      setSelectedTimezone(timezoneId);
    } catch (err) {
      console.error('Failed to update timezone:', err);
      setError('Failed to update timezone');
    }
  };

  return {
    timeZones,
    selectedTimezone,
    error,
    isLoading,
    handleTimezoneChange
  };
}