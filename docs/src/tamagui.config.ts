import { defaultConfig } from '@tamagui/config/v5';
import { animations } from '@tamagui/config/v5-css';
import { createTamagui } from 'tamagui';

export const config = createTamagui({
  ...defaultConfig,
  animations,
  fonts: {
    ...defaultConfig.fonts,
    mono: { ...defaultConfig.fonts.body, family: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  },
  // v5 restricts style props to shorthands at the type level only. react-jsonschema-ui
  // uses longhands, which work under any config, so allow them here too.
  settings: { ...defaultConfig.settings, onlyAllowShorthands: false },
});

type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
