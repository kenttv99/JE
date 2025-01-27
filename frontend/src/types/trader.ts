// frontend/src/types/trader.ts
export interface TraderProfile {
    id: number;
    email: string;
    full_name: string;
    verification_level: string;
    created_at: string;
    trader_rating: number;
    total_trades: number;
  }
  
  export interface TraderOrder {
    id: number;
    status: string;
    amount: number;
    currency: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface TraderStatistics {
    period: string;
    total_trades: number;
    total_volume: number;
    success_rate: number;
  }
  
  export interface TraderAppeal {
    id: number;
    subject: string;
    status: string;
    created_at: string;
    messages: Array<{
      id: number;
      content: string;
      created_at: string;
    }>;
  }
  
  export interface TraderDetails {
    verification_documents: Array<{
      id: number;
      type: string;
      status: string;
    }>;
    payment_methods: Array<{
      id: number;
      method: string;
      status: string;
    }>;
    security_settings: {
      two_factor_enabled: boolean;
      last_login: string;
    };
  }