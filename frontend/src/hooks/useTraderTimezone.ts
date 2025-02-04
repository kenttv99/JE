// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';

interface Timezone {
  id: number;
  name: string;
  display_name: string;
  utc_offset: number;
}

const DEFAULT_TIMEZONE: Timezone = {
  id: 0,
  name: 'UTC',
  display_name: 'UTC+0',
  utc_offset: 0
};

export function useTraderTimezone() {
    const { status } = useSession();
    const [timeZones, setTimeZones] = useState<Timezone[]>([DEFAULT_TIMEZONE]);
    const [selectedTimezone, setSelectedTimezone] = useState<number>(DEFAULT_TIMEZONE.id);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false); // Start as false
  
    useEffect(() => {
      let isMounted = true;
  
      const fetchTimezones = async () => {
        // Only fetch if authenticated
        if (status !== 'authenticated') {
          return;
        }
  
        // Prevent multiple fetches
        if (isLoading || timeZones.length > 1) {
          return;
        }
  
        setIsLoading(true);
  
        try {
          const response = await api.get<Timezone[]>('/api/v1/timezones');
          if (isMounted && response.data.length > 0) {
            setTimeZones(response.data);
            setSelectedTimezone(response.data[0].id);
          }
        } catch (err: any) {
          if (isMounted && err.response?.status !== 404) {
            // Don't set error for 404 - just use default timezone
            setError('Unable to load timezones');
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      };
  
      fetchTimezones();
      return () => { isMounted = false; };
    }, [status]); // Only depend on auth status
  
    const handleTimezoneChange = (value: string | number) => {
      const timezoneId = typeof value === 'string' ? parseInt(value, 10) : value;
      setSelectedTimezone(timezoneId);
    };
  
    return {
      timeZones,
      selectedTimezone,
      error,
      isLoading,
      handleTimezoneChange
    };
  }