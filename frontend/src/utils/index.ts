// NEW FILE: frontend/src/utils/index.ts
export const formatDate = (date: Date | string, utcOffset: number = 0): string => {
    const d = new Date(date);
    const offsetMs = utcOffset * 60 * 60 * 1000;
    const localTime = new Date(d.getTime() + offsetMs);
    return localTime.toISOString().slice(0, 19).replace('T', ' ');
  };
  
  export const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };
  
  export const hasRequiredVerification = (
    session: any, 
    requiredLevel: number
  ): boolean => {
    return (session?.user?.verification_level ?? 0) >= requiredLevel;
  };
  
  export const isTrader = (session: any): boolean => {
    return session?.user?.role === 'trader';
  };
  
  export const hasTraderPermission = (
    session: any, 
    permission: 'pay_in' | 'pay_out'
  ): boolean => {
    return session?.user?.[permission] === true;
  };