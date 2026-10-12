# SKILLS.md

## Role

You are acting as a Staff/Principal Software Engineer responsible for auditing, migrating, configuring, and validating this repository as a modern production-grade monorepo.

You are not limited to a specific programming language, framework, runtime, or platform.

The repository may contain:

- Web applications
- Mobile applications
- Desktop applications
- Backend services
- APIs
- Workers
- CLI applications
- Native applications
- Infrastructure code
- Shared libraries
- Domain packages
- SDKs
- Configuration packages
- Generated clients
- Internal developer tooling

The current repository may contain legacy, partially working, duplicated, or conflicting monorepo configuration.

Your responsibility is to inspect the actual repository before making assumptions and then establish the cleanest supported architecture using current stable tooling.

---

# PRIMARY OBJECTIVE

Create a reliable monorepo where multiple applications can safely share code without:

- broken package resolution
- undeclared dependencies
- duplicate framework runtimes
- duplicate native modules
- fragile relative imports
- dependency version drift
- circular package dependencies
- accidental root dependency access
- stale workspace configuration
- obsolete bundler hacks
- multiple conflicting lockfiles
- unnecessary duplicated configuration
- application code depending directly on another application's internals

The final repository must have an explicit dependency graph and deterministic installation/build behavior.

---

# CURRENT PREFERRED JAVASCRIPT/TYPESCRIPT STACK

When this repository contains JavaScript or TypeScript applications, prefer:

- pnpm for package/workspace management
- Turborepo for task orchestration and caching
- explicit workspace packages
- strict dependency declarations
- a single workspace lockfile
- `workspace:` references for internal packages

Do NOT assume these choices for unrelated ecosystems where another native tool is more appropriate.

Examples:

- Rust → Cargo workspaces
- Go → Go workspaces/modules
- .NET → solution/project references
- Java/Kotlin → Gradle/Maven multi-project builds
- Python → appropriate modern Python workspace/package tooling

Turborepo may still orchestrate heterogeneous repositories when appropriate, but do not force JavaScript package-management concepts onto unrelated ecosystems.

---

# CRITICAL RULE: INSPECT BEFORE MODIFYING

Before changing anything, audit the repository.

Inspect at minimum:

- root directory structure
- Git status
- all package manifests
- workspace configuration
- lockfiles
- package-manager configuration
- Turbo configuration
- TypeScript configuration
- Babel configuration
- Metro configuration
- bundler configuration
- framework configuration
- CI/CD workflows
- Dockerfiles
- native Android/iOS configuration
- environment configuration
- import aliases
- internal package imports
- build scripts
- test scripts
- lint scripts
- generated code
- package `exports`
- package `main`
- package `module`
- package `types`
- peer dependencies
- native dependencies

Determine what is actually being used before deleting anything.

Never delete configuration merely because it looks old.

Prove that it is obsolete, duplicated, conflicting, or replaced by the target architecture.

---

# PHASE 1 — REPOSITORY AUDIT

Produce an internal inventory of the repository.

Identify:

1. Applications
2. Libraries/packages
3. Shared source directories
4. Package manager currently in use
5. All lockfiles
6. Existing workspace mechanisms
7. Existing Turborepo configuration
8. Build systems
9. Bundlers
10. Frameworks
11. Native projects
12. Shared dependencies
13. Internal package dependencies
14. Cross-application imports
15. Path aliases
16. Circular dependencies
17. Duplicate dependencies
18. Undeclared dependencies
19. Version conflicts
20. obsolete configuration

Do not begin migration until this dependency graph is understood.

---

# PHASE 2 — DETECT LEGACY NPM WORKSPACE CONFIGURATION

If migrating a JavaScript/TypeScript repository from npm workspaces to pnpm:

Search for:

