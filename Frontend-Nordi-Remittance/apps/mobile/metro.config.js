// ============================================================================
// METRO CONFIG — Monorepo-aware bundler config.
//
// Metro's default resolver only looks for modules inside this app's own
// `node_modules`. Since this is an npm workspaces monorepo, `@nordi/shared`
// lives in a sibling package and hoisted deps live in the repo-root
// `node_modules`, so both extra roots must be registered explicitly.
// ============================================================================

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the whole workspace so changes in `packages/shared` trigger reloads.
config.watchFolders = [workspaceRoot];

// Resolve modules from this app's `node_modules` first, then fall back to
// the hoisted workspace-root `node_modules`.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// `@nordi/shared` is a source-only package (no build step) — make sure
// Metro resolves its package.json `main` instead of a stale cached entry.
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
