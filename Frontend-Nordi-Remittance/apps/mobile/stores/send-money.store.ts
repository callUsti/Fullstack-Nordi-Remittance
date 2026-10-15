// ============================================================================
// SEND MONEY STORE — Local UI state for all transfer/send-money flows
// This covers: InternationalTransfer wizard, InstantPayment, QuickTransfer,
// DomesticTransfer, and CryptoTransfer form state.
// Server mutations are handled by React Query hooks. This store owns the
// transient form & wizard step state so the user doesn't lose progress
// when navigating between steps.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

type DeliveryMethod = 'swift' | 'local';
type CurrencyOption = {
  code: string;
  name: string;
  flag: string;
  rate: number;
  fee: number;
  symbol: string;
};

interface InternationalTransferState {
  currentStep: number;
  selectedWalletId: string;
  recipientName: string;
  ibanSwift: string;
  bankName: string;
  targetCurrencyCode: string;
  sendAmount: string;
  deliveryMethod: DeliveryMethod;
  isSuccess: boolean;
}

interface InstantPaymentState {
  phone: string;
  amount: string;
  note: string;
  isSuccess: boolean;
}

interface QuickTransferState {
  selectedContactId: string;
  amount: string;
  note: string;
}

interface DomesticTransferState {
  accountNumber: string;
  bankName: string;
  amount: string;
  narration: string;
}

interface CryptoTransferState {
  network: string;
  walletAddress: string;
  amount: string;
  memo: string;
  currentStep: number;
}

interface SendMoneyUIState {
  // International Transfer
  international: InternationalTransferState;

  // Instant Payment
  instant: InstantPaymentState;

  // Quick Transfer
  quick: QuickTransferState;

  // Domestic Transfer
  domestic: DomesticTransferState;

  // Crypto Transfer
  crypto: CryptoTransferState;

  // ===== Actions — International =====
  setIntlStep: (step: number) => void;
  setIntlWallet: (id: string) => void;
  setIntlRecipient: (name: string) => void;
  setIntlIbanSwift: (value: string) => void;
  setIntlBankName: (name: string) => void;
  setIntlTargetCurrency: (code: string) => void;
  setIntlSendAmount: (amount: string) => void;
  setIntlDeliveryMethod: (method: DeliveryMethod) => void;
  setIntlSuccess: (val: boolean) => void;
  resetIntl: () => void;

  // ===== Actions — Instant =====
  setInstantPhone: (phone: string) => void;
  setInstantAmount: (amount: string) => void;
  setInstantNote: (note: string) => void;
  setInstantSuccess: (val: boolean) => void;
  resetInstant: () => void;

  // ===== Actions — Quick =====
  setQuickContact: (id: string) => void;
  setQuickAmount: (amount: string) => void;
  setQuickNote: (note: string) => void;
  resetQuick: () => void;

  // ===== Actions — Domestic =====
  setDomesticAccount: (account: string) => void;
  setDomesticBank: (bank: string) => void;
  setDomesticAmount: (amount: string) => void;
  setDomesticNarration: (narration: string) => void;
  resetDomestic: () => void;

  // ===== Actions — Crypto =====
  setCryptoNetwork: (network: string) => void;
  setCryptoAddress: (address: string) => void;
  setCryptoAmount: (amount: string) => void;
  setCryptoMemo: (memo: string) => void;
  setCryptoStep: (step: number) => void;
  resetCrypto: () => void;
}

// ============================================================================
// DEFAULT STATE
// ============================================================================

const DEFAULT_INTERNATIONAL: InternationalTransferState = {
  currentStep: 0,
  selectedWalletId: '',
  recipientName: '',
  ibanSwift: '',
  bankName: '',
  targetCurrencyCode: 'EUR',
  sendAmount: '500',
  deliveryMethod: 'local',
  isSuccess: false,
};

const DEFAULT_INSTANT: InstantPaymentState = {
  phone: '',
  amount: '',
  note: '',
  isSuccess: false,
};

const DEFAULT_QUICK: QuickTransferState = {
  selectedContactId: '',
  amount: '',
  note: '',
};