- root `"workspaces"` fields
- `package-lock.json`
- nested `package-lock.json` files
- npm-specific workspace scripts
- `npm --workspace`
- `npm -w`
- `npm exec`
- `npx` commands that should use the selected package manager
- CI jobs using `npm install`
- CI jobs using `npm ci`
- Dockerfiles using npm
- deployment scripts using npm
- shell scripts using npm
- documentation instructing contributors to use npm
- npm-specific cache configuration

Migrate these intentionally.

Do NOT leave npm and pnpm simultaneously responsible for dependency installation.

After migration, there should normally be one authoritative JavaScript package manager and one authoritative lockfile.

For pnpm this should normally be:

`pnpm-lock.yaml`

Remove `package-lock.json` only after package manifests have been migrated and the new dependency graph has been successfully installed and validated.

---

# PHASE 3 — PNPM WORKSPACE

For a pnpm-based JavaScript/TypeScript monorepo, establish:

`pnpm-workspace.yaml`

Typical structure:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "services/*"
  - "tooling/*"
```

Only include directories that actually exist or are intentionally part of the architecture.

Do not preserve the root `package.json#workspaces` field merely because npm previously used it.

Use pnpm as the authoritative workspace definition.

---

# INTERNAL PACKAGE RESOLUTION

Internal packages must be real workspace dependencies.

Example:

```json
{
  "dependencies": {
    "@repo/shared": "workspace:*"
  }
}
```

Prefer `workspace:*` or another intentional `workspace:` range for internal packages.

Do NOT rely on:

```text
../../../packages/shared/src/...
```

from application code when that code represents a reusable package.

Avoid reaching into another package's private filesystem.

Bad:

```ts
import x from "../../../packages/shared/src/internal/x";
```

Preferred:

```ts
import { x } from "@repo/shared";
```

Packages must expose intentional public APIs.

---

# PACKAGE BOUNDARIES

Each reusable package must define a stable public boundary.

Where appropriate, configure package exports.

Example:

```json
{
  "name": "@repo/shared",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./auth": "./src/auth/index.ts",
    "./socket": "./src/socket/index.ts"
  }
}
```

Do not expose arbitrary internal files unless intentionally part of the package API.

Prefer explicit entry points over unrestricted deep imports.

---

# DEPENDENCY OWNERSHIP

Every package must explicitly declare the dependencies it imports.

Never rely on dependency hoisting.

If:

```ts
import something from "some-package";
```

appears inside package A, package A must declare the appropriate dependency unless the architecture intentionally defines it as a peer dependency.

Do not fix resolution errors by repeatedly installing random transitive dependencies at the repository root.

Find the package that owns the import and declare the dependency there.

This rule is especially important for packages such as:

- React
- React Native
- Expo
- framework runtimes
- authentication SDKs
- database clients
- native modules
- bundler plugins

---

# PEER DEPENDENCIES

Use peer dependencies when a shared package must consume the application's runtime instance rather than provide another copy.

Typical examples may include:

- React
- React DOM
- React Native
- framework runtimes
- plugin host libraries

Determine this package-by-package.

Do not mechanically convert every dependency into a peer dependency.

---

# SINGLETON RUNTIME PROTECTION

Prevent multiple incompatible instances of runtime-critical libraries.

For React ecosystems, specifically inspect:

- react
- react-dom
- react-native
- expo
- Expo modules
- React navigation libraries
- native modules
- context-producing libraries

There must not be multiple incompatible React instances inside a single application.

React Native applications must not resolve multiple incompatible React Native runtimes.

Use dependency inspection commands to determine why duplicates exist.

For pnpm, use commands such as:

```bash
pnpm why --depth=10 react
pnpm why --depth=10 react-native
pnpm why --depth=10 expo
```

Do not solve duplicate-runtime problems using aliases or forced resolutions unless the underlying dependency graph has first been understood.

---

# VERSION GOVERNANCE

Shared foundational dependencies should have deliberate version governance.

When useful, use pnpm catalogs to centralize versions used across multiple workspace packages.

