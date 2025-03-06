// JE/frontend/src/types/next-auth.d.ts
import 'next-auth';
import { TraderData } from '@/types/auth';
import { ExtendedJWT } from '@/types/auth';

declare module 'next-auth' {
  interface User extends Omit<TraderData, 'bankDetails'> {}

  interface Session {
    user: TraderData;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends ExtendedJWT {}
}