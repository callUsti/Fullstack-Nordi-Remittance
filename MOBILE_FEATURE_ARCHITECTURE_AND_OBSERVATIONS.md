# Nordi Remittance — Mobile Architecture, Observability & Feature Integration Blueprint

> **Reference Specification & Implementation Guide**  
> *Target Workspace:* `Frontend-Nordi-Remittance/apps/mobile`  
> *Root Package:* `Frontend-Nordi-Remittance/packages/shared`  
> *Web Reference:* `Frontend-Nordi-Remittance/apps/website/src/pages/client/UserRoutes.tsx`  
> *Audit Standards:* `.agent/ui-ux-audit.md` & `.agent/mobile-audit.md`

---

## 1. Executive Summary & Core Objectives

### The Objective
Migrate and integrate the complete 20+ feature suite of Nordi Remittance client portal (originating from `Frontend-Nordi-Remittance/apps/website/src/pages/client/UserRoutes.tsx`) into the React Native / Expo mobile application (`Frontend-Nordi-Remittance/apps/mobile`).

### Design Aesthetic Mandate
* **Luxury & High-Density UI**: Small icon sizes (16–20px), crisp typography, subtle borders (`0.5–1px`), balanced micro-spacing (4–12px padding/margins), and dark/light surface elevations.
* **Top Sub-Nav Pills & Slidable Navigation**: Binance-style horizontal scrollable sub-tabs at the top of multi-view screens (`SubNavTabs`), paired with the bottom navigation bar and slide-up modal bottom sheets.
* **Zero Duplication / Zero Inline Color Drift**: Strictly forbid repeating hex literals (`#2563eb`, `#111827`, `#6b7280`), custom `<View>` cards, or ad-hoc button implementations. Every screen must consume and extend our centralized design system, theme store, and shared packages.

---

## 2. Root Cause Analysis: Why Repetitions & Drift Occurred

During initial prototyping of screens such as `app/(tabs)/send.tsx`, `index.tsx`, and `screens/Homescreens/MoreOptions.tsx`, several anti-patterns emerged:

1. **Ad-hoc Hex Colors & Inline Styles**:
   * Screens hardcoded colors like `backgroundColor: '#dbeafe'` or `color: '#2563eb'` directly in `StyleSheet.create`.
   * **Resolution**: All styling must draw strictly from `useMobileTheme()` and `@nordi/shared/constants/colors`. Theme tokens provide semantic properties: `background`, `surface`, `surfaceAlt`, `text`, `textMuted`, `border`, `primary`, `primarySoft`, `iconMuted`, `danger`, `dangerSoft`.
2. **Re-inventing Reusable Components**:
   * Screen files wrote custom cards, custom input boxes, custom badges, and recipient avatars from scratch.
   * **Resolution**: The codebase already features battle-tested reusable UI components in `@/components/ui`, `@/components/shared`, and `@/components/banking`. These must be the sole building blocks.
3. **Mock Data Arrays instead of Shared Hooks & Stores**:
   * Screens relied on static dummy arrays (`quickRecipients`, `billItems`, `loans`) rather than querying the real domain through `@nordi/shared/hooks/api-queries`.
   * **Resolution**: Hook each screen directly into its corresponding React Query hook (`useAccounts`, `useTransactions`, `useLoans`, `useInvestments`, etc.) with proper loading states, skeletons, and error boundaries.

---

## 3. Comprehensive Inventory of `@nordi/shared` (Root Package)

The shared package is located at `Frontend-Nordi-Remittance/packages/shared` and is consumed via `@nordi/shared/*`.

