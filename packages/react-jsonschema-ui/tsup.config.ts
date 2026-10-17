import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts', core: 'src/core.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  // Hermes-safe syntax level.
  target: 'es2020',
  external: ['react', 'react-native', 'tamagui'],
});
