// Moved to the shared package — re-exported for backwards-compatible imports.
// These are side-effect imports only: each module uses `declare global` to
// register ambient types, so merely importing them (without consuming named
// exports) is what makes the types available project-wide.

// Shared scalars, enums, and base interfaces
import '@nordi/shared/domain/types/Common.types';

// Per-model type files (alphabetical)
import '@nordi/shared/domain/types/Accounts.types';
import '@nordi/shared/domain/types/Admin.types';
import '@nordi/shared/domain/types/Attachment.types';
import '@nordi/shared/domain/types/Audit.types';
import '@nordi/shared/domain/types/Card.types';
import '@nordi/shared/domain/types/Confirm.types';
import '@nordi/shared/domain/types/FeatureGrowth.types';
import '@nordi/shared/domain/types/FraudSecurity.types';
import '@nordi/shared/domain/types/Integrations.types';
import '@nordi/shared/domain/types/Investments.types';
import '@nordi/shared/domain/types/LegalReports.types';
import '@nordi/shared/domain/types/Loans.types';
import '@nordi/shared/domain/types/Notifications.types';
import '@nordi/shared/domain/types/Permissions.types';
import '@nordi/shared/domain/types/Statistics.types';
import '@nordi/shared/domain/types/Transaction.types';
import '@nordi/shared/domain/types/TransferVerification.types';
import '@nordi/shared/domain/types/User.types';
