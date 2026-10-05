// Moved to the shared package - re-exported for backwards-compatible imports.
// This module both augments the global scope via `declare global` (side-effect
// import) and exports real named symbols, so both forms are re-exported here.
import '@nordi/shared/domain/types/Card.types';
export {
  CARD_BRANDS,
  PHYSICAL_CARD_ISSUANCE_FEE,
  MAX_CARDS_PER_USER,
} from '@nordi/shared/domain/types/Card.types';
export type {
  CardType,
  CardBrand,
  CardStatus,
  CardTransactionType,
  CardTransactionStatus,
  BillingAddress,
  ClientCard,
  CardLimits,
  CardControlsState,
  ClientCardTransaction,
  ShippingAddress,
  ActiveWallet,
} from '@nordi/shared/domain/types/Card.types';
