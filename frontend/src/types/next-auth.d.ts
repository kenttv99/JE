import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
  }

  interface Session {
    user: User;
  }
}