Candidate dependencies include:

- TypeScript
- React
- React DOM
- linting tools
- testing tools
- formatting tools
- shared build tooling

Do not centralize versions merely for cosmetic consistency when applications legitimately require different versions.

Framework compatibility takes precedence over forced uniformity.

---

# TURBOREPO

Use Turborepo for task orchestration when appropriate.

Create or repair:

`turbo.json`

Tasks should reflect the actual repository.

Typical categories:

- build
- dev
- lint
- typecheck
- test
- clean

Example concept:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [
        "dist/**",
        "build/**",
        ".next/**",
        "!.next/cache/**"
      ]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Do not copy this configuration blindly.

Determine correct outputs and dependencies for each framework in the repository.

A task that produces no artifacts should not claim build outputs.

A development server should generally not be cached.

---

# TURBO DEPENDENCY GRAPH

Turbo's task graph must follow package dependencies.

If application A depends on package B and both expose a `build` task, Turbo should understand that B must build before A when required.

Do not manually duplicate orchestration logic that Turbo already derives from the workspace graph.

---

# ROOT PACKAGE

The root package should primarily orchestrate the repository.

Avoid turning the root into a dumping ground for application dependencies.

Root dependencies should generally be repository-wide tooling such as:

- turbo
- formatter
- lint infrastructure
- repository scripts
- shared developer tooling

Application runtime dependencies belong to the application or package that uses them.

---

# SHARED PACKAGE DESIGN

Do NOT create one enormous `shared` package containing unrelated code.

Prefer domain-oriented packages when the repository warrants them.

Possible examples:

```text
packages/
  api-client/
  auth/
  config/
  domain/
  schemas/
  types/
  ui/
  utils/
```

These are examples, not mandatory names.

Create packages based on actual architectural boundaries.

---

# CROSS-PLATFORM CODE

Shared code must distinguish between:

1. universal logic
2. web-specific logic
3. native-specific logic
4. server-only logic

Universal packages should avoid importing platform-specific APIs.

Do not allow shared domain code to accidentally depend on:

- DOM APIs
- Node-only APIs
- React Native APIs
- filesystem APIs
- browser globals

unless the package is explicitly platform-specific.

When required, use platform-specific entry points or adapters.

Examples may include:

```text
storage.ts
storage.native.ts
storage.web.ts
```

or separate packages where stronger boundaries are appropriate.

---

# REACT / REACT NATIVE / EXPO RULES

When an Expo application exists, follow the currently installed Expo SDK's supported architecture.

Do not copy historical monorepo Metro configuration without verifying that it is still required.

For modern Expo versions using `expo/metro-config`, prefer Expo's built-in monorepo support.

Audit `metro.config.js` for obsolete settings such as manually configured:

- watchFolders
- nodeModulesPaths
- extraNodeModules
- disableHierarchicalLookup

Remove legacy monorepo resolution hacks when the installed Expo SDK handles them automatically.

Preserve custom Metro configuration only when it serves a current, documented requirement.

After changing Metro resolution, clear its cache.

---

# PNPM + REACT NATIVE

Prefer pnpm's modern dependency model.

However, React Native/native libraries must be evaluated for compatibility with isolated dependency layouts.

If the installed Expo/React Native version supports isolated dependencies, prefer strict resolution.

If a specific native dependency is incompatible, diagnose the dependency first.

Do not immediately switch the entire repository to hoisted dependencies.

If `nodeLinker: hoisted` is genuinely required for compatibility, document:

- which dependency requires it
- why
- what error occurs without it
- whether the workaround can later be removed

Avoid permanent compatibility workarounds without documentation.

---

# TYPESCRIPT

Establish a maintainable TypeScript configuration hierarchy when TypeScript is present.

Prefer shared configuration packages or root base configs where useful.

For example:

```text
packages/
  typescript-config/
```

Possible configurations:

```text
base.json
react.json
react-native.json
node.json
```

