import type { Href } from 'expo-router';

type HomeService = {
  id: number;
  name: string;
  icon: string;
  color: string;
  bg: string;
  route: any;
};

const services = [
  [
    {
      id: 1,
      name: 'Send Money',
      icon: 'paper-plane-outline',
      color: '#2563eb',
      bg: '#eff6ff',
      route: '/screens/send-money',
    },
    {
      id: 2,
      name: 'Forex Exchange',
      icon: 'swap-horizontal-outline',
      color: '#0891b2',
      bg: '#ecfeff',
      route: '/screens/forex',
    },
    {
      id: 3,
      name: 'Cards',
      icon: 'card-outline',
      color: '#d97706',
      bg: '#fffbeb',
      route: '/screens/cards',
    },
    {
      id: 4,
      name: 'Investments',
      icon: 'trending-up-outline',
      color: '#7c3aed',
      bg: '#f5f3ff',
      route: '/screens/investments',
    },
  ],
  [
    {
      id: 5,
      name: 'Loans',
      icon: 'cash-outline',
      color: '#059669',
      bg: '#ecfdf5',
      route: '/screens/loans',
    },
    {
      id: 6,
      name: 'Savings',
      icon: 'wallet-outline',
      color: '#4f46e5',
      bg: '#eef2ff',
      route: '/screens/savings',
    },
    {
      id: 7,
      name: 'Pay Bills',
      icon: 'receipt-outline',
      color: '#e11d48',
      bg: '#fff1f2',
      route: '/screens/bills',
    },
    {
      id: 8,
      name: 'More',
      icon: 'grid-outline',
      color: '#64748b',
      bg: '#f8fafc',
      route: '/screens/Homescreens/MoreOptions',
    },
  ],
] satisfies HomeService[][];

export default services;