### 3.1 Domain Repositories (`packages/shared/src/domain/repository/`)
All backend API contracts are strongly typed and encapsulated in these repositories:
| Repository File | Primary Endpoints Handled |
| :--- | :--- |
| `accounts.repository.ts` | Wallets (`/wallets`), Account Summary, Limits (`/limits`), Beneficiaries, Multi-currency balances |
| `admin.repository.ts` | Admin auth, audit logs, user management, permissions, system settings |
| `attachments.repository.ts` | File uploads, KYC documents (`/kyc/documents`), media retrieval |
| `auth.repository.ts` | Login, register, 2FA verification, OTP, Clerk sync, token refresh, reset password |
| `cards.repository.ts` | Physical & Virtual card issuance, card freeze/unfreeze, PIN update, limits, spending controls |
| `fraud.repository.ts` | Behavioral signals, fraud cases, security event logging, velocity rules |
| `integrations.repository.ts` | External bank linking, webhooks, API keys, partner services |
| `investments.repository.ts` | Portfolio summary, asset buy/sell, mutual funds, stocks/ETFs, savings goals |
| `kyc.repository.ts` | KYC verification status, ID/selfie/address submissions, tier upgrade |
| `legal.repository.ts` | Terms of service, privacy policy, user consents, dispute filing |
| `loans.repository.ts` | Loan applications, eligibility check, amortization schedules, loan repayment |
| `notifications.repository.ts` | Notification center, push device tokens, read/unread counts |
| `permissions.repository.ts` | RBAC roles, permission sets, authorization checks |
| `security.repository.ts` | Security score, active sessions, trusted devices, 2FA setup/disable |
| `statistics.repository.ts` | User spending analytics, cash flow breakdown, platform growth metrics |
| `transactions.repository.ts` | Transfers (domestic, international, internal), deposits, withdrawals, history |
| `users.repository.ts` | User profile, personal details, contact info update, close account |

### 3.2 React Query Hooks (`packages/shared/src/hooks/api-queries/`)
Pre-configured TanStack React Query hooks with automatic caching, invalidation, and background synchronization:
* `useAccounts`: `useWallets`, `useWallet`, `useAccountSummary`, `useAccountLimits`, `useBalanceHistory`, `useBeneficiaries`, `useAddBeneficiary`, `useRemoveBeneficiary`
* `useCards`: `useCards`, `useCardDetails`, `useCardTransactions`, `useCreateVirtualCard`, `useCreatePhysicalCard`, `useFreezeCard`, `useUnfreezeCard`, `useUpdateCardLimits`
* `useTransactions`: `useTransactions`, `useTransactionDetails`, `useCreateTransfer`, `useDeposit`, `useWithdraw`, `useCancelTransaction`
* `useInvestments`: `usePortfolio`, `useInvestmentAssets`, `useBuyAsset`, `useSellAsset`, `useSavingsGoals`, `useCreateGoal`, `useGoalDeposit`, `useGoalWithdraw`
* `useLoans`: `useLoans`, `useLoanDetails`, `useLoanEligibility`, `useApplyLoan`, `useLoanSchedule`, `useRepayLoan`
* `useSecurity`: `useSecurityScore`, `useSecuritySettings`, `useSessions`, `useRevokeSession`, `use2faSetup`, `useTrustedDevices`
* `useKyc`: `useKycStatus`, `useKycDocuments`, `useSubmitKycDocument`, `useVerifyKyc`
* `useLegal`: `useLegalDocuments`, `useLegalDocument`, `useUserConsents`, `useRecordConsent`, `useDisputes`, `useFileDispute`
* `useNotifications`: `useNotifications`, `useUnreadCount`, `useMarkNotificationRead`, `useRegisterPushToken`
* `useStatistics`: `useSpendingStatistics`, `useUserStatistics`, `useTransactionStatistics`
* `useUsers`: `useUserProfile`, `useUpdateUserProfile`, `useUserActivity`

### 3.3 Zustand Global Stores (`packages/shared/src/store/`)
| Store | State Managed |
| :--- | :--- |
| `auth.store.ts` | Auth session, user payload, JWT access/refresh tokens, isAuthenticated |
| `theme.store.ts` | Dark mode boolean, theme mode (`light` \| `dark` \| `system`), toggle function |
| `ui.store.ts` | Modals, active drawer, sheet controls, global loading overlays |
| `account.store.ts` | Selected primary wallet, active currency filter, selected beneficiary |
| `transaction.store.ts` | Multi-step transfer wizard draft (amount, recipient, transfer type, fee) |
| `toast.store.ts` | Global notification banners, alert queue, dismiss timer |
| `socket.store.ts` | Real-time WebSocket connection state, live currency tickers, alert events |
| `users.store.ts` | User preferences, language, localized currency |
| `permissions.store.ts` | User feature flags and tier entitlements |

