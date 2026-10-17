import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-rn';
import { createTamagui } from 'tamagui';

export const config = createTamagui({
  ...defaultConfig,
  // React Native's Animated driver: no extra native modules, works in Expo Go.
  animations,
  // v5 restricts style props to shorthands at the type level only; react-jsonschema-ui
  // uses longhands, which work under any config.
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false },
});

type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
