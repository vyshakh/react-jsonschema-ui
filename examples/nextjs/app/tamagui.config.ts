import { animations } from '@tamagui/config/animations-css';
import { defaultConfig } from '@tamagui/config/v6';
import { createTamagui } from 'tamagui';

// Tamagui 3's default config with the CSS animation driver, which also lets
// the select widget adapt to a bottom sheet on touch screens.
export const config = createTamagui({
  ...defaultConfig,
  animations,
  // Let this app use longhand style props (the v6 types allow shorthands only).
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false },
});

type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