### 3.4 Shared Constants & Design Tokens (`packages/shared/src/constants/`)
* `colors.ts`: Base palette (slate, blue, emerald, amber, rose, violet) and high-contrast tokens.
* `typography.ts`: Mobile & web font scales, weights (`fontWeights.medium`, `fontWeights.semibold`), line heights.
* `sizes.ts`: Unified spacing ladder (`space[1]` to `space[16]`), border radii (`radii.sm`, `radii.md`, `radii.lg`, `radii.full`), touch sizes.
* `form-options.ts`: Predefined select options (currencies, countries, transfer reasons, ID document types).
* `breakpoints.ts` & `mobile-responsive.ts`: Platform layout heuristics.

---

## 4. Mobile Component Architecture & Reusables Inventory

The mobile app has pre-existing design system components located in `Frontend-Nordi-Remittance/apps/mobile/components/`:

### 4.1 UI Primitives (`@/components/ui`)
* `Button.tsx`: Variants (`primary`, `secondary`, `outline`, `ghost`, `danger`), sizes (`sm`, `md`, `lg`), loading spinner indicator.
* `Card.tsx`: Bordered, elevated, or surface card container with theme-reactive background and border.
* `Badge.tsx`: Pill indicators for status (`success`, `warning`, `danger`, `info`, `neutral`).
* `Input.tsx`: Form inputs with floating/stacked labels, prefix/suffix icons, error states, and clear buttons.
* `Select.tsx`: Dropdown / picker modal with search filter and item checkmark.
* `DatePicker.tsx`: Native iOS/Android date selection modal.
* `FileUpload.tsx`: Native document and image picker with progress bar and thumbnail preview.
* `Avatar.tsx`: Initials fallback, image loading, status badges, and size variants (`xs`, `sm`, `md`, `lg`).
* `Icon.tsx`: Unified wrapper for Lucide & Vector icons with consistent sizing and theme tint.
* `Modal.tsx`: Accessible centered dialog modal with backdrop blur and animated enter/exit.
* `Spinner.tsx`: Smooth activity indicator.
* `ToastContainer.tsx`: Fixed floating container attached to `toast.store`.

### 4.2 Shared Business Primitives (`@/components/shared`)
* `ScreenHeader.tsx`: Clean top header with back button, right action, and **`SubNavTabs`** (the Binance-style top pill switcher).
* `PageHeader.tsx`: Title, subtitle, and primary action button header.
* `DashboardPrimitives.tsx`: Balance cards, quick action tiles, stats counters, metric trends.
* `TransferPrimitives.tsx`: Step indicators, account selector cards, review summary rows, fee breakdown.
* `QuerySection.tsx`: Intelligent query wrapper handling `isLoading`, `isError`, and `isEmpty` with automatic skeleton/retry UI.
* `EmptyState.tsx`: High-polish empty placeholders with descriptive icon, message, and call-to-action button.
* `ErrorBoundary.tsx`: Catches rendering crashes and provides a graceful retry screen.
* `SearchInput.tsx`: Compact search box with debounce and clear button.
* `CountrySelect.tsx`: Country list selector with flags and dial codes.
* `ThemeToggle.tsx`: Animated switch toggling `theme.store`.
* `UserEligibilityModal.tsx`: Eligibility gating for loans/cards/investments.
* `SessionExpiredModal.tsx`: Prompts re-auth on 401 response.

