import type { Href } from 'expo-router';

type HomeService = {
  id: number;
  name: string;
  icon: string;
  color: string;
  bg: string;
  route: Href;
};

const services = [
  [
    {
      id: 1,
      name: 'Send Money',
      icon: 'send',
      color: '#0284c7',
      bg: '#e0f2fe',
      route: '/screens/Homescreens/Transfer'
    },
    {
      id: 2,
      name: 'International Transfers',
      icon: 'globe',
      color: '#0ea5e9',
      bg: '#e0f2fe',
      route: '/screens/Transactions/AccessInternational'
    },
    {
      id: 3,
      name: 'Cards',
      icon: 'card',
      color: '#c2410c',
      bg: '#ffedd5',
      route: '/screens/cards'
    },
    {
      id: 4,
      name: 'More',
      icon: 'grid',
      color: '#475569',
      bg: '#f1f5f9',
      route: '/screens/Homescreens/MoreOptions'
    }
  ],
  [
    {
      id: 5,
      name: 'Access-to-Access',
      icon: 'business',
      color: '#2563eb',
      bg: '#dbeafe',
      route: '/screens/Transactions/AccessToAccess'
    },
    {
      id: 6,
      name: 'SwiftPay',
      icon: 'flash',
      color: '#ef4444',
      bg: '#fee2e2',
      route: '/screens/Transactions/AccessSwiftPay'
    },
    {
      id: 7,
      name: 'Crypto',
      icon: 'logo-bitcoin',
      color: '#f7931a',
      bg: '#ffedd5',
      route: '/screens/Transactions/AccessCrypto'
    },
    {
      id: 8,
      name: 'Crypto Market',
      icon: 'trending-up',
      color: '#7c3aed',
      bg: '#f3e8ff',
      route: '/screens/Homescreens/CryptoListScreen'
    }
  ]
] satisfies HomeService[][];

export default services;
