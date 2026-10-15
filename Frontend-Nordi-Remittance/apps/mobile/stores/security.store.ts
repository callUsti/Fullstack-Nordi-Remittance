// ============================================================================
// SECURITY STORE — Local UI state for the Security screens
// Global security settings are fetched via useClientSecuritySettings (React Query).
// This store owns transient UI toggles for BiometricAccess & TwoFactorAuth
// that the user interacts with before committing to the backend.
// ============================================================================
import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export interface TFAMethod {
  id: string;
  icon: string;
  label: string;
  desc: string;
  enabled: boolean;
  recommended?: boolean;
}

interface SecurityUIState {
  // BiometricAccess toggles
  fingerprintLogin: boolean;
  faceIdLogin: boolean;
  biometricTransactions: boolean;
  biometricCardView: boolean;

  // TwoFactorAuth methods list
  tfaMethods: TFAMethod[];

  // SecuritySettings toggles
  loginAlerts: boolean;
  sessionTimeout: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  securityPasswords: { current: string; newPass: string; confirm: string };

  // Actions — Biometric
  setFingerprintLogin: (val: boolean) => void;
  setFaceIdLogin: (val: boolean) => void;
  setBiometricTransactions: (val: boolean) => void;
  setBiometricCardView: (val: boolean) => void;

  // Actions — 2FA
  toggleTfaMethod: (id: string) => void;

  // Actions — SecuritySettings
  setLoginAlerts: (val: boolean) => void;
  setSessionTimeout: (val: boolean) => void;
  setShowCurrentPassword: (val: boolean) => void;
  setShowNewPassword: (val: boolean) => void;
  setSecurityPasswords: (passwords: { current: string; newPass: string; confirm: string }) => void;
  resetSecurityPasswords: () => void;
}

// ============================================================================
// DEFAULT TFA METHODS
// ============================================================================

const DEFAULT_TFA_METHODS: TFAMethod[] = [
  {
    id: 'sms',
    icon: 'chatbox-outline',
    label: 'SMS Code',
    desc: 'Receive a one-time code via SMS',
    enabled: true,
  },
  {
    id: 'app',
    icon: 'apps-outline',
    label: 'Authenticator App',
    desc: 'Use Google or Microsoft Authenticator',
    enabled: false,
    recommended: true,
  },
  {
    id: 'email',
    icon: 'mail-outline',
    label: 'Email OTP',
    desc: 'Receive a code to your registered email',
    enabled: false,
  },
  {
    id: 'biometric',
    icon: 'finger-print-outline',
    label: 'Biometric Confirm',
    desc: 'Use fingerprint or Face ID for transactions',
    enabled: true,
  },
];

// ============================================================================
// STORE
// ============================================================================

export const useSecurityStore = create<SecurityUIState>()((set) => ({
  // Biometric defaults
  fingerprintLogin: true,
  faceIdLogin: false,
  biometricTransactions: true,
  biometricCardView: true,

  // TFA defaults
  tfaMethods: DEFAULT_TFA_METHODS,

  // SecuritySettings defaults
  loginAlerts: true,
  sessionTimeout: true,
  showCurrentPassword: false,
  showNewPassword: false,
  securityPasswords: { current: '', newPass: '', confirm: '' },

  // Biometric actions
  setFingerprintLogin: (val) => set({ fingerprintLogin: val }),
  setFaceIdLogin: (val) => set({ faceIdLogin: val }),
  setBiometricTransactions: (val) => set({ biometricTransactions: val }),
  setBiometricCardView: (val) => set({ biometricCardView: val }),

  // 2FA actions
  toggleTfaMethod: (id) =>
    set((state) => ({
      tfaMethods: state.tfaMethods.map((m) =>
        m.id === id ? { ...m, enabled: !m.enabled } : m
      ),
    })),

  // SecuritySettings actions
  setLoginAlerts: (val) => set({ loginAlerts: val }),
  setSessionTimeout: (val) => set({ sessionTimeout: val }),
  setShowCurrentPassword: (val) => set({ showCurrentPassword: val }),
  setShowNewPassword: (val) => set({ showNewPassword: val }),
  setSecurityPasswords: (passwords) => set({ securityPasswords: passwords }),
  resetSecurityPasswords: () =>
    set({ securityPasswords: { current: '', newPass: '', confirm: '' } }),
}));