### 4.3 Banking Domain Components (`@/components/banking`)
* `AccountCard.tsx`: Multi-currency wallet balance preview with account number masking and copy-to-clipboard.
* `CreditCardDisplay.tsx`: Realistic visual debit/credit card with chip, contactless icon, flip animation, and CVV reveal.
* `BalanceDisplay.tsx`: Formatted currency balance with privacy toggle (show/hide balance `***`).
* `BeneficiaryCard.tsx`: Recipient card with avatar, bank name, account number, and quick send action.
* `FxRateConverter.tsx`: Live currency exchange rate calculator and chart preview.
* `KycStatusBanner.tsx`: Tier status badge (`Unverified`, `Tier 1`, `Tier 2`, `Verified`) with direct action link.
* `NotificationItem.tsx`: Push/in-app notification row with unread dot, timestamp, and icon category.
* `OtpInput.tsx`: 4 or 6-digit pin input boxes with auto-focus and paste support.
* `SecurityPromptModal.tsx`: Biometric / PIN authorization dialog for high-value transactions.
* `TransactionItem.tsx`: High-density transaction row showing category icon, counterparty, status badge, date, and amount.
* `TransferSummaryCard.tsx`: Receipt-style summary of an executed transfer.

---

## 5. Web Client vs. Mobile Architecture Mapping

Below is the exhaustive mapping of all 16 client domains and 50+ routes from `UserRoutes.tsx` to mobile reactive screens:

