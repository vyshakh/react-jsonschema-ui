import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Tamagui renders through react-native-web under jsdom.
  resolve: { alias: { 'react-native': 'react-native-web' } },
  define: { 'process.env.TAMAGUI_TARGET': JSON.stringify('web') },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    typecheck: { enabled: true, include: ['src/**/*.test-d.ts'] },
    server: { deps: { inline: [/tamagui/, /react-native-web/] } },
  },
});
