import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

type MoreOption = {
  title: string;
  icon: ReactNode;
  link: Href;
};

const categories: {
  title: string;
  icon: ReactNode;
  subOptions: MoreOption[];
}[] = [
  {
    title: 'Account',
    icon: <FontAwesome name="bank" size={15} color="#1E3A8A" />,
    subOptions: [
      {
        title: 'Profile',
        icon: <FontAwesome name="user" size={20} color="#0D9488" />,
        link: '/(tabs)/profile'
      },
      {
        title: 'Security & Access',
        icon: <FontAwesome name="shield" size={20} color="#F59E0B" />,
        link: '/(tabs)/access'
      }
    ]
  },
  {
    title: 'Transfers',
    icon: <FontAwesome name="exchange" size={24} color="#0D9488" />,
    subOptions: [
      {
        title: 'Access-to-Access',
        icon: <FontAwesome name="arrow-right" size={20} color="#3B82F6" />,
        link: '/screens/Transactions/AccessToAccess'
      },
      {
        title: 'Access-to-Others',
        icon: <FontAwesome name="users" size={20} color="#EF4444" />,
        link: '/screens/Transactions/AccessToOthers'
      },
      {
        title: 'International Transfer',
        icon: <FontAwesome name="globe" size={20} color="#4F46E5" />,
        link: '/screens/Transactions/AccessInternational'
      },
      {
        title: 'SwiftPay',
        icon: <FontAwesome name="bolt" size={20} color="#F97316" />,
        link: '/screens/Transactions/AccessSwiftPay'
      },
      {
        title: 'Crypto',
        icon: <FontAwesome name="bitcoin" size={20} color="#F7931A" />,
        link: '/screens/Transactions/AccessCrypto'
      }
    ]
  },
  {
    title: 'Payment Methods',
    icon: <FontAwesome name="credit-card" size={24} color="#2563EB" />,
    subOptions: [
      {
        title: 'Cards',
        icon: <FontAwesome name="credit-card" size={20} color="#C2410C" />,
        link: '/screens/cards'
      }
    ]
  },
  {
    title: 'Support',
    icon: <FontAwesome name="life-ring" size={24} color="#1E90FF" />,
    subOptions: [
      {
        title: 'Help & Support',
        icon: <FontAwesome name="question-circle" size={20} color="#3B82F6" />,
        link: '/(tabs)/support'
      }
    ]
  }
];

export default categories;
