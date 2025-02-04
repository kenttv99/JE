// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Timezone {
  id: number;
  name: string;
  display_name: string;
  utc_offset: number;
}

export function useTraderTimezone() {
  const [timeZones, setTimeZones] = useState<Timezone[]>([{
    id: 0,
    name: 'UTC',
    display_name: 'UTC+0',
    utc_offset: 0
  }]); // Default timezone as fallback
  const [selectedTimezone, setSelectedTimezone] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTimezones = async () => {
      if (isLoading) return; // Prevent multiple fetches
      
      setIsLoading(true);
      try {
        const response = await api.get<Timezone[]>('/api/v1/timezones');
        if (isMounted) {
          setTimeZones(response.data);
          if (!selectedTimezone && response.data.length > 0) {
            setSelectedTimezone(response.data[0].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load timezones');
          console.error('Error fetching timezones:', err);
          // Don't reset timeZones - keep the default UTC
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTimezones();
    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

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