| # | Domain (Web `UserRoutes.tsx`) | Web Sub-Routes | Mobile Route / Integration Strategy | Shared Hooks / Stores | Mobile Reusable UI Used |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Dashboard** | `dashboard` | `app/(tabs)/index.tsx` (Enhanced Home) | `useAccountSummary`, `useWallets`, `useTransactions`, `useThemeStore` | `DashboardPrimitives`, `BalanceDisplay`, `TransactionItem`, `FeaturedComponent` |
| **2** | **Accounts** | `accounts`, `accounts/savings`, `accounts/current`, `accounts/fixed-deposits`, `accounts/statements` | `app/screens/banking/accounts.tsx` (with top `SubNavTabs`) | `useWallets`, `useWallet`, `useAccountLimits`, `useBalanceHistory` | `AccountCard`, `QuerySection`, `SubNavTabs`, `EmptyState` |
| **3** | **Transactions & History** | `transactions`, `transactions/recent`, `transactions/scheduled`, `transactions/history`, `transactions/download` | `app/screens/banking/transactions.tsx` | `useTransactions`, `useTransactionDetails` | `TransactionItem`, `SearchInput`, `SubNavTabs`, `Badge`, `QuerySection` |
| **4** | **Send Money** | `send`, `send/domestic`, `send/international`, `send/quick`, `send/instant` | `app/(tabs)/send.tsx` (Sub-Nav: Domestic, International, Access-to-Access, SwiftPay) | `useCreateTransfer`, `useWallets`, `useBeneficiaries`, `transaction.store` | `TransferPrimitives`, `SubNavTabs`, `AccountCard`, `Button`, `OtpInput` |
| **5** | **Beneficiaries** | `beneficiaries`, `beneficiaries/all`, `beneficiaries/add`, `beneficiaries/categories`, `beneficiaries/recent` | `app/screens/banking/beneficiaries.tsx` (or Sub-tab in Send) | `useBeneficiaries`, `useAddBeneficiary`, `useRemoveBeneficiary` | `BeneficiaryCard`, `SearchInput`, `Modal`, `Button`, `Input` |
| **6** | **Cards** | `cards`, `cards/overview`, `cards/transactions`, `cards/apply`, `cards/security`, `cards/virtual` | `app/screens/cards.tsx` (Sub-Nav: Overview, Virtual, Apply, Controls) | `useCards`, `useCreateVirtualCard`, `useFreezeCard`, `useUpdateCardLimits` | `CreditCardDisplay`, `SubNavTabs`, `Button`, `Badge`, `Input` |
| **7** | **Loans & Credit** | `loans`, `loans/overview`, `loans/apply`, `loans/calculator`, `loans/credit-score` | `app/screens/banking/loans.tsx` (Sub-Nav: Active, Apply, Calculator) | `useLoans`, `useLoanEligibility`, `useApplyLoan`, `useLoanSchedule` | `SubNavTabs`, `Card`, `Button`, `Input`, `Badge`, `QuerySection` |
| **8** | **Investments** | `investments`, `investments/overview`, `investments/mutual-funds`, `investments/stocks`, `investments/fixed-income`, `investments/insights` | `app/screens/banking/investments.tsx` (Sub-Nav: Portfolio, Assets, Buy/Sell) | `usePortfolio`, `useInvestmentAssets`, `useBuyAsset`, `useSellAsset` | `Card`, `SubNavTabs`, `QuerySection`, `Button`, `Badge` |
| **9** | **Savings Goals** | `savings`, `savings/goals`, `savings/create`, `savings/auto-save`, `savings/analytics` | `app/screens/banking/savings.tsx` (Sub-Nav: Goals, Create, Auto-Save) | `useSavingsGoals`, `useCreateGoal`, `useGoalDeposit`, `useGoalWithdraw` | `Card`, `SubNavTabs`, `Input`, `Button`, `Badge` |
| **10** | **Bill Payments** | `bills`, `bills/pay`, `bills/scheduled`, `bills/utilities`, `bills/autopay` | `app/screens/banking/bills.tsx` (Sub-Nav in Send Hub) | `useTransactions`, `useWallets` | `Card`, `Button`, `Select`, `Input`, `SubNavTabs` |
| **11** | **Forex & Exchange** | `forex`, `forex/exchange`, `forex/rates`, `forex/alerts`, `forex/history` | `app/screens/Transactions/ConvertFx.tsx` | `useAccountSummary`, `useCreateTransfer` | `FxRateConverter`, `Card`, `Button`, `Input` |
| **12** | **Crypto Hub** | Web crypto routes | `app/screens/Homescreens/CryptoListScreen.tsx` & `app/screens/Transactions/AccessCrypto.tsx` | `socket.store`, `useWallets` | `PartialCrypto`, `Card`, `Button`, `Badge` |
| **13** | **QR & Instant Payments** | `mobile/qr`, `send/instant` | `app/(tabs)/scan.tsx` & `app/screens/Transactions/AccessSwiftPay.tsx` | `useCreateTransfer` | Camera scanner, `OtpInput`, `Button` |
| **14** | **Rewards & Offers** | `rewards`, `rewards/overview`, `rewards/redeem`, `rewards/offers`, `rewards/partners` | `app/screens/banking/rewards.tsx` | `useUserProfile`, `useUserActivity` | `Card`, `Badge`, `Button`, `SubNavTabs` |
| **15** | **Support & Help** | `support`, `support/contact`, `support/chat`, `support/faqs`, `support/appointment` | `app/(tabs)/support.tsx` & `app/(auth)/contact.tsx` | `useLegalDocuments`, `useDisputes` | `Card`, `Button`, `Input`, `SubNavTabs`, `EmptyState` |
| **16** | **Security Center** | `security`, `security/settings`, `security/2fa`, `security/biometric`, `security/logs`, `security/alerts` | `app/(tabs)/access.tsx` (My Access) | `useSecurityScore`, `useSecuritySettings`, `useSessions`, `use2faSetup` | `Card`, `Badge`, `Button`, `SubNavTabs`, `SecurityPromptModal` |
| **17** | **Profile & Preferences** | `profile`, `profile/personal`, `profile/edit`, `profile/communication`, `profile/language`, `profile/documents` | `app/(tabs)/profile.tsx` | `useUserProfile`, `useUpdateUserProfile`, `useThemeStore` | `Avatar`, `Input`, `Button`, `ThemeToggle`, `CountrySelect` |
| **18** | **KYC Document Center** | `profile/documents`, `kyc` | `app/screens/banking/kyc.tsx` | `useKycStatus`, `useKycDocuments`, `useSubmitKycDocument` | `KycStatusBanner`, `FileUpload`, `Button`, `Card` |
| **19** | **Legal & Compliance** | Terms, Privacy, Consents, Regulatory | `app/(auth)/terms-and-services.tsx` & `app/(auth)/privacy-policy.tsx` | `useLegalDocuments`, `useUserConsents` | `Card`, `Button`, `QuerySection` |
| **20** | **Notifications & Alerts** | `mobile/notifications` | `app/screens/banking/notifications.tsx` (Top bell modal/screen) | `useNotifications`, `useMarkNotificationRead` | `NotificationItem`, `EmptyState`, `Button` |

