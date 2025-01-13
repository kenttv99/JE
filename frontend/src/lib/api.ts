import axios from 'axios';
import { ApiResponse } from '@/types/api';
import { User } from '@/types/user';

export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  const token = localStorage.getItem('token');
  const response = await axios.get<ApiResponse<User>>('/api/v1/users/me', {
    headers: {
      Authorization: token || '',
    },
  });
  return response.data;
};

export const login = async (email: string, password: string): Promise<ApiResponse<{ access_token: string }>> => {
  const response = await axios.post<ApiResponse<{ access_token: string }>>('/api/v1/auth/login', {
    email,
    password,
  });
  return response.data;
};