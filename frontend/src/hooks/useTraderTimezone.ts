// frontend/src/hooks/useTraderTimezone.ts
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import api from '@/lib/api';
import { TimeZone } from '@/types/trader';

export function useTraderTimezone() {
    const { status } = useSession();
    const [timeZones, setTimeZones] = useState<TimeZone[]>([]);
    const [selectedTimezone, setSelectedTimezone] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const fetchTimezones = async () => {
            if (status !== 'authenticated') {
                return;
            }

            try {
                // Get all timezones
                const response = await api.get<TimeZone[]>('/api/v1/trader_timezones/timezones');
                
                if (isMounted && response.data.length > 0) {
                    setTimeZones(response.data);
                    
                    // Get current trader's timezone
                    const traderTz = await api.get('/api/v1/trader_timezones/trader/timezone');
                    if (traderTz.data) {
                        setSelectedTimezone(traderTz.data.id);
                    } else {
                        setSelectedTimezone(response.data[0].id);
                    }
                }
            } catch (err: any) {
                if (isMounted) {
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
    }, [status]);

    const handleTimezoneChange = async (value: string | number) => {
        const timezoneId = typeof value === 'string' ? parseInt(value, 10) : value;
        
        try {
            await api.put(`/api/v1/trader_timezones/trader/timezone/${timezoneId}`);
            setSelectedTimezone(timezoneId);
            
            // Update table data timestamp formatting
            const selectedTz = timeZones.find(tz => tz.id === timezoneId);
            if (selectedTz) {
                // Force re-render of components using the timezone
                window.dispatchEvent(new CustomEvent('timezoneChanged', { 
                    detail: { offset: selectedTz.utc_offset }
                }));
            }
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