const DEFAULT_DOMESTIC: DomesticTransferState = {
  accountNumber: '',
  bankName: '',
  amount: '',
  narration: '',
};

const DEFAULT_CRYPTO: CryptoTransferState = {
  network: 'ethereum',
  walletAddress: '',
  amount: '',
  memo: '',
  currentStep: 0,
};

// ============================================================================
// STORE
// ============================================================================

export const useSendMoneyStore = create<SendMoneyUIState>()((set) => ({
  international: DEFAULT_INTERNATIONAL,
  instant: DEFAULT_INSTANT,
  quick: DEFAULT_QUICK,
  domestic: DEFAULT_DOMESTIC,
  crypto: DEFAULT_CRYPTO,

  // --- International ---
  setIntlStep: (step) =>
    set((s) => ({ international: { ...s.international, currentStep: step } })),
  setIntlWallet: (id) =>
    set((s) => ({ international: { ...s.international, selectedWalletId: id } })),
  setIntlRecipient: (name) =>
    set((s) => ({ international: { ...s.international, recipientName: name } })),
  setIntlIbanSwift: (value) =>
    set((s) => ({ international: { ...s.international, ibanSwift: value } })),
  setIntlBankName: (name) =>
    set((s) => ({ international: { ...s.international, bankName: name } })),
  setIntlTargetCurrency: (code) =>
    set((s) => ({ international: { ...s.international, targetCurrencyCode: code } })),
  setIntlSendAmount: (amount) =>
    set((s) => ({ international: { ...s.international, sendAmount: amount } })),
  setIntlDeliveryMethod: (method) =>
    set((s) => ({ international: { ...s.international, deliveryMethod: method } })),
  setIntlSuccess: (val) =>
    set((s) => ({ international: { ...s.international, isSuccess: val } })),
  resetIntl: () => set({ international: DEFAULT_INTERNATIONAL }),

  // --- Instant ---
  setInstantPhone: (phone) =>
    set((s) => ({ instant: { ...s.instant, phone } })),
  setInstantAmount: (amount) =>
    set((s) => ({ instant: { ...s.instant, amount } })),
  setInstantNote: (note) =>
    set((s) => ({ instant: { ...s.instant, note } })),
  setInstantSuccess: (val) =>
    set((s) => ({ instant: { ...s.instant, isSuccess: val } })),
  resetInstant: () => set({ instant: DEFAULT_INSTANT }),

  // --- Quick ---
  setQuickContact: (id) =>
    set((s) => ({ quick: { ...s.quick, selectedContactId: id } })),
  setQuickAmount: (amount) =>
    set((s) => ({ quick: { ...s.quick, amount } })),
  setQuickNote: (note) =>
    set((s) => ({ quick: { ...s.quick, note } })),
  resetQuick: () => set({ quick: DEFAULT_QUICK }),

  // --- Domestic ---
  setDomesticAccount: (account) =>
    set((s) => ({ domestic: { ...s.domestic, accountNumber: account } })),
  setDomesticBank: (bank) =>
    set((s) => ({ domestic: { ...s.domestic, bankName: bank } })),
  setDomesticAmount: (amount) =>
    set((s) => ({ domestic: { ...s.domestic, amount } })),
  setDomesticNarration: (narration) =>
    set((s) => ({ domestic: { ...s.domestic, narration } })),
  resetDomestic: () => set({ domestic: DEFAULT_DOMESTIC }),

  // --- Crypto ---
  setCryptoNetwork: (network) =>
    set((s) => ({ crypto: { ...s.crypto, network } })),
  setCryptoAddress: (address) =>
    set((s) => ({ crypto: { ...s.crypto, walletAddress: address } })),
  setCryptoAmount: (amount) =>
    set((s) => ({ crypto: { ...s.crypto, amount } })),
  setCryptoMemo: (memo) =>
    set((s) => ({ crypto: { ...s.crypto, memo } })),
  setCryptoStep: (step) =>
    set((s) => ({ crypto: { ...s.crypto, currentStep: step } })),
  resetCrypto: () => set({ crypto: DEFAULT_CRYPTO }),
}));
