// Moved to the shared package - re-exported for backwards-compatible imports.
// This module both augments the global scope via `declare global` (side-effect
// import) and exports real named symbols, so both forms are re-exported here.
import '@nordi/shared/domain/types/Accounts.types';
export {
  ACCOUNT_TYPE_LABELS,
  FIXED_DEPOSIT_RATES,
  SAVINGS_INTEREST_RATE,
} from '@nordi/shared/domain/types/Accounts.types';
