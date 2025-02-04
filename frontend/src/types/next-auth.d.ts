// frontend/src/types/next-auth.d.ts
import 'next-auth';
import { CustomUser } from '@/lib/auth.config';

declare module 'next-auth' {
  interface User extends CustomUser {}

  interface Session {
    user: CustomUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user?: CustomUser;
  }
}