---

## 6. Implementation Principles & Golden Rules

### Rule 1: Always Use `useMobileTheme()`
Never declare inline color hexes like `'#2563eb'` or `'#ffffff'`. Always consume:
```tsx
import { useMobileTheme } from '@/core/theme/useMobileTheme';
const theme = useMobileTheme();
// Use: theme.background, theme.surface, theme.surfaceAlt, theme.text, theme.textMuted,
//      theme.border, theme.primary, theme.primarySoft, theme.danger, theme.dangerSoft
```

### Rule 2: Always Use Reusable Components First
Before writing a `<View>` or `<Text>`:
* For containers: use `<Card>` or `@/components/layout/Container`.
* For buttons: use `<Button variant="..." size="...">`.
* For statuses: use `<Badge variant="...">`.
* For text inputs: use `<Input label="..." error="..." />`.
* For query data: wrap with `<QuerySection isLoading={...} isError={...} isEmpty={...}>`.
* For sub-navigation: use `<SubNavTabs tabs={TABS} activeTab={tab} onSelect={setTab} />`.

### Rule 3: Use Shared API Hooks Directly
Do not mock responses or duplicate API fetch calls. Import directly:
```tsx
import { useWallets, useBeneficiaries } from '@nordi/shared/hooks/api-queries/useAccounts';
import { useTransactions } from '@nordi/shared/hooks/api-queries/useTransactions';
import { useCards } from '@nordi/shared/hooks/api-queries/useCards';
```

### Rule 4: Compact, Luxury Styling Paradigm
* **Font Sizes**: Titles `16–18px` (bold/semibold), Subtitles `12–13px`, Body `13–14px`, Badges/Meta `10–11px`.
* **Icon Sizes**: Primary buttons `16–18px`, List items `18–20px`, Header actions `20–22px`.
* **Padding & Margins**: Micro-spacings `4px`, `8px`, `12px`, `16px`. Avoid giant 24–32px gaps that waste mobile viewport space.
* **Borders**: Clean `0.5px` to `1px` subtle borders (`theme.border`) to deliver a luxury banking feel.

---

## 7. Execution Sequence

1. **Architecture & Standards Baseline**: *(Completed with this document at root)*.
2. **Refactor Existing Core Screens**:
   * Refactor `app/(tabs)/send.tsx`: Replace mock data and hardcoded styling with real `useWallets`, `useBeneficiaries`, `useCreateTransfer`, and reusable components (`SubNavTabs`, `Card`, `Button`, `TransferPrimitives`).
   * Refactor `app/(tabs)/index.tsx`: Replace mock Netflix transactions with real `useTransactions` and `TransactionItem`.
   * Complete stub files in `app/screens/Transactions/`: `AccessCrypto.tsx`, `AccessInternational.tsx`, `AccessSwiftPay.tsx`, `AccessToAccess.tsx`, and `ConvertFx.tsx`.
3. **Integrate Missing Feature Screens**:
   * Cards Hub (`app/screens/cards.tsx`) connecting `useCards`.
   * Accounts & Statements (`app/screens/banking/accounts.tsx`).
   * Loans & Credit (`app/screens/banking/loans.tsx`) connecting `useLoans`.
   * Savings Goals (`app/screens/banking/savings.tsx`) connecting `useInvestments` (`useSavingsGoals`).
   * KYC Document Verification (`app/screens/banking/kyc.tsx`) connecting `useKyc`.
   * Notification Center (`app/screens/banking/notifications.tsx`) connecting `useNotifications`.
4. **Navigation & Tab Bar Polish**:
   * Update bottom tab bar and top header quick actions so every client feature is readily discoverable.
   * Validate Expo Router links across both iOS and Android responsive viewports.
