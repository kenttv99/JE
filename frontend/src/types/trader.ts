export interface TimeZone {
  id: number;
  name: string;
  display_name: string;
  utc_offset: number;
  regions: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  bik: string;
  correspondentAccount: string;
}

export interface TraderProfile {
  id: string;
  name: string;
  email: string;
  role: 'trader';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  bankDetails: BankDetails;
  created_at: string;
  updated_at: string;
  time_zone: TimeZone;  // Add time zone to TraderProfile
}
  
  export interface TraderOrder {
    id: string;
    date: string;
    status: 'pending' | 'completed' | 'cancelled';
    amount: number;
    type: 'buy' | 'sell';
  }
  
  export interface Appeal {
    id: string;
    subject: string;
    date: string;
    status: 'open' | 'closed' | 'pending';
    messages: Array<{
      id: string;
      text: string;
      sender: string;
      timestamp: string;
    }>;
  }
  
  export interface StatisticsData {
    tradingVolume: number;
    successRate: number;
    activeOrders: number;
    historicalData: {
      labels: string[];
      values: number[];
    };
  }