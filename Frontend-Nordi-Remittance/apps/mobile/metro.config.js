const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Find the workspace root (Frontend-Nordi-Remittance/)
const workspaceRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from (hoisted node_modules)
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(__dirname, "node_modules"),
];

module.exports = withNativeWind(config, { input: "./global.css" });