Applications should extend the appropriate configuration rather than duplicating large compiler configurations.

Do not use TypeScript path aliases as a substitute for workspace dependencies.

A path alias:

```json
"@shared/*": ["../../packages/shared/src/*"]
```

does NOT establish a proper package dependency.

Workspace packages should resolve through the package manager.

Use path aliases primarily for internal organization inside a package/application when useful.

---

# PACKAGE EXPORTS

For reusable packages, evaluate modern package exports.

Support only the module formats actually required by consumers.

Do not generate CommonJS + ESM + source + declarations simply because a template does so.

Determine whether packages are:

- consumed directly as source
- bundled before consumption
- published
- private internal packages
- Node libraries
- browser libraries
- native libraries

Configure each accordingly.

---

# BUILD VS SOURCE PACKAGES

Decide intentionally whether each internal package is:

### Source package

Consumed directly from TypeScript/source by compatible applications.

or

### Build package

Compiled to output such as:

```text
dist/
```

before consumption.

Do not accidentally mix both models.

The decision should account for:

- bundler capabilities
- Node execution
- React Native/Metro
- publishing
- generated declarations
- server deployment
- tree shaking
- package exports

---

# CIRCULAR DEPENDENCIES

Detect cycles between workspace packages.

Example of forbidden architecture:

```text
@repo/auth -> @repo/shared -> @repo/auth
```

Refactor cycles by extracting lower-level abstractions where appropriate.

The dependency graph should preferably form a DAG.

Do not suppress cycle warnings without understanding them.

---

# ENVIRONMENT VARIABLES

Do not place every application's environment variables into one global file by default.

Separate:

- repository tooling variables
- application variables
- server secrets
- public client variables
- CI variables

Never expose server secrets through shared frontend packages.

Shared packages should receive configuration through explicit interfaces where practical.

---

# CI/CD

Update CI/CD after package-manager migration.

Replace obsolete npm installation commands.

Use the authoritative lockfile.

CI installation should be deterministic and should fail if the lockfile is stale.

Use Turbo filtering/caching when it materially improves the pipeline.

CI should include appropriate checks such as:

```text
install
lint
typecheck
test
build
```

depending on the repository.

Do not claim migration success if CI configuration still uses the old package manager.

---

# DOCKER

Audit Dockerfiles for old package-manager assumptions.

Use the same package manager and lockfile used by development and CI.

For large monorepos, consider Turbo pruning or equivalent techniques when appropriate to produce minimal deployment contexts.

Do not copy the entire monorepo into every production image without evaluating whether it is necessary.

---

# LOCKFILES

The repository should not contain competing JavaScript lockfiles.

During a pnpm migration, locate:

```text
package-lock.json
npm-shrinkwrap.json
yarn.lock
pnpm-lock.yaml
bun.lock
bun.lockb
```

Determine which belong to the active architecture.

Remove obsolete lockfiles only after validating the migration.

---

# PACKAGE MANAGER PINNING

Pin the intended package manager/version using the ecosystem's current supported mechanism.

For JavaScript repositories, use the `packageManager` field when appropriate.

Example concept:

```json
{
  "packageManager": "pnpm@<validated-version>"
}
```

Do not invent a version.

Determine and validate the version being adopted.

Also verify runtime compatibility.

---

# RUNTIME VERSION

Pin or document supported runtime versions.

For Node.js repositories, inspect:

- `engines`
- `.nvmrc`
- `.node-version`
- CI runtime versions
- Docker runtime versions
- deployment runtime versions

These should not silently contradict each other.

---

# DEPENDENCY INSTALLATION RULE

When fixing:

```text
Unable to resolve "X"
```

do NOT automatically install X at the root.

First determine:

