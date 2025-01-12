export interface User {
    id: number;
    email: string;
    full_name: string;
    verification_level: string;
    referral_code: string | null;
    referrer_id: number | null;
    created_at: string;
    updated_at: string;
    role_id: number;
    is_superuser: boolean;
  }