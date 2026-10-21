import { defaultConfig } from '@tamagui/config/v5';
import { createTamagui } from 'tamagui';
import { animations } from './animations';

export const config = createTamagui({
  ...defaultConfig,
  animations,
  // v5 restricts style props to shorthands at the type level only; react-jsonschema-ui
  // uses longhands, which work under any config.
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false },
});

type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