1. Which workspace imports X?
2. Is X direct or transitive?
3. Should X be a dependency or peer dependency?
4. Is the importing package incorrectly relying on hoisting?
5. Is there a package-version mismatch?
6. Is the package's `exports` map preventing the import?
7. Is the dependency compatible with the current framework/runtime?
8. Is Metro/Webpack/Vite/etc. resolving the correct package instance?

Then fix the dependency at the correct ownership boundary.

---

# NEVER PATCH NODE_MODULES MANUALLY

Do not directly edit files under:

```text
node_modules/
```

as a permanent solution.

If an upstream package genuinely requires modification, use an appropriate reproducible patch mechanism and document why.

Prefer upgrading, replacing, or correctly configuring the dependency first.

---

# CLEAN MIGRATION

When moving from npm workspaces to pnpm + Turbo, perform the migration in controlled stages.

Typical sequence:

1. Audit repository.
2. Record current build/test state.
3. Inspect dependency graph.
4. Choose and pin package manager.
5. Create pnpm workspace configuration.
6. Convert internal dependencies to workspace references.
7. Fix package ownership.
8. Remove obsolete npm workspace declarations.
9. Remove obsolete lockfiles.
10. Remove stale `node_modules`.
11. Install from repository root.
12. Resolve peer/version conflicts.
13. Configure Turbo.
14. Remove obsolete monorepo hacks.
15. Update scripts.
16. Update CI.
17. Update Docker/deployment.
18. Update documentation.
19. Run validation.
20. Report changes.

Adapt this sequence when repository constraints require it.

---

# VALIDATION

Migration is NOT complete merely because installation succeeds.

Validate every affected application.

At minimum, where applicable:

```text
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then validate application-specific workflows.

For React Native/Expo:

- Metro starts successfully
- Android bundle succeeds
- iOS bundle succeeds where environment permits
- web bundle succeeds if supported
- Expo dependency checks succeed
- native autolinking resolves expected modules
- no duplicate React Native runtime exists
- no duplicate incompatible React runtime exists

For web applications:

- development server starts
- production build succeeds
- SSR/SSG works where applicable

For backend services:

- compilation succeeds
- service starts
- tests pass
- generated clients resolve correctly

---

# CLEAN INSTALL TEST

After configuration stabilizes, perform a clean-install test.

Remove generated dependency/install artifacts that are safe to regenerate, then install from the repository root using only the selected package manager.

The repository must not depend on stale local `node_modules` state.

A fresh clone should be reproducible from committed files.

---

# IMPORT VALIDATION

Search for imports that bypass package boundaries.

Examples:

```text
../../packages/
../../../packages/
apps/other-app/
```

Determine whether each should become a workspace dependency.

Applications should not generally import another application's private source.

Move reusable code into packages.

---

# ARCHITECTURAL DIRECTION

Prefer:

```text
apps/
  mobile/
  web/
  admin/
  api/

packages/
  auth/
  domain/
  api-client/
  schemas/
  types/
  ui/
  utils/
  config/

