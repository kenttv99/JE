// NEW FILE: frontend/src/utils/auth.ts
export const isTrader = (session: any): boolean => {
    return session?.user?.role === 'trader';
  };
  
  export const hasRequiredVerification = (
    session: any, 
    requiredLevel: number
  ): boolean => {
    return (session?.user?.verification_level ?? 0) >= requiredLevel;
  };
  
  export const hasTraderPermission = (
    session: any, 
    permission: 'pay_in' | 'pay_out'
  ): boolean => {
    return session?.user?.[permission] === true;
  };