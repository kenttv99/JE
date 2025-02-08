import { UserIcon, ShoppingCartIcon, DocumentTextIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export const traderNavigation = [
  { name: 'Профиль', href: '/trader/profile', icon: UserIcon },
  { name: 'Ордера', href: '/trader/orders', icon: ShoppingCartIcon },
  { name: 'Реквизиты', href: '/trader/requisits', icon: DocumentTextIcon },
  { name: 'Статистика', href: '/trader/statistics', icon: ChartBarIcon },
  { name: 'Апелляции', href: '/trader/appeals', icon: ChatBubbleLeftRightIcon },
];