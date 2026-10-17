import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { TamaguiProvider, Theme } from 'tamagui';
import { App } from './App';
import { config } from './tamagui.config';

function Root() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Theme name={dark ? 'dark' : 'light'}>
        <App dark={dark} onToggleDark={() => setDark((value) => !value)} />
      </Theme>
    </TamaguiProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
