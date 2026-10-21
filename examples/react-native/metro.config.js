const path = require('node:path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

// A plain React Native CLI app inside the pnpm monorepo. Dependencies are
// hoisted to the repo root, so Metro watches it and resolves from there.
// react-jsonschema-ui resolves to its built dist (run `pnpm build` first),
// exactly what an app installing it from npm gets.
const root = path.resolve(__dirname, '../..');

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  watchFolders: [root],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules'), path.resolve(root, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
