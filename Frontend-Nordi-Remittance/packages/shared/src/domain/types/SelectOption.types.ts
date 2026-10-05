// ============================================================================
// SELECT OPTION — Shared, explicit (non-ambient) version of the type used by
// `constants/form-options.ts`. The website additionally declares this shape
// globally in `types/ui.types.ts` for its own component props; that ambient
// declaration is compatible with this explicit one but stays website-local
// since it's a UI prop contract, not shared business data.
// ============================================================================

import type { ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
  description?: string;
}
