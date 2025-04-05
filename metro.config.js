const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Get the default config
const config = getDefaultConfig(__dirname);

// Add a resolver to help with cache issues
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver.sourceExts || []), "mjs"],
  // Ensure we're not using a corrupted cache
  resetCache: true,
  // Increase cache version to force refresh
  cacheVersion: Date.now().toString(),
};

// Ensure the cache directory exists
config.cacheStores = [];

// Add watchFolders to include node_modules
config.watchFolders = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "."),
];

module.exports = withNativeWind(config, { input: "./global.css" });
