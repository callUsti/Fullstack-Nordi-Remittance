const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Project & Workspace roots
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from (hoisted node_modules)
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, "node_modules"),
  path.resolve(projectRoot, "node_modules"),
];

// 3. Ensure single singleton instance for navigation and query contexts across monorepo
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@react-navigation/native": path.resolve(
    workspaceRoot,
    "node_modules/@react-navigation/native"
  ),
  "@tanstack/react-query": path.resolve(
    workspaceRoot,
    "node_modules/@tanstack/react-query"
  ),
};

module.exports = withNativeWind(config, { input: "./global.css" });