tooling/
```

ONLY when justified by the actual repository.

Do not reorganize working code simply to match this example.

Architecture should follow domain and deployment boundaries.

---

# SHARED UI

Do not assume React DOM components can run directly in React Native.

If web and native share UI, determine whether the repository uses:

- platform-specific components
- React Native Web
- a cross-platform design system
- separate native/web implementations
- shared headless logic with platform-specific rendering

Share business logic aggressively where appropriate.

Share rendering code only where the platform model supports it cleanly.

---

# SHARED BUSINESS LOGIC

Good candidates for shared packages include:

- domain models
- validation schemas
- API contracts
- API clients
- authentication state abstractions
- state machines
- business rules
- formatting utilities
- date logic
- generated types
- serialization
- feature flags
- shared hooks when runtime-compatible

Avoid placing platform-specific side effects into universal packages.

---

# SECURITY

During migration:

- do not print secrets
- do not commit `.env` secrets
- do not weaken dependency security simply to make installation pass
- inspect suspicious install scripts
- preserve registry authentication safely
- do not copy user-level package-manager credentials into repository configuration

Package-manager configuration committed to Git must not contain private authentication tokens.

---

# CURRENT DOCUMENTATION REQUIREMENT

Before introducing or changing major infrastructure tooling:

1. Determine the installed/current version.
2. Consult current official documentation when available.
3. Verify that proposed configuration applies to that version.
4. Avoid copying configuration from old tutorials, Stack Overflow answers, or deprecated templates.
5. Prefer official framework/package-manager documentation.
6. Record compatibility-driven exceptions.

This is particularly important for:

- pnpm
- Turborepo
- Expo
- React Native
- Metro
- Node.js
- TypeScript
- framework build systems

---

# DO NOT OVERCONFIGURE

Use the minimum configuration necessary.

Do not add:

- custom resolvers
- custom Babel plugins
- custom Metro aliases
- module-resolution hacks
- forced hoisting
- overrides
- patches
- custom build scripts

unless there is a demonstrated requirement.

Modern tooling should be allowed to use its supported defaults whenever possible.

---

# ERROR HANDLING

When a command fails:

Do not blindly continue.

Determine whether the failure comes from:

- workspace resolution
- dependency ownership
- peer dependency mismatch
- incompatible package versions
- runtime incompatibility
- stale cache
- native autolinking
- package exports
- TypeScript resolution
- bundler resolution
- operating-system differences
- generated files
- environment configuration

Fix the cause, not merely the symptom.

---

# CHANGE SAFETY

Do not perform destructive changes without understanding their impact.

Before major migration steps:

- inspect Git status
- preserve user code
- avoid modifying unrelated business logic
- avoid formatting the entire repository unnecessarily
- avoid mass dependency upgrades unrelated to the migration

Infrastructure migration should produce focused, reviewable changes.

---

# COMPLETION CRITERIA

Do not declare success until all relevant criteria are satisfied:

- one authoritative package manager
- one authoritative JavaScript lockfile
- valid workspace configuration
- internal packages resolve through workspace dependencies
- no obsolete npm workspace configuration remains
- Turbo task graph is valid
- dependencies are declared by their owners
- no accidental root dependency reliance
- no known incompatible duplicate runtimes
- shared packages expose intentional APIs
- TypeScript resolves packages correctly
- Metro resolves React Native packages correctly
- web bundler resolves packages correctly
- native autolinking succeeds
- development commands work
- production builds work
- lint/typecheck/tests pass where configured
- CI uses the new architecture
- Docker/deployment configuration uses the new architecture
- documentation reflects the new workflow
- clean installation succeeds

---

# FINAL REPORT

After completing the work, provide a concise engineering report containing:

## Architecture

Describe the resulting repository architecture.

## Package Manager

State the selected package manager and why it fits the repository.

## Workspace

Describe workspace boundaries.

## Shared Packages

List shared packages and their responsibilities.

## Dependency Resolution

Explain how internal packages are resolved.

## Turborepo

Describe tasks, dependency relationships, caching, and filters introduced.

## Removed Legacy Configuration

List obsolete npm/workspace/Metro/build configuration removed.

## Compatibility Decisions

Document any necessary exceptions such as hoisting, package overrides, or patches.

## Validation

List commands executed and whether they passed.

## Remaining Risks

State anything that could not be fully validated.

Never claim that a command, platform, or build succeeded unless it was actually executed successfully.

---

# EXECUTION PRINCIPLE

The goal is not merely:

> "make the imports work."

The goal is:

> Establish a deterministic, maintainable, dependency-correct monorepo in which applications and libraries have explicit boundaries, shared code is consumed through real package relationships, package resolution behaves consistently across local development, CI and production, and obsolete configuration has been removed without introducing unnecessary compatibility hacks.

Treat dependency-resolution failures as architectural signals.

Fix ownership and boundaries first.

Use configuration hacks only when the platform genuinely requires them.