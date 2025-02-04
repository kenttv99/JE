// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
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
  const [timeZones, setTimeZones] = useState<Timezone[]>([DEFAULT_TIMEZONE]);
  const [selectedTimezone, setSelectedTimezone] = useState<number>(DEFAULT_TIMEZONE.id);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchTimezones = async () => {
      if (hasAttemptedLoad) {
        return;
      }

      try {
        const response = await api.get<Timezone[]>('/api/v1/timezones');
        if (isMounted) {
          if (response.data.length > 0) {
            setTimeZones(response.data);
            setSelectedTimezone(response.data[0].id);
          }
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Timezone fetch error:', err);
          // Don't set error message for 404 - just use default timezone
          if ((err as any)?.response?.status !== 404) {
            setError('Unable to load timezones');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setHasAttemptedLoad(true);
        }
      }
    };

    fetchTimezones();
    return () => { isMounted = false; };
  }, [hasAttemptedLoad]); // Only run once

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