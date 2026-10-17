// SDK 52+ configures Metro for monorepos automatically (watch folders, node_modules
// lookup). The only addition: resolve react-jsonschema-ui and the shared samples to their
// TypeScript source, so library edits hot-reload without a rebuild.
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.unstable_conditionNames = [
  '@react-jsonschema-ui/source',
  ...(config.resolver.unstable_conditionNames ?? []),
];

module.exports = config;
