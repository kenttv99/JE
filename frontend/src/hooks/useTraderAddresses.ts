// frontend/src/hooks/useTraderAddresses.ts
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';

export interface TraderAddress {
  id: number;
  wallet_number: string;
  network: string;
  coin: string;
  status: 'check' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface UseTraderAddressesResult {
  addresses: TraderAddress[];
  isLoading: boolean;
  error: string | null;
  isOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement>;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  toggleDropdown: () => void;
}

export function useTraderAddresses(hoverDelay: number = 2000): UseTraderAddressesResult {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: addresses, isLoading, error } = useQuery({
    queryKey: ['trader-addresses'],
    queryFn: async () => {
      const response = await api.get<TraderAddress[]>('/api/v1/trader_addresses/all_trader_addresses');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isHovered && isOpen) {
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, hoverDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isHovered, hoverDelay, isOpen]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  return {
    addresses: addresses || [],
    isLoading,
    error: error ? (error as Error).message : null,
    isOpen,
    dropdownRef,
    handleMouseEnter,
    handleMouseLeave,
    toggleDropdown
  };
}