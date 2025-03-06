// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TimeZone } from '@/types/trader';

export function useTraderTimezone() {
  const { data: session, status } = useSession(); // Извлекаем session для доступа к accessToken
  const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchTimezones = async () => {
      if (status !== 'authenticated' || !session?.accessToken) {
        if (isMounted) {
          setError('User not authenticated');
          setIsLoading(false);
        }
        console.log('Session or access token missing:', { status, session });
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching timezones');

        // Get all timezones (токен добавляется автоматически)
        const timezonesResponse = await api.get<TimeZone[]>('/api/v1/trader_timezones/timezones');

        if (isMounted && timezonesResponse.data.length > 0) {
          setTimeZones(timezonesResponse.data);

          // Get current trader's timezone (токен добавляется автоматически)
          console.log('Fetching trader timezone');
          const traderTzResponse = await api.get('/api/v1/trader_timezones/trader/timezone');

          if (isMounted && traderTzResponse.data) {
            setSelectedTimezone(traderTzResponse.data.id);
          } else if (isMounted) {
            // Если часовой пояс трейдера не найден (404), устанавливаем первый доступный
            setSelectedTimezone(timezonesResponse.data[0].id);
            setError(traderTzResponse.status === 404 ? 'Time zone not set for trader' : null);
          }
        }
      } catch (err: unknown) {
        console.error('Error fetching timezones:', err);
        if (isMounted) {
          let errorMessage = 'Unable to load timezones';
          if (err instanceof Error) {
            errorMessage = err.message;
          } else if (err && typeof err === 'object' && 'response' in err) {
            const axiosError = err as any;
            errorMessage = axiosError.response?.data?.message || errorMessage;
            if (axiosError.response?.status === 404) {
              errorMessage = 'Time zone not set for trader';
            }
          }
          setError(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTimezones();
    return () => { isMounted = false; };
  }, [status, session?.accessToken]);

  const handleTimezoneChange = async (value: string | number) => {
    const timezoneId = typeof value === 'string' ? parseInt(value, 10) : value;

    if (!session?.accessToken) {
      setError('User not authenticated');
      console.log('No access token for timezone update');
      return;
    }

    try {
      console.log('Updating timezone');
      // Обновляем часовой пояс (токен добавляется автоматически)
      const response = await api.put(`/api/v1/trader_timezones/trader/timezone/${timezoneId}`, null);

      if (response.status === 200 || response.status === 201) { // Убедились, что запрос успешен
        setSelectedTimezone(timezoneId);

        // Update table data timestamp formatting
        const selectedTz = timeZones.find(tz => tz.id === timezoneId);
        if (selectedTz) {
          window.dispatchEvent(new CustomEvent('timezoneChanged', { 
            detail: { offset: selectedTz.utc_offset }
          }));
        }
      }
    } catch (err: unknown) {
      console.error('Failed to update timezone:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as any;
        setError(axiosError.response?.data?.message || 'Failed to update timezone');
      } else {
        setError('Failed to update timezone');
      }
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