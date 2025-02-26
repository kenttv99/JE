export type StatusType = 'active' | 'deleted' | 'all';
export type SearchColumnType = 
  'req_number' | 
  'payment_method' | 
  'bank' | 
  'all' |
  'payment_method_description' | 
  'bank_description';

// Добавленные типы для сортировки
export type SortField = 'can_buy' | 'can_sell' | null;
export type SortDirection = 'asc' | 'desc';