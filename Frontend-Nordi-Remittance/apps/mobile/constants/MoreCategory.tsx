import type { Href } from 'expo-router';

export type MoreOption = {
  title: string;
  iconName: string;
  link: any;
  badge?: string;
};

export type MoreCategoryGroup = {
  title: string;
  iconName: string;
  subOptions: MoreOption[];
};

const categories: MoreCategoryGroup[] = [
  {
    title: 'Accounts & Wallets',
    iconName: 'wallet-outline',
    subOptions: [
      { title: 'Multi-Currency Accounts', iconName: 'cash-outline', link: '/screens/accounts' },
      { title: 'Fixed Deposits & Yield', iconName: 'trending-up-outline', link: '/screens/investments', badge: '5.2% APY' },
      { title: 'Account Statements', iconName: 'document-text-outline', link: '/screens/accounts/AccountStatements' },
      { title: 'Account Limits', iconName: 'options-outline', link: '/screens/accounts/AccountLimits' },
      { title: 'Wallet Details', iconName: 'wallet-outline', link: '/screens/accounts/WalletDetails' },
    ],
  },
  {
    title: 'Remittance & Transfers',
    iconName: 'paper-plane-outline',
    subOptions: [
      { title: 'Send & Pay Hub', iconName: 'send-outline', link: '/(tabs)/send' },
      { title: 'Domestic Transfer', iconName: 'home-outline', link: '/screens/send-money/DomesticTransfer' },
      { title: 'International Wire', iconName: 'globe-outline', link: '/screens/Transactions/AccessToOthers', badge: 'Global' },
      { title: 'SwiftPay Instant P2P', iconName: 'flash-outline', link: '/screens/send-money/QuickTransfer', badge: 'Zero Fee' },
      { title: 'Access-to-Access', iconName: 'business-outline', link: '/screens/Transactions/AccessToAccess' },
      { title: 'Currency Converter & FX', iconName: 'swap-horizontal-outline', link: '/screens/forex' },
      { title: 'Transaction History', iconName: 'time-outline', link: '/screens/transactions' },
      { title: 'Scheduled Transfers', iconName: 'calendar-outline', link: '/screens/transactions/ScheduledTransfers' },
    ],
  },
  {
    title: 'Cards & Spending',
    iconName: 'card-outline',
    subOptions: [
      { title: 'Credit & Debit Cards', iconName: 'card-outline', link: '/screens/cards' },
      { title: 'Virtual Card Issuance', iconName: 'phone-portrait-outline', link: '/screens/cards/VirtualCards', badge: 'Instant' },
      { title: 'Apply for a Card', iconName: 'add-circle-outline', link: '/screens/cards/ApplyForCard' },
      { title: 'Card Security', iconName: 'lock-closed-outline', link: '/screens/cards/CardSecurity' },
      { title: 'Card Transactions', iconName: 'receipt-outline', link: '/screens/cards/CardTransactions' },
    ],
  },
  {
    title: 'Loans, Credit & Savings',
    iconName: 'pie-chart-outline',
    subOptions: [
      { title: 'Loans Overview', iconName: 'receipt-outline', link: '/screens/loans' },
      { title: 'Apply for a Loan', iconName: 'calculator-outline', link: '/screens/loans/ApplyForLoan' },
      { title: 'Credit Score', iconName: 'star-outline', link: '/screens/loans/CreditScore' },
      { title: 'Savings Goals & Vaults', iconName: 'shield-checkmark-outline', link: '/screens/savings', badge: '4.8% APY' },
      { title: 'Auto-Save Rules', iconName: 'repeat-outline', link: '/screens/savings/AutoSaveRules' },
      { title: 'Savings Analytics', iconName: 'stats-chart-outline', link: '/screens/savings/SavingsAnalytics' },
    ],
  },
  {
    title: 'Bills & Payments',
    iconName: 'receipt-outline',
    subOptions: [
      { title: 'Pay Bills', iconName: 'receipt-outline', link: '/screens/bills' },
      { title: 'Autopay Setup', iconName: 'repeat-outline', link: '/screens/bills/AutopaySetup' },
      { title: 'Beneficiaries', iconName: 'people-outline', link: '/screens/beneficiaries' },
      { title: 'Add Beneficiary', iconName: 'person-add-outline', link: '/screens/beneficiaries/AddBeneficiary' },
    ],
  },
  {
    title: 'Investments & Markets',
    iconName: 'trending-up-outline',
    subOptions: [
      { title: 'Investment Overview', iconName: 'stats-chart-outline', link: '/screens/investments' },
      { title: 'Market Insights', iconName: 'newspaper-outline', link: '/screens/investments/MarketInsights' },
      { title: 'Live FX Rates', iconName: 'swap-horizontal-outline', link: '/screens/forex/LiveRates' },
      { title: 'Currency Alerts', iconName: 'notifications-outline', link: '/screens/forex/CurrencyAlerts' },
    ],
  },
  {
    title: 'Crypto & Digital Assets',
    iconName: 'logo-bitcoin',
    subOptions: [
      { title: 'Crypto Transfers & Swaps', iconName: 'logo-bitcoin', link: '/screens/Transactions/AccessCrypto' },
      { title: 'Crypto Market Tickers', iconName: 'stats-chart-outline', link: '/screens/Homescreens/CryptoListScreen' },
    ],
  },
  {
    title: 'Rewards & Offers',
    iconName: 'star-outline',
    subOptions: [
      { title: 'My Rewards', iconName: 'trophy-outline', link: '/screens/rewards' },
      { title: 'Redeem Points', iconName: 'gift-outline', link: '/screens/rewards/RedeemPoints' },
      { title: 'Partner Discounts', iconName: 'pricetag-outline', link: '/screens/rewards/PartnerDiscounts' },
      { title: 'Special Offers', iconName: 'sparkles-outline', link: '/screens/rewards/SpecialOffers' },
    ],
  },
  {
    title: 'Identity, Security & Legal',
    iconName: 'shield-outline',
    subOptions: [
      { title: 'Identity Verification (KYC)', iconName: 'id-card-outline', link: '/screens/profile/DocumentCenter', badge: 'KYC' },
      { title: 'Security Center', iconName: 'lock-closed-outline', link: '/screens/security' },
      { title: 'Two-Factor Auth', iconName: 'shield-checkmark-outline', link: '/screens/security/TwoFactorAuth' },
      { title: 'Biometric Access', iconName: 'finger-print-outline', link: '/screens/security/BiometricAccess' },
      { title: 'Activity Logs', iconName: 'time-outline', link: '/screens/security/ActivityLogs' },
      { title: 'Security Alerts', iconName: 'warning-outline', link: '/screens/security/SecurityAlertsList', badge: '2' },
      { title: 'Terms of Service', iconName: 'book-outline', link: '/(auth)/terms-and-services' },
      { title: 'Privacy Policy', iconName: 'shield-half-outline', link: '/(auth)/privacy-policy' },
    ],
  },
  {
    title: 'Profile & Settings',
    iconName: 'person-circle-outline',
    subOptions: [
      { title: 'My Profile', iconName: 'person-outline', link: '/screens/profile' },
      { title: 'Personal Information', iconName: 'information-circle-outline', link: '/screens/profile/PersonalInformation' },
      { title: 'Edit Profile', iconName: 'create-outline', link: '/screens/profile/ClientUserEdit' },
      { title: 'Document Center', iconName: 'document-text-outline', link: '/screens/profile/DocumentCenter' },
      { title: 'Communication Preferences', iconName: 'notifications-outline', link: '/screens/profile/Communication' },
      { title: 'Language & Region', iconName: 'globe-outline', link: '/screens/profile/LanguageRegion' },
    ],
  },
  {
    title: 'Customer Support',
    iconName: 'help-circle-outline',
    subOptions: [
      { title: 'Support Center', iconName: 'headset-outline', link: '/screens/support' },
      { title: 'Live Chat', iconName: 'chatbubbles-outline', link: '/screens/support/LiveChat' },
      { title: 'FAQs', iconName: 'help-circle-outline', link: '/screens/support/FAQs' },
      { title: 'Schedule Appointment', iconName: 'calendar-outline', link: '/screens/support/ScheduleAppointment' },
      { title: 'Contact Us', iconName: 'mail-outline', link: '/screens/support/ContactUs' },
    ],
  },
];

export default categories;
