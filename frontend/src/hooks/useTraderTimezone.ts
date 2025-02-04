// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { TimeZone } from '@/types/trader';

export const useTraderTimezone = () => {
  const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
  const [selectedTimezone, setSelectedTimezone] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTimeZones = async () => {
    setLoading(true);
    try {
      const [tzResponse, currentTzResponse] = await Promise.all([
        api.get('/api/v1/trader_timezones/timezones'),
        api.get('/api/v1/trader_timezones/trader/timezone')
      ]);

      setTimeZones(tzResponse.data);
      setSelectedTimezone(currentTzResponse.data.id);
      setError(null);
    } catch (error) {
      console.error('Error fetching time zones:', error);
      setError('Failed to load time zone settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTimezoneChange = async (tzId: number) => {
    setUpdateLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put(`/api/v1/trader_timezones/trader/timezone/${tzId}`);
      setSelectedTimezone(tzId);
      setSuccessMessage('Time zone updated successfully');
    } catch (error) {
      console.error('Error updating time zone:', error);
      setError('Failed to update time zone');
    } finally {
      setUpdateLoading(false);
    }
  };

  return {
    timeZones,
    selectedTimezone,
    loading,
    updateLoading,
    error,
    successMessage,
    fetchTimeZones,
    handleTimezoneChange
  };
};