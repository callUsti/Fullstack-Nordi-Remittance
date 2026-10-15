// ============================================================================
// @nordi/shared — root barrel
// ============================================================================
// Platform-agnostic core shared by the website and mobile apps. Prefer deep
// imports (e.g. `@nordi/shared/core/api/client`) in app code. Only conflict-
// free submodules are re-exported here; `core/algo` and `utils/helpers` each
// have their own barrel but are NOT flattened into this root index because
// they define overlapping helper names (e.g. `formatCurrency`) — import them
// directly via `@nordi/shared/core/algo` / `@nordi/shared/utils/helpers`.
// ============================================================================

export * from "./core/api";
export * from "./core/events/ws-events";
export * from "./core/lib/queryClient";
export * from "./core/lib/prefetch";
export * from "./core/socket/socket.client";
export * from "./core/platform";

export * from "./domain/repository";
import "./domain/types";
export * from "./domain/types/SelectOption.types";

export * from "./store";

export * from "./constants/colors";
export * from "./constants/sizes";
export * from "./constants/typography";
export * from "./constants/breakpoints";
export * from "./constants/form-options";

export * from "./utils/validators";
export * from "./hooks/api-queries/useLegal";
export * from "./client-usecase";
