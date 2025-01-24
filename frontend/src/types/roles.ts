export type UserRole = 'admin' | 'trader' | 'user' | 'merchant';

export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
}