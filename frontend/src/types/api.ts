// import { User } from './user';

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}