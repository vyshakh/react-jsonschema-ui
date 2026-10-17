import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';

// GitHub Pages serves project sites under /<repo>/; override with DOCS_BASE.
const base = process.env.DOCS_BASE ?? '/react-jsonschema-ui/';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? base : '/',
  plugins: [react()],
  resolve: {
    // Resolve the workspace package to its TypeScript source: no rebuild loop.
    conditions: ['@react-jsonschema-ui/source', ...defaultClientConditions],
    alias: { 'react-native': 'react-native-web' },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.mjs', '.js', '.jsx', '.json'],
  },
  define: {
    'process.env.TAMAGUI_TARGET': JSON.stringify('web'),
  },
}));
