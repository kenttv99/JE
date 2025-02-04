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
  const [timeZones, setTimeZones] = useState<Timezone[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTimezones = async () => {
      try {
        const response = await api.get<Timezone[]>('/api/v1/timezones');
        setTimeZones(response.data);
        // Set default timezone if none selected
        if (!selectedTimezone && response.data.length > 0) {
          setSelectedTimezone(response.data[0].id);
        }
      } catch (err) {
        setError('Failed to load timezones');
        console.error('Error fetching timezones:', err);
      }
    };

    fetchTimezones();
  }, []);

  const handleTimezoneChange = (value: string | number) => {
    const timezoneId = typeof value === 'string' ? parseInt(value, 10) : value;
    setSelectedTimezone(timezoneId);
    // Additional logic for saving timezone preference if needed
  };

  return {
    timeZones,
    selectedTimezone,
    error,
    handleTimezoneChange
  };
}