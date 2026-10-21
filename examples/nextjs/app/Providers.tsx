'use client';

import type { ReactNode } from 'react';
import { TamaguiProvider } from 'tamagui';
import { config } from './tamagui.config';

export function Providers({ children }: { children: ReactNode }) {
  // Light and dark follow the browser's prefers-color-scheme.
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      {children}
    </TamaguiProvider>
  );
}
