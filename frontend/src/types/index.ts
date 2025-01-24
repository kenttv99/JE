// src/types/index.ts
export interface ApiResponse<T> {
    data: T;
    status: number;
    message?: string;
  }
  
  export interface User {
    id: number;
    email: string;
    full_name: string;
    phone_number?: string;
    telegram_username?: string;
    avatar_url?: string;
    verification_level: string;
    referral_code: string | null;
    referrer_id: number | null;
    created_at: string;
    updated_at: string;
    role_id: number;
    is_superuser: boolean;
  }
  
  export type UserRole = 'admin' | 'trader' | 'user' | 'merchant';